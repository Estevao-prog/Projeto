import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Personagens animais (modelados por código) sentados à mesa.
// O grupo fica na posição da cadeira, olhando para +z (para o centro da mesa).
// Os braços usam IK de dois ossos: basta dizer onde a mão deve ficar.
// ---------------------------------------------------------------------------

export const ANIMALS = [
  { kind: 'urso', nome: 'Urso' },
  { kind: 'coelho', nome: 'Coelho' },
  { kind: 'gato', nome: 'Gato' },
  { kind: 'sapo', nome: 'Sapo' },
];

const UP_ARM = 0.27;
const FORE_ARM = 0.27;
const DOWN = new THREE.Vector3(0, -1, 0);

function std(color, roughness = 0.7, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, ...extra });
}

function part(parent, geo, mat, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  parent.add(m);
  return m;
}

// Olhos: bolinha preta + brilho. Também cria o "X" usado quando o personagem é eliminado.
function addEyes(head, positions, radius, irisColor = 0x111111, scleraRadius = 0) {
  const eyes = [];
  const xs = [];
  const black = std(irisColor, 0.2);
  const shine = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const white = std(0xffffff, 0.3);
  const xMat = std(0x111111, 0.5);
  for (const p of positions) {
    const g = new THREE.Group();
    g.position.copy(p);
    if (scleraRadius) part(g, new THREE.SphereGeometry(scleraRadius, 16, 12), white, 0, 0, 0, false);
    const iris = part(g, new THREE.SphereGeometry(radius, 14, 10), black, 0, 0, scleraRadius ? scleraRadius * 0.65 : 0, false);
    part(iris, new THREE.SphereGeometry(radius * 0.32, 8, 6), shine, radius * 0.35, radius * 0.4, radius * 0.75, false);
    head.add(g);
    eyes.push(g);

    const x = new THREE.Group();
    x.position.copy(p).add(new THREE.Vector3(0, 0, scleraRadius ? scleraRadius * 0.9 : radius * 0.6));
    for (const s of [-1, 1]) {
      const bar = part(x, new THREE.BoxGeometry(radius * 3, radius * 0.6, radius * 0.6), xMat, 0, 0, 0, false);
      bar.rotation.z = s * Math.PI / 4;
    }
    x.visible = false;
    head.add(x);
    xs.push(x);
  }
  return { eyes, xs };
}

// ------------------------------------------------------------------ cabeças
function bearHead(head, fur) {
  const furMat = std(fur, 0.9);
  const light = std(0xd9b38c, 0.9);
  part(head, new THREE.SphereGeometry(0.2, 28, 20), furMat).scale.set(1, 0.95, 0.95);
  for (const s of [-1, 1]) {
    part(head, new THREE.SphereGeometry(0.07, 16, 12), furMat, s * 0.14, 0.15, -0.02);
    part(head, new THREE.SphereGeometry(0.04, 12, 10), light, s * 0.14, 0.15, 0.02, false);
  }
  part(head, new THREE.SphereGeometry(0.095, 18, 14), light, 0, -0.06, 0.15).scale.set(1.1, 0.8, 0.9);
  part(head, new THREE.SphereGeometry(0.035, 12, 10), std(0x111111, 0.3), 0, -0.02, 0.235).scale.set(1.3, 0.9, 1);
  const eyes = addEyes(head, [new THREE.Vector3(-0.075, 0.05, 0.17), new THREE.Vector3(0.075, 0.05, 0.17)], 0.025);
  return { furMat, ...eyes };
}

function rabbitHead(head, fur) {
  const furMat = std(fur, 0.9);
  const pink = std(0xf2a7b5, 0.8);
  part(head, new THREE.SphereGeometry(0.19, 28, 20), furMat).scale.set(0.95, 1.05, 1);
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(s * 0.08, 0.15, -0.03);
    ear.rotation.z = -s * 0.18;
    ear.rotation.x = -0.15;
    part(ear, new THREE.CapsuleGeometry(0.05, 0.28, 6, 12), furMat, 0, 0.19, 0).scale.set(1, 1, 0.55);
    part(ear, new THREE.CapsuleGeometry(0.03, 0.22, 6, 10), pink, 0, 0.19, 0.022, false).scale.set(1, 1, 0.3);
    head.add(ear);
    part(head, new THREE.SphereGeometry(0.06, 14, 10), std(0xffffff, 0.9), s * 0.045, -0.07, 0.15).scale.set(1, 0.85, 0.8);
  }
  part(head, new THREE.SphereGeometry(0.025, 10, 8), pink, 0, -0.03, 0.195);
  for (const s of [-1, 1]) part(head, new THREE.BoxGeometry(0.03, 0.045, 0.012), std(0xffffff, 0.3), s * 0.017, -0.13, 0.165, false);
  const eyes = addEyes(head, [new THREE.Vector3(-0.08, 0.05, 0.155), new THREE.Vector3(0.08, 0.05, 0.155)], 0.028, 0x3a1010);
  return { furMat, ...eyes };
}

