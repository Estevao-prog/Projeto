import * as THREE from 'three';
import { fileTexture, TEX } from './textures.js';

// ===========================================================================
// Itens da mesa: whisky, copos, cinzeiro, charutos, cigarros, fumaça e
// cone de luz da luminária.
// ===========================================================================

function part(parent, geo, mat, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  parent.add(m);
  return m;
}

function labelTexture(lines, bg = '#1b1206', fg = '#e8c27a') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = fg;
  g.lineWidth = 8;
  g.strokeRect(12, 12, 232, 232);
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const [text, font, y] of lines) {
    g.font = font;
    g.fillText(text, 128, y, 220);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const glassMat = (color = 0xffffff, opacity = 0.3) => new THREE.MeshPhysicalMaterial({
  color, roughness: 0.04, transparent: true, opacity, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false,
});
const whiskyMat = () => new THREE.MeshStandardMaterial({
  color: 0xc06a12, roughness: 0.1, emissive: 0x3a1600, emissiveIntensity: 0.5, transparent: true, opacity: 0.9,
});

export function createWhiskyBottle() {
  const g = new THREE.Group();
  const glass = glassMat(0xfff4e0, 0.32);
  const label = new THREE.MeshStandardMaterial({
    map: labelTexture([['OLD', 'bold 40px Georgia', 70], ['CARTA', 'bold 52px Georgia', 125], ['12 ANOS', '30px Georgia', 185]]),
    roughness: 0.7,
  });
  part(g, new THREE.BoxGeometry(0.1, 0.13, 0.1), whiskyMat(), 0, 0.068, 0);
  part(g, new THREE.BoxGeometry(0.11, 0.2, 0.11), glass, 0, 0.1, 0, false);
  for (const ry of [0, Math.PI]) {
    const lab = part(g, new THREE.PlaneGeometry(0.09, 0.09), label, 0, 0.1, 0, false);
    lab.rotation.y = ry;
    lab.translateZ(0.0556);
  }
  part(g, new THREE.CylinderGeometry(0.03, 0.055, 0.04, 16), glass, 0, 0.22, 0, false);
  part(g, new THREE.CylinderGeometry(0.018, 0.022, 0.06, 12), glass, 0, 0.27, 0, false);
  part(g, new THREE.CylinderGeometry(0.022, 0.022, 0.03, 12), new THREE.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.6 }), 0, 0.31, 0);
  return g;
}

// Copo baixo de whisky com gelo
export function createTumbler(fill = 0.5) {
  const g = new THREE.Group();
  const glass = glassMat(0xffffff, 0.25);
  glass.side = THREE.DoubleSide;
  const ice = new THREE.MeshPhysicalMaterial({ color: 0xe8f6ff, roughness: 0.15, transparent: true, opacity: 0.75 });
  part(g, new THREE.CylinderGeometry(0.039, 0.036, 0.075 * fill, 20), whiskyMat(), 0, 0.012 + 0.0375 * fill, 0);
  for (const [x, z, r] of [[0.012, 0.008, 0.3], [-0.013, -0.007, 0.9]]) {
    const cube = part(g, new THREE.BoxGeometry(0.024, 0.024, 0.024), ice, x, 0.012 + 0.075 * fill, z, false);
    cube.rotation.set(r, r * 1.3, 0.2);
  }
  part(g, new THREE.CylinderGeometry(0.045, 0.04, 0.09, 24, 1, true), glass, 0, 0.045, 0, false);
  part(g, new THREE.CylinderGeometry(0.04, 0.04, 0.012, 24), glass, 0, 0.006, 0, false);
  return g;
}

const tobaccoMat = () => new THREE.MeshStandardMaterial({ color: 0x5a3418, roughness: 0.9 });
const emberMat = () => new THREE.MeshStandardMaterial({ color: 0xff5a1a, emissive: 0xff3a00, emissiveIntensity: 30 });

function cigar(lit = true) {
  const g = new THREE.Group();
  const body = part(g, new THREE.CylinderGeometry(0.011, 0.011, 0.15, 12), tobaccoMat());
  body.rotation.z = Math.PI / 2;
  const ring = part(g, new THREE.CylinderGeometry(0.0118, 0.0118, 0.015, 12), new THREE.MeshStandardMaterial({ color: 0xc1121f, roughness: 0.5 }), -0.045, 0, 0);
  ring.rotation.z = Math.PI / 2;
  if (lit) {
    const ash = part(g, new THREE.CylinderGeometry(0.0105, 0.011, 0.02, 12), new THREE.MeshStandardMaterial({ color: 0x9a9a95, roughness: 1 }), 0.085, 0, 0);
    ash.rotation.z = Math.PI / 2;
    const tip = part(g, new THREE.CylinderGeometry(0.0112, 0.0112, 0.004, 12), emberMat(), 0.074, 0, 0, false);
    tip.rotation.z = Math.PI / 2;
  }
  return g;
}

function cigarette(lit = false) {
  const g = new THREE.Group();
  const paper = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.8 });
  const filter = new THREE.MeshStandardMaterial({ color: 0xd08a3a, roughness: 0.8 });
  const b = part(g, new THREE.CylinderGeometry(0.0045, 0.0045, 0.06, 8), paper, 0.01, 0, 0);
  b.rotation.z = Math.PI / 2;
  const f = part(g, new THREE.CylinderGeometry(0.0046, 0.0046, 0.022, 8), filter, -0.031, 0, 0);
  f.rotation.z = Math.PI / 2;
  if (lit) {
    const t = part(g, new THREE.CylinderGeometry(0.0046, 0.0046, 0.005, 8), emberMat(), 0.041, 0, 0, false);
    t.rotation.z = Math.PI / 2;
  }
  return g;
}

