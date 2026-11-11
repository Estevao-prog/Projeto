import * as THREE from 'three';
import { fileTexture, TEX, slotScreenTexture, dartboardTexture, signTexture, neonTexture, cardFaceTexture, cardBackTexture } from './textures.js';

// ---------------------------------------------------------------------------
// Registro de elementos — usado para conferir os requisitos do trabalho
// (cada objeto independente = 1 elemento; cada tipo conta para a diversidade)
// ---------------------------------------------------------------------------
export const registry = [];

export function register(obj, type, sector, glb = false) {
  registry.push({ obj, type, sector, glb });
  obj.userData.elementType = type;
  return obj;
}

// ---------------------------------------------------------------------------
// Materiais compartilhados
// ---------------------------------------------------------------------------
export const MAT = {};

export function initMaterials() {
  MAT.darkWood = new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: 0.6 });
  MAT.wood = new THREE.MeshStandardMaterial({ map: fileTexture(TEX.wood, 1, 1), roughness: 0.55 });
  MAT.woodDark = new THREE.MeshStandardMaterial({ map: fileTexture(TEX.wood, 1, 1), color: 0x7a5a45, roughness: 0.5 });
  MAT.brass = new THREE.MeshStandardMaterial({ color: 0xc9a14a, metalness: 1, roughness: 0.3 });
  MAT.steel = new THREE.MeshStandardMaterial({ color: 0x8c9196, metalness: 1, roughness: 0.28 });
  MAT.gunMetal = new THREE.MeshStandardMaterial({ color: 0x2c2f33, metalness: 1, roughness: 0.32 });
  MAT.black = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
  MAT.leatherRed = new THREE.MeshStandardMaterial({ color: 0x7a1218, roughness: 0.55 });
  MAT.leatherBrown = new THREE.MeshStandardMaterial({ color: 0x4a2a1a, roughness: 0.6 });
  MAT.velvet = new THREE.MeshStandardMaterial({ color: 0x8e0f1f, roughness: 0.9 });
  MAT.pot = new THREE.MeshStandardMaterial({ color: 0x6b3b22, roughness: 0.8 });
  MAT.leaf = new THREE.MeshStandardMaterial({ color: 0x2f6b2f, roughness: 0.8, side: THREE.DoubleSide });
  MAT.felt = new THREE.MeshStandardMaterial({ color: 0x0e5a32, roughness: 1 });
  MAT.glassGreen = new THREE.MeshStandardMaterial({ color: 0x1d6b2a, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.85 });
  MAT.glassAmber = new THREE.MeshStandardMaterial({ color: 0x9a4d0c, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.85 });
  MAT.glassClear = new THREE.MeshStandardMaterial({ color: 0xcfe6ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.45 });
  MAT.crate = new THREE.MeshStandardMaterial({ map: fileTexture(TEX.crate, 1, 1), roughness: 0.8 });
}

// Adiciona o filho e devolve o próprio filho (Object3D.add devolve o pai)
function put(parent, child) {
  parent.add(child);
  return child;
}

// Atalho para criar mesh com sombra
function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ===========================================================================
// MOBILIÁRIO
// ===========================================================================

export function createChair(seatMat = MAT.leatherRed) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), seatMat, 0, 0.48, 0));
  // encosto fica do lado -z (o assento "olha" para +z)
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.6, 0.06), seatMat, 0, 0.82, -0.23));
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06), MAT.darkWood, 0, 1.14, -0.23));
  for (const [x, z] of [[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]]) {
    g.add(mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.46, 8), MAT.darkWood, x, 0.23, z));
  }
  return g;
}

export function createStool() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 20), MAT.leatherRed, 0, 0.78, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.74, 10), MAT.steel, 0, 0.38, 0));
  put(g, mesh(new THREE.TorusGeometry(0.16, 0.012, 8, 24), MAT.steel, 0, 0.3, 0)).rotation.x = Math.PI / 2;
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.03, 20), MAT.steel, 0, 0.015, 0));
  return g;
}