function catHead(head, fur) {
  const furMat = std(fur, 0.85);
  const white = std(0xf7efe3, 0.9);
  part(head, new THREE.SphereGeometry(0.19, 28, 20), furMat).scale.set(1.08, 0.95, 0.95);
  for (const s of [-1, 1]) {
    const ear = part(head, new THREE.ConeGeometry(0.075, 0.15, 4), furMat, s * 0.12, 0.18, 0);
    ear.rotation.z = -s * 0.35;
    ear.rotation.y = Math.PI / 4;
    const inner = part(head, new THREE.ConeGeometry(0.045, 0.09, 4), std(0xf2a7b5, 0.8), s * 0.118, 0.17, 0.025, false);
    inner.rotation.z = -s * 0.35;
    inner.rotation.y = Math.PI / 4;
    part(head, new THREE.SphereGeometry(0.06, 14, 10), white, s * 0.045, -0.07, 0.14).scale.set(1, 0.8, 0.8);
    for (const k of [-1, 1]) {
      const w = part(head, new THREE.CylinderGeometry(0.003, 0.003, 0.17, 4), std(0xffffff, 0.4), s * 0.15, -0.06 + k * 0.02, 0.15, false);
      w.rotation.z = Math.PI / 2 + k * s * 0.12;
    }
  }
  part(head, new THREE.ConeGeometry(0.022, 0.025, 3), std(0xe07a8a, 0.6), 0, -0.035, 0.19).rotation.x = Math.PI / 2 + Math.PI;
  const eyes = addEyes(head, [new THREE.Vector3(-0.08, 0.04, 0.155), new THREE.Vector3(0.08, 0.04, 0.155)], 0.03, 0x2f8f3a);
  // pupilas em fenda
  for (const e of eyes.eyes) part(e, new THREE.BoxGeometry(0.008, 0.045, 0.01), std(0x050505, 0.2), 0, 0, 0.026, false);
  return { furMat, ...eyes };
}

function frogHead(head, fur) {
  const furMat = std(fur, 0.55);
  const belly = std(0xd8e6a0, 0.7);
  part(head, new THREE.SphereGeometry(0.2, 28, 20), furMat).scale.set(1.25, 0.78, 1.05);
  part(head, new THREE.SphereGeometry(0.16, 20, 14), belly, 0, -0.07, 0.06).scale.set(1.25, 0.5, 1);
  for (const s of [-1, 1]) part(head, new THREE.SphereGeometry(0.085, 18, 14), furMat, s * 0.11, 0.11, 0.06);
  const mouth = part(head, new THREE.TorusGeometry(0.16, 0.008, 6, 30, Math.PI * 0.7), std(0x2a3a1a, 0.5), 0, -0.02, 0.16, false);
  mouth.rotation.z = Math.PI + Math.PI * 0.15;
  mouth.scale.set(1, 0.5, 1);
  const eyes = addEyes(head, [new THREE.Vector3(-0.11, 0.13, 0.1), new THREE.Vector3(0.11, 0.13, 0.1)], 0.035, 0x111111, 0.065);
  return { furMat, ...eyes };
}

const HEADS = {
  urso: { fn: bearHead, fur: 0x7a4a2a },
  coelho: { fn: rabbitHead, fur: 0xd9d2cb },
  gato: { fn: catHead, fur: 0xe08a3c },
  sapo: { fn: frogHead, fur: 0x5aa04a },
};

