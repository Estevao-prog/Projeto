import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { initTextures } from './textures.js';
import { initMaterials, registry } from './props.js';
import { loadModels, MODEL_FILES } from './models.js';
import { buildWorld } from './world.js';
import { updateTweens, tween, Ease } from './tween.js';
import { UI } from './ui.js';
import { SFX } from './audio.js';
import { Game } from './game.js';
import { Effects } from './effects.js';

// ---------------------------------------------------------------------------
// Renderer, cena e câmera
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07060a);
scene.fog = new THREE.FogExp2(0x0b0709, 0.012); // leve névoa de bar enfumaçado

// mapa de ambiente para reflexos dos metais (latão, revólver, cromados)
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const BASE_FOV = 55;
const POV_FOV = 70;
const camera = new THREE.PerspectiveCamera(BASE_FOV, window.innerWidth / window.innerHeight, 0.02, 200);
camera.position.set(0, 17, 27);

// ---------------------------------------------------------------------------
// OrbitControls: rotação (botão esquerdo), zoom (roda), pan (botão direito)
// ---------------------------------------------------------------------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, -1);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.8;
controls.maxDistance = 48;
controls.maxPolarAngle = Math.PI / 2 - 0.03; // não deixa a câmera ir para baixo do piso
controls.screenSpacePanning = true;
controls.update();

// ---------------------------------------------------------------------------
// Pós-processamento: bloom (brilho) no neon, lâmpadas e brasas dos charutos.
// O limiar é alto (HDR) para só os objetos emissivos brilharem, não as superfícies iluminadas.
// ---------------------------------------------------------------------------
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.55, 6);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------------------------------------------------------------------------
// "Diretor" de câmera: presets por setor e movimentos suaves
// ---------------------------------------------------------------------------
const PRESETS = {
  geral:   { pos: [0, 17, 27],      target: [0, 0, -1] },
  entrada: { pos: [-5.5, 4.2, 6.5], target: [0.5, 1.4, 13.8] },
  bar:     { pos: [-6, 4.6, 3.5],   target: [-14.5, 1.1, -4] },
  mesa:    { pos: [0, 3.6, 3.4],    target: [0, 0.85, -2.3] },
  salao:   { pos: [5.5, 4.6, 5.5],  target: [13.5, 1.4, -6] },
  placar:  { pos: [12.5, 3.0, -7.6], target: [12.5, 2.7, -15.9] },
};

let shakeTime = 0;
let camJob = 0; // um movimento novo cancela o anterior

// Modo "primeira pessoa": a câmera fica parada nos olhos do personagem e
// arrastar o mouse apenas gira o olhar (OrbitControls com alvo bem próximo).
function setLookMode(on) {
  if (on) {
    const dir = controls.target.clone().sub(camera.position).normalize();
    controls.target.copy(camera.position).addScaledVector(dir, 0.05);
    controls.minDistance = 0.01;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.rotateSpeed = 0.35;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = Math.PI - 0.35;
  } else {
    controls.minDistance = 0.8;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.rotateSpeed = 1;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
  }
  controls.update();
}
let shakeAmp = 0;

const director = {
  flyTo(pos, target, duration = 1.4, ease = Ease.inOutCubic, fov = BASE_FOV) {
    const id = ++camJob;
    setLookMode(false);
    controls.minDistance = 0.01; // durante o voo a câmera pode chegar bem perto do alvo
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    const f0 = camera.fov;
    return tween({
      duration,
      ease,
      onUpdate: (k) => {
        if (id !== camJob) return;
        camera.position.lerpVectors(p0, pos, k);
        controls.target.lerpVectors(t0, target, k);
        camera.fov = THREE.MathUtils.lerp(f0, fov, k);
        camera.updateProjectionMatrix();
        if (k >= 1) controls.minDistance = Math.min(0.8, camera.position.distanceTo(target));
      },
    });
  },
  // vai até os olhos do personagem e libera o "olhar em volta"
  async enterPOV(eye, look, duration = 1.2) {
    const id = camJob + 1;
    await this.flyTo(eye, look, duration, Ease.inOutCubic, POV_FOV);
    if (id === camJob) setLookMode(true);
  },
  preset(name, duration = 1.4) {
    const p = PRESETS[name];
    return this.flyTo(new THREE.Vector3(...p.pos), new THREE.Vector3(...p.target), duration);
  },
  shake(duration = 0.4, amplitude = 0.1) {
    shakeTime = duration;
    shakeAmp = amplitude;
  },
};

// ---------------------------------------------------------------------------
// Carregamento (texturas + modelos GLB) com barra de progresso
// ---------------------------------------------------------------------------
const ui = new UI();
const sfx = new SFX();
const manager = new THREE.LoadingManager();
manager.onProgress = (url, loaded, total) => ui.setLoading(loaded / total, `Carregando ${url.split('/').pop()}...`);

initTextures(manager, renderer);
initMaterials();

const mixers = [];
let world, game, neonLight, effects;

