import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Texturas de arquivo (pasta textures/) — carregadas com TextureLoader
// ---------------------------------------------------------------------------
let loader = null;
let maxAniso = 1;

export function initTextures(manager, renderer) {
  THREE.Cache.enabled = true; // a mesma imagem é baixada uma vez só
  loader = new THREE.TextureLoader(manager);
  maxAniso = renderer.capabilities.getMaxAnisotropy();
}

// Cada uso tem a sua repetição (repeat), por isso criamos uma textura por uso.
export function fileTexture(url, repeatX = 1, repeatY = 1, rotation = 0) {
  const t = loader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.rotation = rotation;
  t.anisotropy = maxAniso;
  return t;
}

// Mapas de dados (relevo/rugosidade) não usam espaço de cor sRGB
export function dataTexture(url, repeatX = 1, repeatY = 1) {
  const t = loader.load(url);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = maxAniso;
  return t;
}

export const TEX = {
  wood: 'textures/hardwood2_diffuse.jpg',
  woodBump: 'textures/hardwood2_bump.jpg',
  woodRough: 'textures/hardwood2_roughness.jpg',
  brickBump: 'textures/brick_bump.jpg',
  brick: 'textures/brick_diffuse.jpg',
  checker: 'textures/FloorsCheckerboard_S_Diffuse.jpg',
  crate: 'textures/crate.gif',
};

// ---------------------------------------------------------------------------
// Texturas procedurais (desenhadas em <canvas>)
// ---------------------------------------------------------------------------
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function canvasTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  return t;
}