// Mesa redonda (bistrô) — opcionalmente alta
export function createRoundTable(radius = 0.45, height = 0.75, topMat = MAT.wood) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(radius, radius, 0.05, 28), topMat, 0, height, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, height, 10), MAT.black, 0, height / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(radius * 0.6, radius * 0.65, 0.04, 20), MAT.black, 0, 0.02, 0));
  return g;
}

export function createCoffeeTable() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(1.3, 0.06, 0.7), MAT.woodDark, 0, 0.42, 0));
  for (const [x, z] of [[-0.58, -0.28], [0.58, -0.28], [-0.58, 0.28], [0.58, 0.28]]) {
    g.add(mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), MAT.darkWood, x, 0.2, z));
  }
  return g;
}

export function createSofa(color = 0x5a1620) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(2.2, 0.4, 0.9), mat, 0, 0.3, 0));
  g.add(mesh(new THREE.BoxGeometry(2.2, 0.7, 0.22), mat, 0, 0.75, -0.36));
  g.add(mesh(new THREE.BoxGeometry(0.2, 0.55, 0.9), mat, -1.0, 0.55, 0));
  g.add(mesh(new THREE.BoxGeometry(0.2, 0.55, 0.9), mat, 1.0, 0.55, 0));
  for (const x of [-0.5, 0.5]) g.add(mesh(new THREE.BoxGeometry(0.88, 0.12, 0.7), mat, x, 0.56, 0.06));
  for (const [x, z] of [[-1, -0.35], [1, -0.35], [-1, 0.35], [1, 0.35]]) {
    g.add(mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.1, 8), MAT.brass, x, 0.05, z));
  }
  return g;
}

// Balcão do bar (comprimento ao longo de z)
export function createBarCounter(length = 9) {
  const g = new THREE.Group();
  const front = new THREE.MeshStandardMaterial({ map: fileTexture(TEX.wood, 1, 4, Math.PI / 2), color: 0x8a5a3a, roughness: 0.5 });
  g.add(mesh(new THREE.BoxGeometry(0.8, 1.05, length), front, 0, 0.525, 0));
  const topMat = new THREE.MeshStandardMaterial({ map: fileTexture(TEX.wood, 1, 6, Math.PI / 2), roughness: 0.25 });
  g.add(mesh(new THREE.BoxGeometry(1.1, 0.07, length + 0.2), topMat, 0.1, 1.085, 0));
  // apoio de pés em latão
  const rail = mesh(new THREE.CylinderGeometry(0.03, 0.03, length, 10), MAT.brass, 0.48, 0.22, 0);
  rail.rotation.x = Math.PI / 2;
  g.add(rail);
  return g;
}

// Chopeira (torneiras de chope)
export function createBeerTap() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.12, 0.42, 0.5), MAT.steel, 0, 0.21, 0));
  for (const z of [-0.15, 0, 0.15]) {
    put(g, mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8), MAT.brass, 0.1, 0.33, z)).rotation.z = Math.PI / 2;
    g.add(mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.16, 8), MAT.black, 0.16, 0.42, z));
  }
  return g;
}

// Garrafa (LatheGeometry = perfil girado)
export function createBottle(mat = MAT.glassGreen, height = 0.32) {
  const pts = [
    [0, 0], [0.045, 0], [0.05, 0.02], [0.05, 0.55], [0.035, 0.7], [0.018, 0.78], [0.018, 0.95], [0.022, 0.97], [0, 0.97],
  ].map(([x, y]) => new THREE.Vector2(x * height * 2.2, y * height));
  const g = new THREE.Group();
  g.add(mesh(new THREE.LatheGeometry(pts, 16), mat));
  const label = new THREE.MeshStandardMaterial({ color: 0xe9dcb8, roughness: 0.8 });
  g.add(mesh(new THREE.CylinderGeometry(0.0505 * height * 2.2, 0.0505 * height * 2.2, height * 0.22, 16, 1, true), label, 0, height * 0.3, 0));
  return g;
}

export function createGlass() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.1, 14), MAT.glassClear, 0, 0.05, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.026, 0.04, 14), MAT.glassAmber, 0, 0.03, 0));
  return g;
}