// ------------------------------------------------------------------ personagem
export class Animal {
  constructor(kind, color) {
    this.kind = kind;
    this.group = new THREE.Group();
    this.phase = Math.random() * 10;
    const jacket = std(color, 0.6);
    const shirt = std(0xf4efe6, 0.7);
    const pants = std(0x1f1f26, 0.8);
    const bow = std(0x111111, 0.4);
    this.colorMats = [jacket];

    // pernas (sentado)
    for (const x of [-0.1, 0.1]) {
      part(this.group, new THREE.CapsuleGeometry(0.075, 0.3, 4, 10), pants, x, 0.58, 0.15).rotation.x = Math.PI / 2;
      part(this.group, new THREE.CapsuleGeometry(0.065, 0.38, 4, 10), pants, x, 0.3, 0.33);
      part(this.group, new THREE.SphereGeometry(0.08, 12, 8), std(0x111111, 0.4), x, 0.08, 0.38).scale.set(1, 0.6, 1.5);
    }

    // tronco (pivô no quadril)
    const torso = new THREE.Group();
    torso.position.set(0, 0.58, -0.05);
    this.group.add(torso);
    this.torso = torso;
    this.body = new THREE.Group();
    torso.add(this.body);
    part(this.body, new THREE.CapsuleGeometry(0.18, 0.33, 8, 16), jacket, 0, 0.32, 0).scale.set(1, 1, 0.85);
    part(this.body, new THREE.CylinderGeometry(0.07, 0.11, 0.2, 12), shirt, 0, 0.52, 0.09, false).rotation.x = -0.25;
    for (const s of [-1, 1]) {
      const wing = part(this.body, new THREE.ConeGeometry(0.035, 0.06, 8), bow, s * 0.03, 0.6, 0.15, false);
      wing.rotation.z = s * Math.PI / 2;
    }
    part(this.body, new THREE.SphereGeometry(0.018, 8, 6), bow, 0, 0.6, 0.155, false);

    // cabeça
    this.head = new THREE.Group();
    this.head.position.set(0, 0.86, 0.02);
    torso.add(this.head);
    const cfg = HEADS[kind];
    const h = cfg.fn(this.head, cfg.fur);
    this.furMat = h.furMat;
    this.eyes = h.eyes;
    this.xEyes = h.xs;
    this.baseColors = [jacket.color.clone(), h.furMat.color.clone()];

    // braços: ombro -> cotovelo -> mão
    this.arms = {};
    for (const [side, s] of [['L', 1], ['R', -1]]) {
      const shoulder = new THREE.Vector3(s * 0.22, 0.47, 0);
      const upper = new THREE.Group();
      upper.position.copy(shoulder);
      part(upper, new THREE.CapsuleGeometry(0.06, UP_ARM - 0.06, 4, 10), jacket, 0, -UP_ARM / 2, 0);
      const elbow = new THREE.Group();
      elbow.position.set(0, -UP_ARM, 0);
      upper.add(elbow);
      part(elbow, new THREE.CapsuleGeometry(0.052, FORE_ARM - 0.05, 4, 10), jacket, 0, -FORE_ARM / 2, 0);
      part(elbow, new THREE.CylinderGeometry(0.056, 0.056, 0.04, 12), shirt, 0, -FORE_ARM + 0.04, 0, false);
      const paw = part(elbow, new THREE.SphereGeometry(0.058, 14, 10), h.furMat, 0, -FORE_ARM - 0.02, 0);
      paw.scale.set(1, 1.1, 0.8);
      torso.add(upper);
      this.arms[side] = {
        s, shoulder, upper, elbow,
        current: new THREE.Vector3(),
        goal: new THREE.Vector3(),
        goalFn: null,
        pole: new THREE.Vector3(s, -0.6, -0.4).normalize(),
      };
    }
    this.pose('rest', true);

    this.group.traverse((o) => { if (o.isMesh) o.userData.animal = this; });
  }

  // Poses prontas (alvos das mãos no espaço do tronco)
  pose(name, instant = false) {
    const P = {
      rest: { L: [0.2, 0.24, 0.42], R: [-0.2, 0.24, 0.42] },
      cards: { L: [0.08, 0.45, 0.4], R: [-0.08, 0.45, 0.4] },
    }[name];
    for (const side of ['L', 'R']) {
      const a = this.arms[side];
      a.goalFn = null;
      a.goal.set(...P[side]);
      if (instant) a.current.copy(a.goal);
    }
    if (instant) this.solveIK();
  }

  // Mão segue um alvo dinâmico (ex.: o cabo do revólver). fn devolve Vector3 no espaço do tronco.
  follow(side, fn) {
    this.arms[side].goalFn = fn;
  }

  setHand(side, x, y, z) {
    const a = this.arms[side];
    a.goalFn = null;
    a.goal.set(x, y, z);
  }

  // converte um ponto do mundo para o espaço do tronco
  toTorso(worldPoint) {
    this.torso.updateWorldMatrix(true, false);
    return this.torso.worldToLocal(worldPoint.clone());
  }