// Cinzeiro com charuto aceso e cigarros. userData.smokePoints = pontas acesas (locais)
export function createAshtray() {
  const g = new THREE.Group();
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x9a6a3a, roughness: 0.1, transparent: true, opacity: 0.8, clearcoat: 1 });
  const pts = [[0, 0], [0.09, 0], [0.1, 0.01], [0.1, 0.035], [0.085, 0.035], [0.075, 0.015], [0, 0.015]].map(([x, y]) => new THREE.Vector2(x, y));
  part(g, new THREE.LatheGeometry(pts, 32), glass);
  part(g, new THREE.CylinderGeometry(0.07, 0.07, 0.004, 20), new THREE.MeshStandardMaterial({ color: 0x77776f, roughness: 1 }), 0, 0.017, 0);
  const c = cigar(true);
  c.position.set(0.04, 0.042, 0);
  c.rotation.z = 0.12;
  g.add(c);
  const cig1 = cigarette(true);
  cig1.position.set(-0.035, 0.037, 0.045);
  cig1.rotation.set(0, 2.2, 0.08);
  g.add(cig1);
  const cig2 = cigarette(false);
  cig2.position.set(-0.04, 0.022, -0.03);
  cig2.rotation.set(0, -0.6, 0.02);
  g.add(cig2);
  g.userData.smokePoints = [new THREE.Vector3(0.12, 0.06, 0), new THREE.Vector3(-0.06, 0.045, 0.08)];
  return g;
}

export function createCigarettePack() {
  const g = new THREE.Group();
  const front = new THREE.MeshStandardMaterial({
    map: labelTexture([['ROLETA', 'bold 50px Georgia', 95], ['filtro vermelho', '28px Georgia', 165]], '#8f1520', '#f7e7c8'),
    roughness: 0.5,
  });
  const side = new THREE.MeshStandardMaterial({ color: 0x8f1520, roughness: 0.5 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf2eee4, roughness: 0.5 });
  part(g, new THREE.BoxGeometry(0.055, 0.022, 0.085), [side, side, front, white, side, side], 0, 0.011, 0);
  const c1 = cigarette(false);
  c1.position.set(0.012, 0.016, -0.055);
  c1.rotation.y = Math.PI / 2;
  g.add(c1);
  const c2 = cigarette(false);
  c2.position.set(-0.008, 0.016, -0.065);
  c2.rotation.y = Math.PI / 2 + 0.1;
  g.add(c2);
  return g;
}

export function createCigarBox() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ map: fileTexture(TEX.wood, 0.4, 0.3), color: 0x8a4a2a, roughness: 0.45 });
  const label = new THREE.MeshStandardMaterial({
    map: labelTexture([['HABANOS', 'bold 44px Georgia', 100], ['★ ★ ★', '36px Georgia', 160]], '#e8d5a5', '#6b1a10'),
    roughness: 0.6,
  });
  part(g, new THREE.BoxGeometry(0.22, 0.05, 0.14), wood, 0, 0.025, 0);
  const lid = new THREE.Group();
  lid.position.set(0, 0.05, -0.07);
  lid.rotation.x = -1.9;
  part(lid, new THREE.BoxGeometry(0.22, 0.008, 0.14), [wood, wood, wood, label, wood, wood], 0, 0, 0.07);
  g.add(lid);
  for (let i = 0; i < 4; i++) {
    const c = cigar(false);
    c.scale.setScalar(1.2);
    c.position.set(0, 0.052, -0.045 + i * 0.03);
    g.add(c);
  }
  return g;
}

// Fumaça: sprites que sobem, crescem e somem (reaproveitados em ciclo)
export function createSmoke(points, perPoint = 12) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(225,225,225,0.6)');
  grad.addColorStop(1, 'rgba(225,225,225,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  const group = new THREE.Group();
  const puffs = [];
  for (const p of points) {
    for (let i = 0; i < perPoint; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }));
      s.userData = { origin: p.clone(), life: i / perPoint, speed: 0.16 + Math.random() * 0.08, drift: Math.random() * Math.PI * 2 };
      group.add(s);
      puffs.push(s);
    }
  }
  group.userData.update = (dt, t) => {
    for (const s of puffs) {
      const u = s.userData;
      u.life += dt * u.speed * 0.6;
      if (u.life > 1) { u.life -= 1; u.drift = Math.random() * Math.PI * 2; }
      const h = u.life * 0.75;
      s.position.set(
        u.origin.x + Math.sin(t * 1.3 + u.drift + h * 6) * 0.05 * u.life,
        u.origin.y + h,
        u.origin.z + Math.cos(t * 1.1 + u.drift + h * 5) * 0.05 * u.life,
      );
      const size = 0.03 + u.life * 0.24;
      s.scale.set(size, size, 1);
      s.material.opacity = Math.sin(u.life * Math.PI) * 0.32;
    }
  };
  return group;
}

// Cone de luz "volumétrico" falso (mistura aditiva) sob uma luminária.
// O topo do cone fica na origem do grupo.
export function createLightCone(height = 3.4, radius = 1.9, color = 0xffd9a0, opacity = 0.1) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(1, '#000000');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 128);
  const alpha = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({
    color, alphaMap: alpha, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.4, radius, height, 48, 1, true), mat);
  cone.position.y = -height / 2;
  cone.renderOrder = 5;
  const holder = new THREE.Group();
  holder.add(cone);
  return holder;
}