// Estante de parede (as garrafas são adicionadas como elementos separados)
export function createShelf(length = 6) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.4, 2.6, length), MAT.darkWood, 0, 1.3, 0));
  for (const y of [1.2, 1.75, 2.3]) g.add(mesh(new THREE.BoxGeometry(0.5, 0.05, length), MAT.woodDark, 0.25, y, 0));
  const mirror = new THREE.MeshStandardMaterial({ color: 0x9fb0c0, metalness: 1, roughness: 0.08 });
  put(g, mesh(new THREE.PlaneGeometry(length - 0.3, 1.5), mirror, 0.21, 1.78, 0)).rotation.y = Math.PI / 2;
  return g;
}

export function createJukebox() {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: 0x6e1b1b, roughness: 0.35, metalness: 0.2 });
  g.add(mesh(new THREE.BoxGeometry(1, 1.25, 0.6), body, 0, 0.625, 0));
  const arch = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.6, 24, 1, false, 0, Math.PI), body, 0, 1.25, 0);
  arch.rotation.z = Math.PI / 2;
  arch.rotation.y = Math.PI / 2;
  g.add(arch);
  const glow = new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0xff7a1a, emissiveIntensity: 14 });
  const tube = mesh(new THREE.TorusGeometry(0.42, 0.035, 10, 32, Math.PI), glow, 0, 1.25, 0.31);
  g.add(tube);
  const grill = new THREE.MeshStandardMaterial({ color: 0xd8c08a, metalness: 0.9, roughness: 0.3 });
  g.add(mesh(new THREE.BoxGeometry(0.7, 0.45, 0.02), grill, 0, 0.45, 0.31));
  const screen = new THREE.MeshStandardMaterial({ color: 0x2a1a10, emissive: 0x5a3a10, emissiveIntensity: 0.8 });
  g.add(mesh(new THREE.BoxGeometry(0.7, 0.35, 0.02), screen, 0, 0.98, 0.31));
  return g;
}

export function createPlant(scale = 1) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.5, 16), MAT.pot, 0, 0.25, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 16), new THREE.MeshStandardMaterial({ color: 0x2a1a10 }), 0, 0.49, 0));
  // folhas: cones finos inclinados em volta do centro
  const leafGeo = new THREE.ConeGeometry(0.08, 0.9, 6);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const leaf = mesh(leafGeo, MAT.leaf, Math.cos(a) * 0.1, 0.9, Math.sin(a) * 0.1);
    leaf.rotation.z = Math.cos(a) * -0.5;
    leaf.rotation.x = Math.sin(a) * 0.5;
    g.add(leaf);
  }
  g.add(mesh(new THREE.ConeGeometry(0.09, 1.1, 6), MAT.leaf, 0, 1.0, 0));
  g.scale.setScalar(scale);
  return g;
}

export function createCoatRack() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 10), MAT.darkWood, 0, 0.9, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.05, 16), MAT.darkWood, 0, 0.025, 0));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const hook = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6), MAT.brass, Math.cos(a) * 0.08, 1.65, Math.sin(a) * 0.08);
    hook.rotation.z = Math.cos(a) * 0.9;
    hook.rotation.x = -Math.sin(a) * 0.9;
    g.add(hook);
  }
  // casaco e chapéu pendurados
  const coat = new THREE.MeshStandardMaterial({ color: 0x2b2b35, roughness: 0.9 });
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.85, 12), coat, 0.14, 1.2, 0));
  const hat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
  g.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.015, 20), hat, -0.05, 1.83, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.12, 20), hat, -0.05, 1.9, 0));
  return g;
}

// Pedestal com corda de veludo (cria os postes e as cordas entre eles)
export function createStanchion() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.04, 16), MAT.brass, 0, 0.02, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.95, 10), MAT.brass, 0, 0.5, 0));
  g.add(mesh(new THREE.SphereGeometry(0.05, 12, 10), MAT.brass, 0, 0.98, 0));
  return g;
}

export function createRope(a, b, sag = 0.18) {
  const mid = a.clone().lerp(b, 0.5);
  mid.y -= sag;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  return mesh(new THREE.TubeGeometry(curve, 20, 0.018, 8, false), MAT.velvet);
}

