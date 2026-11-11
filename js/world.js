import * as THREE from 'three';
import { fileTexture, dataTexture, TEX, feltTexture, carpetTexture, signTexture } from './textures.js';
import {
  MAT, register,
  createChair, createStool, createRoundTable, createCoffeeTable, createSofa, createBarCounter, createBeerTap,
  createBottle, createGlass, createShelf, createJukebox, createPlant, createCoatRack, createStanchion, createRope,
  createReception, createCrate, createBarrel, createSlotMachine, createPoolTable, createTrophy, createDartboard,
  createPendantLamp, createHangingSign, createNeonSign, createDoorway, createChipStack, createDeck, createRevolver,
} from './props.js';
import { createWhiskyBottle, createTumbler, createAshtray, createCigarettePack, createCigarBox, createSmoke, createLightCone } from './tableprops.js';
import { Animal, ANIMALS } from './characters.js';
import { wrapModel } from './models.js';

// ---------------------------------------------------------------------------
// Dimensões do salão e da mesa principal
// ---------------------------------------------------------------------------
export const ROOM = { minX: -18, maxX: 18, minZ: -16, maxZ: 16, height: 5.5 };
export const TABLE_CENTER = new THREE.Vector3(0, 0, -2);
export const TABLE_TOP = 0.802;
export const SEAT_RADIUS = 2.15;
// 5 cadeiras (graus a partir de +z, sentido horário visto de cima). O crupiê fica em 180°.
export const SEAT_ANGLES = [-110, -55, 0, 55, 110].map(THREE.MathUtils.degToRad);
export const DEALER_ANGLE = Math.PI;
// Quais cadeiras são usadas para cada quantidade de jogadores
export const SEATS_FOR = { 2: [1, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4] };
export const PLAYER_COLORS = ['#e63946', '#2a9df4', '#f4c430', '#2ec27e'];

// Ponto em volta da mesa (ângulo θ, raio r)
export function aroundTable(theta, r, y = 0) {
  return new THREE.Vector3(TABLE_CENTER.x + Math.sin(theta) * r, y, TABLE_CENTER.z + Math.cos(theta) * r);
}

function place(obj, x, y, z, rotY = 0) {
  obj.position.set(x, y, z);
  obj.rotation.y = rotY;
  return obj;
}

