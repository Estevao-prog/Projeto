import * as THREE from 'three';
import { TABLE_CENTER, TABLE_TOP } from './world.js';

// ---------------------------------------------------------------------------
// Efeitos do disparo: faíscas, fumaça do cano, jato de sangue e manchas
// (decals) que ficam na mesa/chão até a partida acabar.
// ---------------------------------------------------------------------------

function dotTexture(soft) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(soft ? 0.25 : 0.7, 'rgba(255,255,255,0.9)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// Mancha de sangue irregular desenhada no canvas (algumas variações)
function splatTexture(seed) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  g.fillStyle = 'rgba(120, 4, 8, 1)';
  // núcleo formado por vários círculos
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 40;
    g.beginPath();
    g.arc(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 22 + rnd() * 30, 0, Math.PI * 2);
    g.fill();
  }
  // respingos em volta, com "rastros"
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, d = 60 + rnd() * 60, r = 2 + rnd() * 9;
    const x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    if (rnd() < 0.5) {
      g.lineWidth = r * 0.8;
      g.strokeStyle = 'rgba(120, 4, 8, 1)';
      g.beginPath(); g.moveTo(128 + Math.cos(a) * 50, 128 + Math.sin(a) * 50); g.lineTo(x, y); g.stroke();
    }
  }
  // parte mais escura no centro
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 90);
  grad.addColorStop(0, 'rgba(50,0,2,0.6)');
  grad.addColorStop(1, 'rgba(50,0,2,0)');
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.splats = new THREE.Group();
    scene.add(this.splats);
    this.systems = [];
    this.growing = [];
    this.sparkTex = dotTexture(false);
    this.puffTex = dotTexture(true);
    this.splatTex = [1, 2, 3, 4, 5].map(splatTexture);
    this.splatGeo = new THREE.PlaneGeometry(1, 1);
    this.splatGeo.rotateX(-Math.PI / 2);
  }

  // Sistema de partículas genérico (Points) com gravidade
  emit({ origin, dir, count, speed, spread, gravity, life, size, material, onLand }) {
    const positions = new Float32Array(count * 3);
    const vel = [];
    const base = dir.clone().normalize();
    for (let i = 0; i < count; i++) {
      positions.set([origin.x, origin.y, origin.z], i * 3);
      const v = base.clone()
        .add(new THREE.Vector3((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread))
        .normalize()
        .multiplyScalar(speed * (0.4 + Math.random() * 0.8));
      vel.push(v);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = material.clone();
    mat.size = size;
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    this.group.add(points);
    this.systems.push({ points, vel, alive: new Array(count).fill(true), t: 0, life, gravity, onLand });
  }

  // Faíscas e fumaça saindo do cano
  muzzle(origin, dir) {
    this.emit({
      origin, dir, count: 55, speed: 2.4, spread: 1.0, gravity: 7, life: 0.32, size: 0.012,
      material: new THREE.PointsMaterial({
        color: new THREE.Color(6, 2.2, 0.4), map: this.sparkTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }),
    });
    this.emit({
      origin, dir, count: 14, speed: 0.35, spread: 1.4, gravity: -0.3, life: 1.4, size: 0.1,
      material: new THREE.PointsMaterial({ color: 0x5a5856, map: this.puffTex, transparent: true, opacity: 0.35, depthWrite: false }),
    });
  }

  // Jato de sangue: as gotas caem e viram manchas onde tocam (mesa ou chão)
  blood(origin, dir) {
    const mat = new THREE.PointsMaterial({ color: 0x6e0006, map: this.puffTex, transparent: true, alphaTest: 0.25 });
    this.emit({
      origin, dir, count: 160, speed: 2.6, spread: 0.9, gravity: 9.8, life: 2.5, size: 0.035, material: mat,
      onLand: (p) => { if (Math.random() < 0.35) this.splat(p, 0.03 + Math.random() * 0.07); },
    });
    // névoa fina de sangue
    this.emit({
      origin, dir, count: 40, speed: 1.2, spread: 1.4, gravity: 1, life: 0.9, size: 0.12,
      material: new THREE.PointsMaterial({ color: 0x6a0006, map: this.puffTex, transparent: true, opacity: 0.5, depthWrite: false }),
    });
  }

  surfaceHeight(p) {
    const dx = p.x - TABLE_CENTER.x, dz = p.z - TABLE_CENTER.z;
    return dx * dx + dz * dz < 1.55 * 1.55 ? TABLE_TOP + 0.006 : 0.012;
  }

  // Mancha (decal) que cresce rapidamente na superfície
  splat(point, size, grow = 0.25) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x8a1010,
      map: this.splatTex[Math.floor(Math.random() * this.splatTex.length)],
      transparent: true, alphaTest: 0.4, roughness: 0.25, metalness: 0.1,
      polygonOffset: true, polygonOffsetFactor: -4,
    });
    const m = new THREE.Mesh(this.splatGeo, mat);
    m.position.set(point.x, this.surfaceHeight(point) + this.splats.children.length * 0.00005, point.z);
    m.rotation.y = Math.random() * Math.PI * 2;
    m.scale.setScalar(0.001);
    m.receiveShadow = true;
    this.splats.add(m);
    this.growing.push({ m, t: 0, dur: grow, size });
    return m;
  }

  // Poça que vai aumentando devagar
  pool(point, size) {
    this.splat(point, size, 4);
  }

  clear() {
    this.splats.clear();
    this.group.clear();
    this.systems = [];
    this.growing = [];
  }

  update(dt) {
    const p = new THREE.Vector3();
    for (let s = this.systems.length - 1; s >= 0; s--) {
      const sys = this.systems[s];
      sys.t += dt;
      const pos = sys.points.geometry.attributes.position;
      for (let i = 0; i < sys.vel.length; i++) {
        if (!sys.alive[i]) continue;
        const v = sys.vel[i];
        v.y -= sys.gravity * dt;
        v.multiplyScalar(1 - dt * 0.8); // arrasto do ar
        p.fromBufferAttribute(pos, i).addScaledVector(v, dt);
        const floorY = this.surfaceHeight(p);
        if (sys.onLand && v.y < 0 && p.y <= floorY) {
          sys.alive[i] = false;
          sys.onLand(p.clone());
          p.y = -100; // esconde a gota
        }
        pos.setXYZ(i, p.x, p.y, p.z);
      }
      pos.needsUpdate = true;
      const k = sys.t / sys.life;
      sys.points.material.opacity = (sys.points.material.userData.o0 ??= sys.points.material.opacity) * Math.max(0, 1 - k * k);
      if (k >= 1) {
        sys.points.geometry.dispose();
        this.group.remove(sys.points);
        this.systems.splice(s, 1);
      }
    }
    for (let i = this.growing.length - 1; i >= 0; i--) {
      const g = this.growing[i];
      g.t += dt;
      const k = Math.min(g.t / g.dur, 1);
      g.m.scale.setScalar(g.size * (1 - Math.pow(1 - k, 3)));
      if (k >= 1) this.growing.splice(i, 1);
    }
  }
}