// Balcão da recepção / caixa de fichas
export function createReception() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(2, 1.05, 0.6), MAT.woodDark, 0, 0.525, 0));
  g.add(mesh(new THREE.BoxGeometry(2.15, 0.06, 0.75), MAT.leatherBrown, 0, 1.08, 0));
  // sineta
  g.add(mesh(new THREE.SphereGeometry(0.06, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.brass, 0.6, 1.11, 0));
  // caixa registradora
  const reg = new THREE.MeshStandardMaterial({ color: 0x7a6a50, metalness: 0.7, roughness: 0.35 });
  g.add(mesh(new THREE.BoxGeometry(0.45, 0.25, 0.35), reg, -0.4, 1.235, 0));
  put(g, mesh(new THREE.BoxGeometry(0.4, 0.14, 0.03), MAT.black, -0.4, 1.42, -0.1)).rotation.x = -0.4;
  return g;
}

export function createCrate(size = 0.8) {
  return mesh(new THREE.BoxGeometry(size, size, size), MAT.crate, 0, size / 2, 0);
}

export function createBarrel() {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const y = i / 10;
    pts.push(new THREE.Vector2(0.32 + Math.sin(y * Math.PI) * 0.06, y * 1.0));
  }
  g.add(mesh(new THREE.LatheGeometry(pts, 20), MAT.woodDark));
  for (const y of [0.15, 0.5, 0.85]) {
    put(g, mesh(new THREE.TorusGeometry(0.33 + Math.sin(y * Math.PI) * 0.06, 0.012, 6, 28), MAT.black, 0, y, 0)).rotation.x = Math.PI / 2;
  }
  put(g, mesh(new THREE.CircleGeometry(0.32, 20), MAT.darkWood, 0, 1.0, 0)).rotation.x = -Math.PI / 2;
  return g;
}

export function createSlotMachine(symbols = ['7', '★', '$']) {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: 0x8b1a1a, metalness: 0.4, roughness: 0.35 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 1, roughness: 0.2 });
  g.add(mesh(new THREE.BoxGeometry(0.8, 1.0, 0.6), body, 0, 0.5, 0));
  g.add(mesh(new THREE.BoxGeometry(0.8, 0.8, 0.45), body, 0, 1.4, -0.07));
  g.add(mesh(new THREE.BoxGeometry(0.84, 0.06, 0.64), chrome, 0, 1.0, 0));
  const screen = new THREE.MeshStandardMaterial({ map: slotScreenTexture(symbols), emissive: 0xffffff, emissiveMap: slotScreenTexture(symbols), emissiveIntensity: 0.6 });
  g.add(mesh(new THREE.PlaneGeometry(0.62, 0.26), screen, 0, 1.4, 0.161));
  const top = new THREE.MeshStandardMaterial({ color: 0xffd34d, emissive: 0xffaa00, emissiveIntensity: 3 });
  g.add(mesh(new THREE.BoxGeometry(0.8, 0.18, 0.45), top, 0, 1.89, -0.07));
  // alavanca
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8), chrome, 0.46, 1.3, 0));
  g.add(mesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshStandardMaterial({ color: 0xc1121f, roughness: 0.3 }), 0.46, 1.62, 0));
  return g;
}