  solveIK() {
    for (const a of Object.values(this.arms)) {
      const toTarget = a.current.clone().sub(a.shoulder);
      let d = toTarget.length();
      d = THREE.MathUtils.clamp(d, 0.05, UP_ARM + FORE_ARM - 0.001);
      const dir = toTarget.normalize();
      // lei dos cossenos para achar o cotovelo
      const along = (UP_ARM * UP_ARM - FORE_ARM * FORE_ARM + d * d) / (2 * d);
      const h = Math.sqrt(Math.max(UP_ARM * UP_ARM - along * along, 0));
      const pole = a.pole.clone().addScaledVector(dir, -a.pole.dot(dir)).normalize();
      const elbowPos = a.shoulder.clone().addScaledVector(dir, along).addScaledVector(pole, h);
      const hand = a.shoulder.clone().addScaledVector(dir, d);
      const upDir = elbowPos.clone().sub(a.shoulder).normalize();
      const foreDir = hand.sub(elbowPos).normalize();
      const qUp = new THREE.Quaternion().setFromUnitVectors(DOWN, upDir);
      const qFore = new THREE.Quaternion().setFromUnitVectors(DOWN, foreDir);
      a.upper.quaternion.copy(qUp);
      a.elbow.quaternion.copy(qUp.clone().invert().multiply(qFore));
    }
  }

  update(dt, t) {
    const k = 1 - Math.exp(-dt * 9);
    for (const a of Object.values(this.arms)) {
      const goal = a.goalFn ? a.goalFn() : a.goal;
      a.current.lerp(goal, k);
    }
    this.solveIK();
    if (!this.dead) {
      // respiração e olhar distraído
      this.body.scale.y = 1 + Math.sin(t * 2 + this.phase) * 0.012;
      this.head.rotation.y = Math.sin(t * 0.45 + this.phase) * 0.18;
      this.head.rotation.x = Math.sin(t * 0.7 + this.phase) * 0.04;
    }
  }

  // Primeira pessoa: esconde cabeça e corpo (os braços continuam visíveis segurando as cartas)
  setFirstPerson(on) {
    this.head.visible = !on;
    this.body.visible = !on;
  }

  // Posição dos olhos no mundo (para a câmera em primeira pessoa)
  eyeWorld() {
    this.group.updateWorldMatrix(true, true);
    return this.head.localToWorld(new THREE.Vector3(0, 0.03, 0.05));
  }

  reset(color) {
    this.dead = false;
    this.colorMats[0].color.set(color);
    this.baseColors[0].set(color);
    this.furMat.color.copy(this.baseColors[1]);
    this.torso.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);
    this.eyes.forEach((e) => { e.visible = true; });
    this.xEyes.forEach((e) => { e.visible = false; });
    this.group.position.y = 0;
    for (const w of this.wounds ?? []) w.removeFromParent();
    this.wounds = [];
    this.setFirstPerson(false);
    this.pose('rest', true);
  }

  // Ferimento de bala na cabeça (side = -1 entrada/direita, +1 saída/esquerda)
  addWound(side, halfWidth, size = 0.05) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x5a0006, roughness: 0.3 });
    const w = new THREE.Mesh(new THREE.SphereGeometry(size, 14, 10), mat);
    w.scale.set(0.35, 1, 1);
    w.position.set(side * (halfWidth - size * 0.15), 0.01, 0);
    this.head.add(w);
    // escorrido de sangue descendo pelo rosto
    const drip = new THREE.Mesh(new THREE.CapsuleGeometry(size * 0.3, 0.12, 4, 8), mat);
    drip.position.set(side * (halfWidth - 0.01), -0.07, 0.02);
    drip.scale.set(0.5, 1, 1);
    this.head.add(drip);
    (this.wounds ??= []).push(w, drip);
  }

  // Animação de eliminação: tomba para o lado, olhos em X, cores apagadas.
  kill(tweenFn, ease) {
    this.dead = true;
    this.eyes.forEach((e) => { e.visible = false; });
    this.xEyes.forEach((e) => { e.visible = true; });
    const grey = new THREE.Color(0x6a6a6a);
    const c0 = this.colorMats[0].color.clone();
    const c1 = this.furMat.color.clone();
    this.pose('rest');
    return tweenFn({
      duration: 1.0,
      ease,
      onUpdate: (e) => {
        this.torso.rotation.z = -0.6 * e; // tomba para o lado contrário ao tiro
        this.torso.rotation.x = -0.3 * e;
        this.head.rotation.z = -0.6 * e;
        this.head.rotation.x = 0.25 * e;
        this.colorMats[0].color.copy(c0).lerp(grey, e * 0.7);
        this.furMat.color.copy(c1).lerp(grey, e * 0.6);
      },
    });
  }
}