// ---------------------------------------------------------------------------
// Estrutura: piso, paredes, divisórias (não contam como elementos)
// ---------------------------------------------------------------------------
function buildStructure(scene) {
  const W = ROOM.maxX - ROOM.minX;
  const D = ROOM.maxZ - ROOM.minZ;

  // piso principal de madeira
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({
      map: fileTexture(TEX.wood, W / 3, D / 3),
      roughnessMap: dataTexture(TEX.woodRough, W / 3, D / 3),
      bumpMap: dataTexture(TEX.woodBump, W / 3, D / 3),
      bumpScale: 1.5,
      roughness: 0.9,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // piso xadrez da entrada
  const entryFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 6.4),
    new THREE.MeshStandardMaterial({ map: fileTexture(TEX.checker, 7, 3.2), roughness: 0.35 }),
  );
  entryFloor.rotation.x = -Math.PI / 2;
  entryFloor.position.set(0, 0.006, 12.8);
  entryFloor.receiveShadow = true;
  scene.add(entryFloor);

  // tapete vermelho da arena (área da mesa)
  const carpetTex = carpetTexture();
  carpetTex.repeat.set(6, 6);
  const arena = new THREE.Mesh(new THREE.CircleGeometry(4.6, 64), new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.95 }));
  arena.rotation.x = -Math.PI / 2;
  arena.position.set(TABLE_CENTER.x, 0.008, TABLE_CENTER.z);
  arena.receiveShadow = true;
  scene.add(arena);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.04, 8, 96), MAT.brass);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(TABLE_CENTER.x, 0.02, TABLE_CENTER.z);
  scene.add(ring);

  // paredes de tijolo (planos voltados para dentro: de fora ficam invisíveis,
  // o que deixa a câmera ver o interior como uma "casa de bonecas")
  const H = ROOM.height;
  const wallMat = (w) => new THREE.MeshStandardMaterial({
    map: fileTexture(TEX.brick, w / 2.5, H / 2.5),
    bumpMap: dataTexture(TEX.brickBump, w / 2.5, H / 2.5),
    bumpScale: 3,
    roughness: 0.92,
  });
  const wall = (w, h, x, y, z, rotY) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat(w));
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    m.receiveShadow = true;
    scene.add(m);
  };
  wall(W, H, 0, H / 2, ROOM.minZ, 0);                       // fundo
  wall(D, H, ROOM.minX, H / 2, 0, Math.PI / 2);             // esquerda
  wall(D, H, ROOM.maxX, H / 2, 0, -Math.PI / 2);            // direita
  // frente, com vão da porta (3 m x 3.2 m)
  const sideW = (W - 3) / 2;
  wall(sideW, H, ROOM.minX + sideW / 2, H / 2, ROOM.maxZ, Math.PI);
  wall(sideW, H, ROOM.maxX - sideW / 2, H / 2, ROOM.maxZ, Math.PI);
  wall(3, H - 3.2, 0, 3.2 + (H - 3.2) / 2, ROOM.maxZ, Math.PI);

  // rodapé escuro
  const skirting = new THREE.MeshStandardMaterial({ color: 0x24140c, roughness: 0.6 });
  for (const [w, x, z, ry] of [[W, 0, ROOM.minZ + 0.03, 0], [D, ROOM.minX + 0.03, 0, Math.PI / 2], [D, ROOM.maxX - 0.03, 0, Math.PI / 2]]) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, 0.06), skirting);
    s.position.set(x, 0.125, z);
    s.rotation.y = ry;
    scene.add(s);
  }

  // vigas do teto (estrutura)
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x2a180e, roughness: 0.7 });
  for (let x = -15; x <= 15; x += 6) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, D), beamMat);
    beam.position.set(x, H - 0.18, 0);
    beam.castShadow = false;
    scene.add(beam);
  }

  // divisórias baixas (balaustradas) separando os setores
  const railing = (x1, z1, x2, z2) => {
    const a = new THREE.Vector3(x1, 0, z1), b = new THREE.Vector3(x2, 0, z2);
    const len = a.distanceTo(b);
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.12), MAT.woodDark);
    top.position.y = 1.0;
    top.castShadow = true;
    g.add(top);
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.1), MAT.darkWood);
    bottom.position.y = 0.1;
    g.add(bottom);
    const n = Math.max(2, Math.round(len / 0.35));
    const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8);
    for (let i = 0; i <= n; i++) {
      const p = new THREE.Mesh(postGeo, MAT.darkWood);
      p.position.set(-len / 2 + (i / n) * len, 0.55, 0);
      p.castShadow = true;
      g.add(p);
    }
    g.position.copy(a.clone().lerp(b, 0.5));
    g.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
    scene.add(g);
  };
  railing(-7, 9.6, -2, 9.6);   // entrada | salão
  railing(2, 9.6, 7, 9.6);
  railing(-7, 9.6, -7, 3);     // bar | centro
  railing(-7, -2, -7, -14);
  railing(7, 9.6, 7, 3);       // centro | salão de jogos
  railing(7, -2, 7, -14);
}