export function createPoolTable() {
  const g = new THREE.Group();
  const felt = new THREE.MeshStandardMaterial({ color: 0x1b4f8a, roughness: 0.95 });
  g.add(mesh(new THREE.BoxGeometry(2.5, 0.1, 1.3), felt, 0, 0.8, 0));
  // bordas
  for (const z of [-0.72, 0.72]) g.add(mesh(new THREE.BoxGeometry(2.7, 0.14, 0.14), MAT.woodDark, 0, 0.85, z));
  for (const x of [-1.32, 1.32]) g.add(mesh(new THREE.BoxGeometry(0.14, 0.14, 1.58), MAT.woodDark, x, 0.85, 0));
  g.add(mesh(new THREE.BoxGeometry(2.4, 0.25, 1.2), MAT.darkWood, 0, 0.62, 0));
  for (const [x, z] of [[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]]) {
    g.add(mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.55, 10), MAT.darkWood, x, 0.27, z));
  }
  // bolas em triângulo
  const colors = [0xf2d22e, 0x1d4ed8, 0xc1121f, 0x6d28d9, 0xf97316, 0x15803d, 0x7f1d1d, 0x111111, 0xf2d22e, 0x1d4ed8];
  const ballGeo = new THREE.SphereGeometry(0.035, 16, 12);
  let k = 0;
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i <= row; i++) {
      const ball = mesh(ballGeo, new THREE.MeshStandardMaterial({ color: colors[k++ % colors.length], roughness: 0.15 }), 0.6 + row * 0.062, 0.885, (i - row / 2) * 0.072);
      g.add(ball);
    }
  }
  g.add(mesh(ballGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 }), -0.6, 0.885, 0));
  // taco
  const cue = mesh(new THREE.CylinderGeometry(0.008, 0.016, 1.45, 8), MAT.wood, -0.95, 0.89, 0.25);
  cue.rotation.z = Math.PI / 2;
  cue.rotation.y = 0.25;
  g.add(cue);
  return g;
}

// Pedestal com troféu dourado — o "Hall da Fama"
export function createTrophy() {
  const g = new THREE.Group();
  const marble = new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.3 });
  g.add(mesh(new THREE.BoxGeometry(0.8, 1.0, 0.8), marble, 0, 0.5, 0));
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.08, 0.9), marble, 0, 1.04, 0));
  const gold = new THREE.MeshStandardMaterial({ color: 0xe0b23a, metalness: 1, roughness: 0.18 });
  const pts = [[0, 0], [0.18, 0], [0.18, 0.04], [0.06, 0.08], [0.04, 0.3], [0.08, 0.36], [0.22, 0.5], [0.24, 0.7], [0.22, 0.72], [0.2, 0.55], [0, 0.42]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  g.add(mesh(new THREE.LatheGeometry(pts, 32), gold, 0, 1.08, 0));
  for (const s of [-1, 1]) {
    const handle = mesh(new THREE.TorusGeometry(0.1, 0.018, 8, 20, Math.PI), gold, s * 0.24, 1.68, 0);
    handle.rotation.z = s * -Math.PI / 2;
    g.add(handle);
  }
  return g;
}

export function createDartboard() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 32), MAT.black));
  const face = new THREE.MeshStandardMaterial({ map: dartboardTexture(), roughness: 0.8 });
  const disc = mesh(new THREE.CircleGeometry(0.33, 40), face, 0, 0.026, 0);
  disc.rotation.x = -Math.PI / 2;
  g.add(disc);
  // dardos
  for (const [x, z] of [[0.05, 0.02], [-0.12, 0.08], [0.1, -0.15]]) {
    const dart = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 6), MAT.steel, x, 0.1, z);
    g.add(dart);
    g.add(mesh(new THREE.ConeGeometry(0.025, 0.05, 4), new THREE.MeshStandardMaterial({ color: 0xc1121f }), x, 0.19, z));
  }
  // de pé o disco fica de frente para +y; giramos para ficar na parede
  return g;
}

// Luminária pendente (cúpula cônica com cabo)
export function createPendantLamp(cable = 1.2, color = 0x1d3b2a) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, cable, 6), MAT.black, 0, cable / 2, 0));
  const shadeMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide });
  const shade = mesh(new THREE.ConeGeometry(0.55, 0.4, 28, 1, true), shadeMat, 0, -0.05, 0);
  shade.castShadow = false;
  g.add(shade);
  const bulb = new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: 0xffe2a0, emissiveIntensity: 25 });
  put(g, new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), bulb)).position.y = -0.18;
  return g;
}

// Placa de sinalização pendurada por dois cabos
export function createHangingSign(text, sub, width = 4, height = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    map: signTexture(text, { sub }),
    emissive: 0xffffff,
    emissiveMap: signTexture(text, { sub }),
    emissiveIntensity: 0.35,
    roughness: 0.6,
  });
  const board = mesh(new THREE.BoxGeometry(width, height, 0.06), [MAT.darkWood, MAT.darkWood, MAT.darkWood, MAT.darkWood, mat, mat], 0, 0, 0);
  board.castShadow = false;
  g.add(board);
  for (const x of [-width / 2 + 0.2, width / 2 - 0.2]) {
    g.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.4, 6), MAT.black, x, height / 2 + 0.7, 0));
  }
  return g;
}