loadModels(manager).then((models) => {
  world = buildWorld(scene, models);
  neonLight = world.lights.neonPink;

  // intensidade dos reflexos: metais refletem mais, o resto quase nada
  scene.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (m && m.isMeshStandardMaterial) m.envMapIntensity = m.metalness > 0.5 ? 0.9 : 0.25;
    }
  });

  // animações dos modelos GLB
  const dealerAnim = setupDealer(models.robot);
  if (models.soldier) {
    const mixer = new THREE.AnimationMixer(models.soldier.scene);
    const idle = models.soldier.animations.find((a) => a.name === 'Idle');
    if (idle) mixer.clipAction(idle).play();
    mixers.push(mixer);
  }

  effects = new Effects(scene);
  game = new Game({ scene, world, director, ui, sfx, dealerAnim, effects });
  ui.bindGore(() => (game.gore = !game.gore));
  game.onMenu = openMenu;

  ui.renderRequirements(requirementsHTML(models));
  ui.bindCameraButtons((name) => director.preset(name));
  ui.bindSound(() => sfx.toggle());
  ui.bindMenu(openMenu);
  ui.hideLoading();
  openMenu();

  const missing = Object.entries(models).filter(([, v]) => !v).map(([k]) => MODEL_FILES[k]);
  if (missing.length) {
    console.warn('Modelos não carregados:', missing);
    ui.status('Atenção: algum modelo não carregou', 'Abra o projeto por um servidor local (veja o README).');
  }
});

function openMenu() {
  game.abort();
  ui.status('Última Carta', 'Explore o cassino com o mouse');
  ui.showSetup(
    (names) => {
      sfx.unlock();
      game.start(names);
    },
    () => {
      sfx.unlock();
      ui.status('Modo exploração', 'Use os botões de câmera ou o mouse para visitar os setores');
      director.preset('geral');
    },
  );
}

// Robô crupiê: Idle em loop + emotes que voltam para Idle
function setupDealer(robot) {
  if (!robot) return { emote() {} };
  const mixer = new THREE.AnimationMixer(robot.scene);
  mixers.push(mixer);
  const actions = {};
  for (const clip of robot.animations) actions[clip.name] = mixer.clipAction(clip);
  let active = actions.Idle;
  active.play();

  const fadeTo = (name, loopForever = false) => {
    const next = actions[name];
    if (!next) return;
    next.reset();
    next.setLoop(loopForever ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    next.clampWhenFinished = !loopForever;
    if (active !== next) active.fadeOut(0.25);
    next.fadeIn(0.25).play();
    active = next;
  };
  mixer.addEventListener('finished', () => fadeTo('Idle', true));
  return { emote: fadeTo };
}

// ---------------------------------------------------------------------------
// Painel "Requisitos": confere os itens pedidos no trabalho
// ---------------------------------------------------------------------------
function requirementsHTML(models) {
  const types = new Map();
  const sectors = new Map();
  for (const r of registry) {
    types.set(r.type, (types.get(r.type) || 0) + 1);
    sectors.set(r.sector, (sectors.get(r.sector) || 0) + 1);
  }
  const glbCount = Object.values(models).filter(Boolean).length;
  const ok = (cond) => (cond ? '<span class="ok">✔</span>' : '✘');
  return `
    <h4>Checklist do projeto</h4>
    <ul>
      <li>${ok(sectors.size >= 3)} Setores: <b>${sectors.size}</b> (${[...sectors].map(([s, n]) => `${s}: ${n}`).join(' · ')})</li>
      <li>${ok(registry.length >= 20)} Elementos 3D: <b>${registry.length}</b> (mínimo 20)</li>
      <li>${ok(types.size >= 8)} Tipos diferentes: <b>${types.size}</b> (mínimo 8)</li>
      <li>${ok(glbCount >= 3)} Modelos .glb via GLTFLoader: <b>${glbCount}</b> (${Object.values(MODEL_FILES).map((f) => f.split('/').pop()).join(', ')})</li>
      <li>${ok(true)} Texturas de arquivo: <b>4</b> de cor (madeira, tijolo, piso xadrez, caixote) + relevo/rugosidade + texturas de canvas (feltro, cartas, tapete, placas, rótulos)</li>
      <li>${ok(true)} Scene, PerspectiveCamera, WebGLRenderer, luzes (hemisférica, spot, direcional, pontuais) e piso</li>
      <li>${ok(true)} OrbitControls (rotação, zoom e pan)</li>
    </ul>
    <h4>Tipos de elementos</h4>
    <div>${[...types].map(([t, n]) => `${t} (${n})`).join(' · ')}</div>`;
}

// ---------------------------------------------------------------------------
// Loop de renderização
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();
const shakeOffset = new THREE.Vector3();

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  const t = clock.elapsedTime;

  // remove o tremor do quadro anterior antes de qualquer cálculo de câmera
  camera.position.sub(shakeOffset);
  shakeOffset.set(0, 0, 0);

  updateTweens(dt);
  for (const m of mixers) m.update(dt);
  if (game) game.update(dt, t);
  if (effects) effects.update(dt);
  if (world) world.table.smoke.userData.update(dt, t);

  // neon da entrada piscando de vez em quando
  if (neonLight) neonLight.intensity = Math.sin(t * 23) > 0.97 ? 4 : 22;

  controls.update();

  // tremor de câmera (disparo)
  if (shakeTime > 0) {
    shakeTime -= dt;
    const a = shakeAmp * Math.max(shakeTime, 0) * 2;
    shakeOffset.set((Math.random() - 0.5) * a, (Math.random() - 0.5) * a, (Math.random() - 0.5) * a);
    camera.position.add(shakeOffset);
  }

  composer.render();
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// usado só para depuração no console do navegador
window.__cassino = { renderer, composer, scene, camera, controls, director, registry, tween, get game() { return game; } };