// Feltro verde da mesa de jogo
export function feltTexture() {
  const [c, g] = makeCanvas(1024, 1024);
  const grad = g.createRadialGradient(512, 512, 60, 512, 512, 520);
  grad.addColorStop(0, '#1f7a43');
  grad.addColorStop(1, '#0b3d22');
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 1024);
  // granulado do tecido
  for (let i = 0; i < 40000; i++) {
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.05})`;
    g.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
  }
  g.strokeStyle = '#d8b25a';
  g.lineWidth = 6;
  g.beginPath(); g.arc(512, 512, 330, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 2;
  g.beginPath(); g.arc(512, 512, 300, 0, Math.PI * 2); g.stroke();
  g.fillStyle = 'rgba(216,178,90,0.85)';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = 'bold 150px Georgia';
  g.fillText('21', 512, 470);
  g.font = 'bold 34px Georgia';
  g.fillText('A BANCA PARA NO 17', 512, 580);
  g.font = '26px Georgia';
  g.fillText('QUEM PERDE, GIRA O TAMBOR', 512, 625);
  return canvasTexture(c);
}

// Tapete vermelho com padrão (área da mesa e lounge)
export function carpetTexture(base = '#5a0f16', pattern = '#7d1a22', gold = '#b38a3c') {
  const [c, g] = makeCanvas(512, 512);
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = pattern;
  g.lineWidth = 10;
  for (let i = -512; i < 1024; i += 64) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 512, 512); g.stroke();
    g.beginPath(); g.moveTo(i + 512, 0); g.lineTo(i, 512); g.stroke();
  }
  g.fillStyle = gold;
  for (let x = 32; x < 512; x += 64) for (let y = 0; y < 512; y += 64) {
    g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill();
  }
  const t = canvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Placas com texto (sinalização dos setores)
export function signTexture(text, { width = 1024, height = 256, bg = '#1a0f0a', fg = '#f1c46b', border = '#b38a3c', font = 'bold 120px Georgia', sub = null } = {}) {
  const [c, g] = makeCanvas(width, height);
  g.fillStyle = bg;
  g.fillRect(0, 0, width, height);
  g.strokeStyle = border;
  g.lineWidth = 12;
  g.strokeRect(10, 10, width - 20, height - 20);
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = font;
  g.fillText(text, width / 2, sub ? height * 0.42 : height / 2, width - 60);
  if (sub) {
    g.font = '40px Georgia';
    g.fillStyle = '#d9c9a5';
    g.fillText(sub, width / 2, height * 0.78, width - 60);
  }
  return canvasTexture(c);
}

// Letreiro neon (fundo transparente + brilho)
export function neonTexture(text, color = '#ff2d6f', { width = 1024, height = 256, font = 'bold 130px Georgia' } = {}) {
  const [c, g] = makeCanvas(width, height);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = font;
  for (const blur of [40, 20, 8]) {
    g.shadowColor = color;
    g.shadowBlur = blur;
    g.fillStyle = color;
    g.fillText(text, width / 2, height / 2);
  }
  g.shadowBlur = 0;
  g.fillStyle = '#fff3f7';
  g.fillText(text, width / 2, height / 2);
  return canvasTexture(c);
}

// Cartas do baralho
const SUIT_COLORS = { '♠': '#111', '♣': '#111', '♥': '#c1121f', '♦': '#c1121f' };
const cardCache = new Map();

export function cardFaceTexture(rank, suit) {
  const key = rank + suit;
  if (cardCache.has(key)) return cardCache.get(key);
  const [c, g] = makeCanvas(256, 356);
  g.fillStyle = '#fbf8f0';
  g.fillRect(0, 0, 256, 356);
  g.strokeStyle = '#c9c1ad';
  g.lineWidth = 6;
  g.strokeRect(3, 3, 250, 350);
  g.fillStyle = SUIT_COLORS[suit];
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = 'bold 54px Georgia';
  g.fillText(rank, 40, 46);
  g.font = '44px Georgia';
  g.fillText(suit, 40, 98);
  g.save();
  g.translate(216, 310);
  g.rotate(Math.PI);
  g.font = 'bold 54px Georgia';
  g.fillText(rank, 0, 0);
  g.font = '44px Georgia';
  g.fillText(suit, 0, -52);
  g.restore();
  g.font = '150px Georgia';
  g.fillText(suit, 128, 185);
  const t = canvasTexture(c);
  cardCache.set(key, t);
  return t;
}

let backTex = null;
export function cardBackTexture() {
  if (backTex) return backTex;
  const [c, g] = makeCanvas(256, 356);
  g.fillStyle = '#fbf8f0';
  g.fillRect(0, 0, 256, 356);
  g.fillStyle = '#8f1520';
  g.fillRect(14, 14, 228, 328);
  g.strokeStyle = '#e7c27a';
  g.lineWidth = 3;
  for (let i = -356; i < 356; i += 22) {
    g.beginPath(); g.moveTo(14 + i, 14); g.lineTo(14 + i + 328, 342); g.stroke();
    g.beginPath(); g.moveTo(242 - i, 14); g.lineTo(242 - i - 328, 342); g.stroke();
  }
  g.fillStyle = '#8f1520';
  g.beginPath(); g.arc(128, 178, 52, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#e7c27a';
  g.font = 'bold 56px Georgia';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('21', 128, 180);
  backTex = canvasTexture(c);
  return backTex;
}

// Tela das máquinas caça-níquel
export function slotScreenTexture(symbols) {
  const [c, g] = makeCanvas(384, 160);
  g.fillStyle = '#120a14';
  g.fillRect(0, 0, 384, 160);
  for (let i = 0; i < 3; i++) {
    g.fillStyle = '#f6f0e0';
    g.fillRect(12 + i * 124, 14, 112, 132);
    g.fillStyle = ['#c1121f', '#d4a017', '#1b7f3b'][i % 3];
    g.font = 'bold 76px Georgia';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(symbols[i], 68 + i * 124, 84);
  }
  return canvasTexture(c);
}

// Alvo de dardos
export function dartboardTexture() {
  const [c, g] = makeCanvas(512, 512);
  const cx = 256, cy = 256;
  const rings = [250, 230, 160, 140, 40, 18];
  for (let s = 0; s < 20; s++) {
    const a0 = (s / 20) * Math.PI * 2 - Math.PI / 20;
    const a1 = a0 + Math.PI / 10;
    for (let r = 0; r < 4; r++) {
      const even = (s + r) % 2 === 0;
      g.fillStyle = r % 2 === 1 ? (even ? '#c1121f' : '#1b7f3b') : (even ? '#111' : '#efe3c4');
      g.beginPath();
      g.moveTo(cx, cy);
      g.arc(cx, cy, rings[r], a0, a1);
      g.closePath();
      g.fill();
    }
  }
  g.fillStyle = '#1b7f3b'; g.beginPath(); g.arc(cx, cy, rings[4], 0, Math.PI * 2); g.fill();
  g.fillStyle = '#c1121f'; g.beginPath(); g.arc(cx, cy, rings[5], 0, Math.PI * 2); g.fill();
  return canvasTexture(c);
}

// Etiqueta com texto (usada em Sprites acima dos jogadores)
export function labelCanvas(width = 512, height = 160) {
  const [c, g] = makeCanvas(width, height);
  const tex = canvasTexture(c);
  return { canvas: c, ctx: g, texture: tex };
}