export function createNeonSign(text, color, width = 5, height = 1.25) {
  const g = new THREE.Group();
  const backing = new THREE.MeshStandardMaterial({ color: 0x111014, roughness: 0.5, metalness: 0.4 });
  // placa plana (só aparece de frente, como as paredes)
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(width + 0.2, height + 0.15), backing));
  const neon = new THREE.MeshBasicMaterial({ map: neonTexture(text, color), transparent: true });
  neon.color.setScalar(14); // valor HDR: faz o letreiro brilhar com o bloom
  put(g, new THREE.Mesh(new THREE.PlaneGeometry(width, height), neon)).position.z = 0.01;
  return g;
}

// Batente de porta com duas folhas abertas
export function createDoorway(width = 3, height = 3.2) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.25, height, 0.35), MAT.darkWood, -width / 2 - 0.125, height / 2, 0));
  g.add(mesh(new THREE.BoxGeometry(0.25, height, 0.35), MAT.darkWood, width / 2 + 0.125, height / 2, 0));
  g.add(mesh(new THREE.BoxGeometry(width + 0.5, 0.3, 0.35), MAT.darkWood, 0, height + 0.15, 0));
  const doorMat = new THREE.MeshStandardMaterial({ map: fileTexture(TEX.wood, 1, 2, Math.PI / 2), color: 0x9a6a48, roughness: 0.5 });
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * width / 2, 0, 0);
    const leaf = mesh(new THREE.BoxGeometry(width / 2, height - 0.1, 0.06), doorMat, -s * width / 4, (height - 0.1) / 2, 0);
    pivot.add(leaf);
    pivot.add(mesh(new THREE.SphereGeometry(0.05, 10, 8), MAT.brass, -s * (width / 2 - 0.15), 1.1, -0.06));
    pivot.rotation.y = s * -1.2; // portas abertas para dentro
    g.add(pivot);
  }
  return g;
}

// Pilha de fichas de cassino
export function createChipStack(color = 0xc1121f, count = 8) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
  const edge = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const geo = new THREE.CylinderGeometry(0.035, 0.035, 0.012, 18);
  for (let i = 0; i < count; i++) {
    const chip = mesh(geo, i % 2 ? mat : [mat, edge, edge], (Math.random() - 0.5) * 0.004, 0.006 + i * 0.0125, (Math.random() - 0.5) * 0.004);
    g.add(chip);
  }
  return g;
}

// Monte do baralho
export function createDeck() {
  const g = new THREE.Group();
  const back = new THREE.MeshStandardMaterial({ map: cardBackTexture(), roughness: 0.6 });
  const side = new THREE.MeshStandardMaterial({ color: 0xf2eee4, roughness: 0.8 });
  g.add(mesh(new THREE.BoxGeometry(CARD_W, 0.05, CARD_H), [side, side, back, side, side, side], 0, 0.025, 0));
  return g;
}

// ===========================================================================
// CARTA (topo = face, base = verso)
// ===========================================================================
export const CARD_W = 0.13;
export const CARD_H = 0.18;
const cardGeo = new THREE.BoxGeometry(CARD_W, 0.003, CARD_H);
let cardSideMat = null;
let cardBackMat = null;

export function createCard(rank, suit) {
  cardSideMat ??= new THREE.MeshStandardMaterial({ color: 0xf2eee4, roughness: 0.7 });
  cardBackMat ??= new THREE.MeshStandardMaterial({ map: cardBackTexture(), roughness: 0.6 });
  const face = new THREE.MeshStandardMaterial({ map: cardFaceTexture(rank, suit), roughness: 0.6 });
  const m = new THREE.Mesh(cardGeo, [cardSideMat, cardSideMat, face, cardBackMat, cardSideMat, cardSideMat]);
  m.castShadow = true;
  return m;
}