// ---------------------------------------------------------------------------
// Iluminação
// ---------------------------------------------------------------------------
function buildLights(scene) {
  scene.add(new THREE.HemisphereLight(0xffe2c4, 0x2a1410, 0.4));

  // luz principal sobre a mesa do 21 (com sombra)
  const spot = new THREE.SpotLight(0xffd9a0, 150, 14, 0.58, 0.6, 1.6);
  spot.position.set(TABLE_CENTER.x, 4.6, TABLE_CENTER.z);
  spot.target.position.copy(TABLE_CENTER);
  spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048);
  spot.shadow.bias = -0.0005;
  scene.add(spot, spot.target);

  // luz geral fraca de cima (com sombra suave)
  const dir = new THREE.DirectionalLight(0xffd9b0, 0.38);
  dir.position.set(6, 14, 8);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.left = -20;
  dir.shadow.camera.right = 20;
  dir.shadow.camera.top = 18;
  dir.shadow.camera.bottom = -18;
  dir.shadow.bias = -0.0008;
  scene.add(dir);

  const point = (color, intensity, x, y, z, dist = 12) => {
    const l = new THREE.PointLight(color, intensity, dist, 1.6);
    l.position.set(x, y, z);
    scene.add(l);
    return l;
  };
  // bar (luz âmbar)
  point(0xffa850, 18, -14.5, 3.2, -9);
  point(0xffa850, 18, -14.5, 3.2, -4);
  point(0xffb870, 14, -13, 3, 5);
  // entrada (neon rosa + azul)
  const neonPink = point(0xff2d6f, 22, 0, 3.6, 14.5, 10);
  point(0x3d7bff, 12, 0, 3, 11, 10);
  // salão de jogos
  point(0x7cc7ff, 16, 12.5, 3.4, -9);
  point(0xffd28a, 18, 12.5, 3.2, 1);
  point(0xffd28a, 12, 12.5, 3, 7);
  // fundo do salão principal
  point(0xffc890, 10, 0, 3.4, -11);

  return { spot, neonPink };
}

// ---------------------------------------------------------------------------
// SETOR 1 — ENTRADA
// ---------------------------------------------------------------------------
function buildEntrance(scene, models) {
  const S = 'Entrada';
  scene.add(register(place(createDoorway(3, 3.2), 0, 0, ROOM.maxZ - 0.15), 'Porta', S));

  const neon = createNeonSign('ÚLTIMA CARTA', '#ff2d6f', 5, 1.25);
  scene.add(register(place(neon, 0, 4.25, ROOM.maxZ - 0.1, Math.PI), 'Letreiro neon', S));

  // corredor de fila com pedestais e cordas
  const posts = [[-3.2, 15], [-3.2, 13.4], [-3.2, 11.8], [-1.8, 11.8]];
  const tops = [];
  for (const [x, z] of posts) {
    scene.add(register(place(createStanchion(), x, 0, z), 'Pedestal com corda', S));
    tops.push(new THREE.Vector3(x, 0.92, z));
  }
  for (let i = 0; i < tops.length - 1; i++) scene.add(createRope(tops[i], tops[i + 1]));

  scene.add(register(place(createReception(), -5.2, 0, 13.4, Math.PI / 2), 'Recepção / caixa', S));
  scene.add(register(place(createCoatRack(), 5.8, 0, 15.2), 'Cabideiro', S));
  scene.add(register(place(createPlant(1.1), -2.2, 0, 15.4), 'Planta', S));
  scene.add(register(place(createPlant(1.1), 2.2, 0, 15.4), 'Planta', S));
  scene.add(register(place(createPlant(0.9), -6.4, 0, 10.4), 'Planta', S));

  // quadro com as regras da casa
  const rules = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.6),
    new THREE.MeshStandardMaterial({
        map: signTexture('REGRAS DA CASA', {
          width: 1024, height: 640, font: 'bold 90px Georgia',
          sub: '21 contra a banca · estourou ou perdeu = roleta',
        }),
        roughness: 0.7,
      }),
  );
  scene.add(register(place(rules, -5.4, 2.3, ROOM.maxZ - 0.05, Math.PI), 'Painel', S));

  // modelo GLB: segurança na porta
  if (models.soldier) {
    const guard = wrapModel(models.soldier.scene, 1.85);
    place(guard, 2.6, 0, 14.4, -0.35);
    scene.add(register(guard, 'Segurança (GLB)', S, true));
  }

  scene.add(register(place(createHangingSign('ENTRADA', 'bem-vindo ao Última Carta', 3.6, 0.9), 0, 3.7, 9.6), 'Placa de setor', S));
}