// ===========================================================================
// REVÓLVER — modelado em partes para animar tambor, cão (martelo) e gatilho.
// O cano aponta para +x local.
// ===========================================================================
export function createRevolver() {
  const g = new THREE.Group();
  const grip = new THREE.MeshStandardMaterial({ color: 0x5b3420, roughness: 0.45 });

  // armação
  g.add(mesh(new THREE.BoxGeometry(0.34, 0.1, 0.05), MAT.gunMetal, 0.0, 0.0, 0));
  g.add(mesh(new THREE.BoxGeometry(0.36, 0.035, 0.035), MAT.gunMetal, 0.08, 0.075, 0));
  // cano
  const barrel = mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.42, 16), MAT.steel, 0.36, 0.045, 0);
  barrel.rotation.z = Math.PI / 2;
  g.add(barrel);
  const rib = mesh(new THREE.BoxGeometry(0.42, 0.018, 0.018), MAT.gunMetal, 0.36, 0.072, 0);
  g.add(rib);
  g.add(mesh(new THREE.BoxGeometry(0.02, 0.03, 0.01), MAT.gunMetal, 0.56, 0.085, 0)); // mira
  const ejector = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 8), MAT.steel, 0.24, 0.0, 0);
  ejector.rotation.z = Math.PI / 2;
  g.add(ejector);

  // tambor (gira em torno do eixo x)
  const drum = new THREE.Group();
  drum.position.set(0.02, 0.02, 0);
  const drumBody = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.16, 24), MAT.steel);
  drumBody.rotation.z = Math.PI / 2;
  drum.add(drumBody);
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });
  const fluteMat = MAT.gunMetal;
  const chambers = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const y = Math.cos(a) * 0.045, z = Math.sin(a) * 0.045;
    const hole = mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.162, 12), holeMat, 0, y, z);
    hole.rotation.z = Math.PI / 2;
    drum.add(hole);
    chambers.push(hole);
    const fy = Math.cos(a + Math.PI / 6) * 0.074, fz = Math.sin(a + Math.PI / 6) * 0.074;
    const flute = mesh(new THREE.BoxGeometry(0.11, 0.012, 0.012), fluteMat, 0, fy, fz);
    flute.rotation.x = a + Math.PI / 6;
    drum.add(flute);
  }
  g.add(drum);

  // cão (martelo) — pivô atrás do tambor
  const hammer = new THREE.Group();
  hammer.position.set(-0.13, 0.05, 0);
  hammer.add(mesh(new THREE.BoxGeometry(0.03, 0.08, 0.025), MAT.gunMetal, -0.005, 0.03, 0));
  hammer.add(mesh(new THREE.BoxGeometry(0.04, 0.015, 0.03), MAT.gunMetal, -0.025, 0.07, 0));
  g.add(hammer);

  // gatilho e guarda-mato
  const trigger = new THREE.Group();
  trigger.position.set(-0.03, -0.05, 0);
  trigger.add(mesh(new THREE.BoxGeometry(0.015, 0.07, 0.015), MAT.steel, 0, -0.03, 0));
  g.add(trigger);
  const guard = mesh(new THREE.TorusGeometry(0.055, 0.009, 8, 20, Math.PI), MAT.gunMetal, -0.02, -0.05, 0);
  guard.rotation.z = Math.PI;
  g.add(guard);

  // empunhadura
  const handle = mesh(new THREE.BoxGeometry(0.08, 0.22, 0.06), grip, -0.2, -0.1, 0);
  handle.rotation.z = -0.35;
  g.add(handle);
  const butt = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 12), MAT.gunMetal, -0.24, -0.21, 0);
  butt.rotation.x = Math.PI / 2;
  g.add(butt);

  // clarão do disparo (escondido até o "BANG")
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, toneMapped: false }),
  );
  flash.position.set(0.62, 0.045, 0);
  g.add(flash);
  const flashLight = new THREE.PointLight(0xffb347, 0, 6, 2);
  flashLight.position.copy(flash.position);
  g.add(flashLight);

  g.scale.setScalar(0.42); // ~35 cm, tamanho de um revólver de verdade
  g.userData = { drum, hammer, trigger, flash, flashLight, chambers };
  return g;
}