// ---------------------------------------------------------------------------
// SETOR 2 — BAR & LOUNGE
// ---------------------------------------------------------------------------
function buildBar(scene, models) {
  const S = 'Bar & Lounge';
  scene.add(register(place(createBarCounter(9), -14.6, 0, -7.5), 'Balcão do bar', S));
  scene.add(register(place(createShelf(7), -17.75, 0, -7.5), 'Estante', S));
  scene.add(register(place(createBeerTap(), -14.5, 1.12, -10.5), 'Chopeira', S));

  // garrafas na estante (cada uma é um objeto independente)
  const mats = [MAT.glassGreen, MAT.glassAmber, MAT.glassClear];
  let i = 0;
  for (const y of [1.225, 1.775]) {
    for (let z = -10.6; z <= -4.4; z += 0.9) {
      const b = createBottle(mats[i % 3], 0.3 + (i % 2) * 0.06);
      scene.add(register(place(b, -17.42, y, z + (y > 1.5 ? 0.45 : 0)), 'Garrafa', S));
      i++;
    }
  }
  // copos no balcão
  for (const z of [-8.6, -6.2, -4.4]) scene.add(register(place(createGlass(), -14.35, 1.12, z), 'Copo', S));

  for (let z = -11; z <= -3.5; z += 1.5) scene.add(register(place(createStool(), -13.3, 0, z), 'Banqueta', S));

  // lounge
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.6), new THREE.MeshStandardMaterial({ map: carpetTexture('#2c1a3a', '#3e2752', '#b38a3c'), roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-13.4, 0.01, 4.6);
  rug.receiveShadow = true;
  scene.add(rug);
  scene.add(register(place(createSofa(), -16.4, 0, 4.6, Math.PI / 2), 'Sofá', S));
  scene.add(register(place(createCoffeeTable(), -14.6, 0, 4.6, Math.PI / 2), 'Mesa de centro', S));
  scene.add(register(place(createGlass(), -14.5, 0.45, 4.3), 'Copo', S));
  scene.add(register(place(createBottle(MAT.glassAmber, 0.3), -14.75, 0.45, 4.9), 'Garrafa', S));
  scene.add(register(place(createJukebox(), -16.9, 0, 8.6, Math.PI / 2 + 0.5), 'Jukebox', S));
  scene.add(register(place(createPlant(1.2), -17.2, 0, 0.9), 'Planta', S));

  // modelos GLB: poltronas e luminária de chão
  if (models.chair) {
    const a = wrapModel(models.chair.scene, 0.95);
    scene.add(register(place(a, -11.6, 0, 3.4, -Math.PI / 2 - 0.4), 'Poltrona (GLB)', S, true));
    const b = wrapModel(models.chair.scene, 0.95, { clone: true });
    scene.add(register(place(b, -11.6, 0, 5.9, -Math.PI / 2 + 0.4), 'Poltrona (GLB)', S, true));
  }
  if (models.lamp) {
    const lamp = wrapModel(models.lamp.scene, 1.9);
    // a luz embutida no GLB (KHR_lights_punctual) é forte demais para o ambiente
    lamp.traverse((o) => { if (o.isLight) { o.intensity *= 0.08; o.color.set(0xffd9a0); o.castShadow = false; } });
    scene.add(register(place(lamp, -17.1, 0, 7.0, Math.PI / 2), 'Luminária de chão (GLB)', S, true));
  }

  // estoque: caixotes e barris no fundo
  scene.add(register(place(createCrate(0.8), -16.8, 0, -14.6, 0.2), 'Caixote', S));
  scene.add(register(place(createCrate(0.8), -15.9, 0, -14.8, -0.1), 'Caixote', S));
  scene.add(register(place(createCrate(0.6), -16.4, 0.8, -14.7, 0.5), 'Caixote', S));
  scene.add(register(place(createBarrel(), -13.6, 0, -14.8), 'Barril', S));
  scene.add(register(place(createBarrel(), -12.8, 0, -14.6), 'Barril', S));

  scene.add(register(place(createHangingSign('BAR & LOUNGE', 'bebidas por conta da casa', 3.8, 0.9), -10.5, 3.9, -3.5, Math.PI / 2), 'Placa de setor', S));
}

// ---------------------------------------------------------------------------
// SETOR 3 — MESA DO 21 (espaço principal)
// ---------------------------------------------------------------------------
function createGameTable() {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.45, 0.08, 64), MAT.darkWood);
  top.position.y = TABLE_TOP - 0.04;
  top.castShadow = top.receiveShadow = true;
  g.add(top);
  const felt = new THREE.Mesh(new THREE.CircleGeometry(1.5, 64), new THREE.MeshStandardMaterial({ map: feltTexture(), roughness: 1 }));
  felt.rotation.x = -Math.PI / 2;
  felt.position.y = TABLE_TOP + 0.001;
  felt.receiveShadow = true;
  g.add(felt);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.07, 14, 80), MAT.leatherBrown);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = TABLE_TOP;
  rim.castShadow = true;
  g.add(rim);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, TABLE_TOP - 0.1, 24), MAT.darkWood);
  column.position.y = (TABLE_TOP - 0.1) / 2;
  column.castShadow = true;
  g.add(column);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.1, 32), MAT.darkWood);
  foot.position.y = 0.05;
  g.add(foot);
  return g;
}

function createPiano() {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.15, metalness: 0.3 });
  const box = (w, h, d, x, y, z, m = body) => {
    const mm = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mm.position.set(x, y, z);
    mm.castShadow = mm.receiveShadow = true;
    g.add(mm);
  };
  box(1.6, 1.3, 0.6, 0, 0.65, -0.1);
  box(1.6, 0.1, 0.35, 0, 0.75, 0.35);
  const keys = new THREE.MeshStandardMaterial({ color: 0xf5f1e6, roughness: 0.4 });
  box(1.45, 0.03, 0.18, 0, 0.815, 0.4, keys);
  for (let i = 0; i < 20; i++) if (i % 7 !== 2 && i % 7 !== 6) box(0.025, 0.035, 0.1, -0.68 + i * 0.072, 0.84, 0.36);
  box(0.12, 0.7, 0.35, -0.74, 0.35, 0.35);
  box(0.12, 0.7, 0.35, 0.74, 0.35, 0.35);
  // banco do piano
  box(0.8, 0.06, 0.35, 0, 0.5, 0.95, MAT.leatherRed);
  for (const x of [-0.35, 0.35]) box(0.05, 0.48, 0.3, x, 0.24, 0.95);
  return g;
}

function buildMainTable(scene, models) {
  const S = 'Mesa do 21';
  const c = TABLE_CENTER;

  scene.add(register(place(createGameTable(), c.x, 0, c.z), 'Mesa de jogo', S));

  // cadeiras e fichas em volta da mesa
  const seats = [];
  SEAT_ANGLES.forEach((theta) => {
    const pos = aroundTable(theta, SEAT_RADIUS);
    const chair = place(createChair(), pos.x, 0, pos.z, theta + Math.PI);
    scene.add(register(chair, 'Cadeira', S));
    const chipPos = aroundTable(theta - 0.2, 1.3, TABLE_TOP);
    const colors = [0xc1121f, 0x1d4ed8, 0x111111, 0x15803d];
    const chips = place(createChipStack(colors[seats.length % 4], 6 + seats.length), chipPos.x, TABLE_TOP, chipPos.z);
    scene.add(register(chips, 'Fichas', S));
    seats.push({ theta, pos, chair, chips });
  });

  // baralho ao lado do crupiê
  const deckPos = aroundTable(DEALER_ANGLE + 0.45, 1.05, TABLE_TOP);
  const deck = place(createDeck(), deckPos.x, TABLE_TOP, deckPos.z, 0.3);
  scene.add(register(deck, 'Baralho', S));

  // revólver no centro da mesa
  const revolver = createRevolver();
  const revolverHome = {
    position: new THREE.Vector3(c.x - 0.05, TABLE_TOP + 0.022, c.z + 0.1),
    quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.5)),
  };
  revolver.position.copy(revolverHome.position);
  revolver.quaternion.copy(revolverHome.quaternion);
  scene.add(register(revolver, 'Revólver', S));

  // whisky, copos, cinzeiro, charutos e cigarros
  const onTable = (obj, type, x, z, rotY = 0) => scene.add(register(place(obj, c.x + x, TABLE_TOP, c.z + z, rotY), type, S));
  onTable(createWhiskyBottle(), 'Garrafa de whisky', 0.42, -0.28, 0.4);
  onTable(createTumbler(0.3), 'Copo de whisky', 0.3, -0.42);
  const ashtray = createAshtray();
  onTable(ashtray, 'Cinzeiro com charuto e cigarros', -0.45, -0.2, 0.3);
  onTable(createCigarBox(), 'Caixa de charutos', -0.2, -0.62, -0.25);
  onTable(createCigarettePack(), 'Maço de cigarros', -0.62, 0.15, 0.9);
  SEAT_ANGLES.forEach((theta, i) => {
    const p = aroundTable(theta + 0.3, 1.18);
    onTable(createTumbler(0.35 + (i % 3) * 0.15), 'Copo de whisky', p.x - c.x, p.z - c.z);
  });
  // fumaça saindo do cinzeiro
  ashtray.updateMatrixWorld(true);
  const smoke = createSmoke(ashtray.userData.smokePoints.map((p) => ashtray.localToWorld(p.clone())));
  scene.add(smoke);

  // luminária pendente sobre a mesa, com cone de luz
  const lamp = createPendantLamp(ROOM.height - 3.9);
  lamp.position.set(c.x, 3.9, c.z);
  scene.add(register(lamp, 'Luminária pendente', S));
  const cone = createLightCone(3.75, 2.0);
  cone.position.set(c.x, 3.78, c.z);
  scene.add(cone);

  // crupiê: robô animado (GLB)
  let dealer = null;
  if (models.robot) {
    const holder = wrapModel(models.robot.scene, 1.9);
    const p = aroundTable(DEALER_ANGLE, 2.3);
    place(holder, p.x, 0, p.z, 0);
    scene.add(register(holder, 'Robô crupiê (GLB)', S, true));
    dealer = holder;
  }

  // pedestais de corda em volta da arena (abertura voltada para a frente)
  const ropeTops = [];
  for (let a = 30; a <= 330; a += 30) {
    const p = aroundTable(THREE.MathUtils.degToRad(a), 4.85);
    scene.add(register(place(createStanchion(), p.x, 0, p.z), 'Pedestal com corda', S));
    ropeTops.push(new THREE.Vector3(p.x, 0.92, p.z));
  }
  for (let i = 0; i < ropeTops.length - 1; i++) scene.add(createRope(ropeTops[i], ropeTops[i + 1]));

  // piano no fundo do salão
  scene.add(register(place(createPiano(), 0, 0, -14.9), 'Piano', S));
  scene.add(register(place(createPlant(1.2), -3.5, 0, -15), 'Planta', S));
  scene.add(register(place(createPlant(1.2), 3.5, 0, -15), 'Planta', S));

  scene.add(register(place(createHangingSign('MESA DO 21', 'quem perde, gira o tambor', 4.2, 1), 0, 4.1, -9), 'Placa de setor', S));

  return { seats, deck, deckPos, revolver, revolverHome, dealer, smoke };
}

// ---------------------------------------------------------------------------
// SETOR 4 — SALÃO DE JOGOS & PLACAR
// ---------------------------------------------------------------------------
function buildGameRoom(scene) {
  const S = 'Salão de Jogos & Placar';

  // painel do placar (a textura é desenhada pelo jogo em tempo real)
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const screenMat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.9, roughness: 0.4 });
  const board = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(7.2, 4.2, 0.2), MAT.darkWood);
  frame.castShadow = true;
  board.add(frame);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 3.825), screenMat);
  screen.position.z = 0.11;
  board.add(screen);
  // lâmpadas na moldura
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffd27a, emissiveIntensity: 16 });
  const bulbGeo = new THREE.SphereGeometry(0.05, 10, 8);
  for (let i = 0; i <= 16; i++) {
    for (const y of [-2.05, 2.05]) {
      const b = new THREE.Mesh(bulbGeo, bulbMat);
      b.position.set(-3.5 + (i / 16) * 7, y, 0.12);
      board.add(b);
    }
  }
  place(board, 12.5, 2.9, ROOM.minZ + 0.12);
  scene.add(register(board, 'Painel do placar', S));

  scene.add(register(place(createTrophy(), 8.8, 0, -13.6, -0.4), 'Troféu', S));

  // caça-níqueis encostados na parede direita
  const syms = [['7', '7', '7'], ['★', '$', '7'], ['$', '$', '★'], ['♠', '♥', '♦']];
  syms.forEach((s, i) => {
    scene.add(register(place(createSlotMachine(s), ROOM.maxX - 0.45, 0, -11 + i * 1.3, -Math.PI / 2), 'Caça-níquel', S));
  });

  scene.add(register(place(createPoolTable(), 12.5, 0, 1.2), 'Mesa de sinuca', S));

  const dart = createDartboard();
  dart.rotation.z = Math.PI / 2; // disco de frente para -x (para dentro da sala)
  dart.position.set(ROOM.maxX - 0.05, 1.75, 6.2);
  scene.add(register(dart, 'Alvo de dardos', S));

  scene.add(register(place(createRoundTable(0.4, 1.05), 9.6, 0, 6.4), 'Mesa bistrô', S));
  scene.add(register(place(createRoundTable(0.4, 1.05), 14.6, 0, 7.6), 'Mesa bistrô', S));
  scene.add(register(place(createStool(), 9.0, 0, 7.1), 'Banqueta', S));
  scene.add(register(place(createStool(), 10.3, 0, 7.0), 'Banqueta', S));
  scene.add(register(place(createStool(), 14.0, 0, 8.3), 'Banqueta', S));
  scene.add(register(place(createGlass(), 9.6, 1.075, 6.3), 'Copo', S));
  scene.add(register(place(createGlass(), 14.5, 1.075, 7.6), 'Copo', S));

  const lamp = createPendantLamp(ROOM.height - 3.3, 0x5a1a1a);
  lamp.position.set(12.5, 3.3, 1.2);
  scene.add(register(lamp, 'Luminária pendente', S));
  scene.add(register(place(createPlant(1.1), 17.2, 0, 9.0), 'Planta', S));

  scene.add(register(place(createHangingSign('SALÃO & PLACAR', 'hall da fama dos sobreviventes', 3.8, 0.9), 10.5, 3.9, -3.5, -Math.PI / 2), 'Placa de setor', S));

  return { canvas, texture: tex };
}

// ---------------------------------------------------------------------------
export function buildWorld(scene, models) {
  buildStructure(scene);
  const lights = buildLights(scene);
  buildEntrance(scene, models);
  buildBar(scene, models);
  const table = buildMainTable(scene, models);
  const scoreboard = buildGameRoom(scene);

  // personagens animais (aparecem quando a partida começa)
  const animals = ANIMALS.map((a, i) => {
    const animal = new Animal(a.kind, PLAYER_COLORS[i]);
    scene.add(register(animal.group, 'Personagem animal', 'Mesa do 21'));
    return animal;
  });

  return { lights, table, scoreboard, animals };
}
