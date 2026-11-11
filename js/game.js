import * as THREE from 'three';
import { tween, tweenVec, tweenQuat, wait, Ease } from './tween.js';
import { createCard } from './props.js';
import { labelCanvas } from './textures.js';
import { TABLE_TOP, SEAT_ANGLES, SEAT_RADIUS, SEATS_FOR, DEALER_ANGLE, PLAYER_COLORS, aroundTable } from './world.js';
import { ANIMALS } from './characters.js';

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];
const ABORT = Symbol('abort');
const Y = new THREE.Vector3(0, 1, 0);

const HAND_SCALE = 1.3;                                   // cartas na mão ficam maiores
const GRIP = new THREE.Vector3(-0.2, -0.12, 0);           // cabo do revólver (coords. do modelo)
const DRUM = new THREE.Vector3(0.02, 0.02, 0.09);         // lateral do tambor (onde a outra mão gira)
const BULLETS = 2; // balas no tambor de 6 câmaras (2/6 de chance) — não é mostrado ao jogador
const HEAD_HALF_WIDTH = { urso: 0.2, coelho: 0.18, gato: 0.205, sapo: 0.24 };

function newDeck() {
  const deck = [];
  for (const s of SUITS) for (const r of RANKS) deck.push({ rank: r, suit: s });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Valor da mão no 21: Ás vale 11 ou 1, figuras valem 10.
export function handValue(hand) {
  let total = 0, aces = 0;
  for (const c of hand) {
    if (c.hidden) continue;
    if (c.rank === 'A') { total += 11; aces++; }
    else if ('JQK'.includes(c.rank) || c.rank === '10') total += 10;
    else total += Number(c.rank);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

// Posição de cada carta no leque da mão (no espaço do "porta-cartas")
function fanSlot(k, n) {
  const phi = (k - (n - 1) / 2) * 0.17;
  const R = 0.3;
  return {
    pos: new THREE.Vector3(R * Math.sin(phi), k * 0.003, R - R * Math.cos(phi)),
    quat: new THREE.Quaternion().setFromAxisAngle(Y, -phi),
  };
}

// Etiqueta flutuante (Sprite) com nome e pontos
class Label {
  constructor(color) {
    const { ctx, texture } = labelCanvas(512, 170);
    this.ctx = ctx;
    this.texture = texture;
    this.color = color;
    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true }));
    this.sprite.scale.set(0.84, 0.28, 1);
    this.sprite.renderOrder = 10;
  }

  draw(name, line2 = '', dim = false) {
    const g = this.ctx;
    g.clearRect(0, 0, 512, 170);
    g.fillStyle = dim ? 'rgba(30,30,30,0.75)' : 'rgba(15,8,10,0.82)';
    g.beginPath();
    g.roundRect(6, 6, 500, 158, 26);
    g.fill();
    g.lineWidth = 6;
    g.strokeStyle = dim ? '#666' : this.color;
    g.stroke();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = dim ? '#999' : '#fff';
    g.font = 'bold 56px Segoe UI, Arial';
    g.fillText(name, 256, 58, 470);
    g.font = '44px Segoe UI, Arial';
    g.fillStyle = dim ? '#aaa' : '#ffd27a';
    g.fillText(line2, 256, 122, 470);
    this.texture.needsUpdate = true;
  }
}

export class Game {
  constructor({ scene, world, director, ui, sfx, dealerAnim, effects }) {
    this.effects = effects;
    this.gore = true; // sangue ligado/desligado (botão na interface)
    this.scene = scene;
    this.world = world;
    this.director = director;
    this.ui = ui;
    this.sfx = sfx;
    this.dealerAnim = dealerAnim;
    this.token = 0;
    this.players = [];
    this.dealer = { hand: [], cards: [], handText: '' };
    this.round = 0;
    this.lastEvent = 'Aguardando jogadores...';
    this.hallOfFame = this.loadHall();
    this.allCards = [];

    this.cardGroup = new THREE.Group();
    scene.add(this.cardGroup);

    this.dealerLabel = new Label('#9fd3ff');
    this.dealerLabel.sprite.position.copy(aroundTable(DEALER_ANGLE, 2.3, 2.45));
    this.dealerLabel.draw('Crupiê', 'a banca');
    scene.add(this.dealerLabel.sprite);

    this.playerLabels = PLAYER_COLORS.map((c) => {
      const l = new Label(c);
      l.sprite.visible = false;
      scene.add(l.sprite);
      return l;
    });

    // um "porta-cartas" por cadeira: as cartas da mão ficam em leque, inclinadas para o jogador
    this.holders = SEAT_ANGLES.map((theta) => {
      const frame = new THREE.Group();
      frame.position.copy(aroundTable(theta, SEAT_RADIUS));
      frame.rotation.y = theta + Math.PI;
      const holder = new THREE.Group();
      holder.position.set(0, 1.1, 0.38);
      holder.rotation.set(-0.9, Math.PI, 0);
      frame.add(holder);
      scene.add(frame);
      return holder;
    });

    this.revolver = world.table.revolver;
    this.placeIdle();
    this.updateBoards();
  }

  // ------------------------------------------------------------------ util
  // Aguarda uma Promise e cancela o fluxo se uma nova partida/menu começou.
  async g(promise, token) {
    const value = await promise;
    if (token !== this.token) throw ABORT;
    return value;
  }

  abort() {
    this.token++;
    this.ui.clearActions();
    for (const p of this.players) p.animal.setFirstPerson(false);
  }

  loadHall() {
    try { return JSON.parse(localStorage.getItem('ultimaCartaHall') || '[]'); } catch { return []; }
  }

  saveHall() {
    try { localStorage.setItem('ultimaCartaHall', JSON.stringify(this.hallOfFame.slice(0, 6))); } catch { /* sem armazenamento */ }
  }

  update(dt, t) {
    for (const a of this.world.animals) if (a.group.visible) a.update(dt, t);
  }

  seatAnimal(animal, seatIndex, color) {
    const theta = SEAT_ANGLES[seatIndex];
    const pos = aroundTable(theta, SEAT_RADIUS);
    animal.group.position.set(pos.x, 0, pos.z);
    animal.group.rotation.set(0, theta + Math.PI, 0);
    animal.reset(color);
    animal.group.visible = true;
  }

  // Modo exploração: os quatro animais ficam sentados à mesa
  placeIdle() {
    SEATS_FOR[4].forEach((seat, i) => this.seatAnimal(this.world.animals[i], seat, PLAYER_COLORS[i]));
  }

  // ------------------------------------------------------------------ partida
  async start(names) {
    this.abort();
    const token = this.token;
    this.effects.clear();
    this.clearCards();
    this.resetRevolver();
    this.round = 0;

    const seatIdx = SEATS_FOR[names.length];
    this.world.animals.forEach((a) => { a.group.visible = false; });
    this.playerLabels.forEach((l) => { l.sprite.visible = false; });
    this.players = names.map((name, i) => ({
      name,
      kind: ANIMALS[i].kind,
      color: PLAYER_COLORS[i],
      seat: seatIdx[i],
      theta: SEAT_ANGLES[seatIdx[i]],
      holder: this.holders[seatIdx[i]],
      animal: this.world.animals[i],
      label: this.playerLabels[i],
      alive: true,
      hand: [], cards: [], handText: '',
      wins: 0, losses: 0, survived: 0, pulls: 0,
      result: '',
    }));

    for (const p of this.players) {
      this.seatAnimal(p.animal, p.seat, p.color);
      p.label.sprite.position.copy(aroundTable(p.theta, SEAT_RADIUS, 2.25));
      p.label.sprite.visible = true;
      p.label.draw(p.name, 'pronto');
    }

    this.lastEvent = 'Partida iniciada!';
    this.refresh();
    this.dealerAnim.emote('Wave');
    this.ui.status('Bem-vindos à mesa', 'Quem perder para a banca encosta o revólver na cabeça...');
    try {
      await this.g(this.director.preset('mesa', 1.6), token);
      while (this.alive().length > 1) {
        await this.playRound(token);
        if (this.alive().length > 1) {
          await this.g(this.ui.choose([{ id: 'next', label: 'Próxima rodada', primary: true }]), token);
        }
      }
      await this.gameOver(token);
    } catch (e) {
      if (e !== ABORT) throw e;
    }
  }

  alive() {
    return this.players.filter((p) => p.alive);
  }

  clearCards() {
    for (const c of this.allCards) c.removeFromParent();
    this.allCards = [];
    for (const p of this.players) { p.hand = []; p.cards = []; p.handText = ''; }
    this.dealer.hand = [];
    this.dealer.cards = [];
    this.dealer.handText = '';
    this.dealerLabel.draw('Crupiê', 'a banca');
  }

  resetRevolver() {
    const home = this.world.table.revolverHome;
    this.scene.attach(this.revolver);
    this.revolver.position.copy(home.position);
    this.revolver.quaternion.copy(home.quaternion);
    this.revolver.userData.hammer.rotation.z = 0;
    this.revolver.userData.flash.material.opacity = 0;
  }

  // Recolhe todas as cartas de volta para o baralho
  async collectCards() {
    const deckPos = this.world.table.deckPos;
    const target = new THREE.Vector3(deckPos.x, TABLE_TOP + 0.06, deckPos.z);
    await Promise.all(this.allCards.map((c, i) => {
      this.cardGroup.attach(c);
      const s0 = c.scale.x;
      return Promise.all([
        tweenVec(c.position, target, { duration: 0.4, delay: i * 0.02 }),
        tween({ duration: 0.4, delay: i * 0.02, onUpdate: (e) => c.scale.setScalar(THREE.MathUtils.lerp(s0, 1, e)) }),
      ]);
    }));
    this.clearCards();
    for (const p of this.players) if (p.alive) p.animal.pose('rest');
  }

  // ------------------------------------------------------------------ rodada
  async playRound(token) {
    this.round++;
    const deck = newDeck();
    const players = this.alive();

    if (this.allCards.length) await this.g(this.collectCards(), token);
    else this.clearCards();
    for (const p of players) { p.result = ''; p.label.draw(p.name, '...'); }
    this.refresh();

    this.ui.status(`Rodada ${this.round}`, 'Distribuindo as cartas...');
    for (let pass = 0; pass < 2; pass++) {
      for (const p of players) await this.g(this.dealToPlayer(p, deck), token);
      await this.g(this.dealToDealer(deck, pass === 0), token);
    }

    // vez de cada jogador — câmera em primeira pessoa, olhando as próprias cartas
    for (const p of players) {
      this.current = p;
      p.label.sprite.visible = false;
      this.refresh();
      await this.g(this.enterPOV(p), token);
      while (true) {
        const v = handValue(p.hand);
        if (v > 21) {
          p.result = 'estourou';
          this.ui.status(`${p.name} estourou com ${v}!`, 'Passou de 21...');
          this.sfx.lose();
          await this.g(wait(1.3), token);
          break;
        }
        if (v === 21) {
          this.ui.status(`${p.name} fez 21!`, p.hand.length === 2 ? 'Blackjack!' : 'Parou automaticamente.');
          this.sfx.win();
          await this.g(wait(1.2), token);
          break;
        }
        this.ui.status(`Vez de ${p.name}: ${v} pontos`, 'Pedir mais uma carta ou parar?  (arraste o mouse para olhar em volta)');
        const choice = await this.g(this.ui.choose([
          { id: 'hit', label: 'Pedir carta', primary: true },
          { id: 'stand', label: `Parar (${v})` },
        ]), token);
        if (choice === 'stand') break;
        await this.g(this.dealToPlayer(p, deck), token);
      }
      p.animal.setFirstPerson(false);
      p.label.sprite.visible = true;
      this.refresh();
    }
    this.current = null;

    // vez da banca
    await this.g(this.director.preset('mesa', 1.0), token);
    this.ui.status('Vez da banca', 'O crupiê revela a carta escondida...');
    await this.g(this.reveal(this.dealer.cards[1], this.dealer.hand[1]), token);
    const anyStanding = players.some((p) => handValue(p.hand) <= 21);
    while (anyStanding && handValue(this.dealer.hand) < 17) {
      await this.g(wait(0.5), token);
      await this.g(this.dealToDealer(deck, true), token);
    }
    const dv = handValue(this.dealer.hand);
    await this.g(wait(0.4), token);

    // todos mostram as cartas na mesa
    this.ui.status(`Banca: ${dv > 21 ? `estourou (${dv})` : dv}`, 'Mostrem as cartas!');
    await this.g(Promise.all(players.map((p) => this.showdown(p))), token);
    await this.g(wait(0.6), token);

    // resultado: quem estourou ou ficou abaixo da banca perde
    const losers = [];
    for (const p of players) {
      const v = handValue(p.hand);
      if (v > 21) { p.result = 'estourou'; p.losses++; losers.push(p); }
      else if (dv > 21 || v > dv) { p.result = 'venceu'; p.wins++; }
      else if (v === dv) { p.result = 'empate'; }
      else { p.result = 'perdeu'; p.losses++; losers.push(p); }
      p.label.draw(p.name, `${v} · ${p.result}`);
    }
    this.dealerLabel.draw('Crupiê', dv > 21 ? `${dv} · estourou` : `${dv} pontos`);
    this.lastEvent = losers.length
      ? `Rodada ${this.round}: ${losers.map((p) => p.name).join(', ')} vai(ão) para a roleta`
      : `Rodada ${this.round}: ninguém perdeu!`;
    this.refresh();

    if (!losers.length) {
      this.dealerAnim.emote('No');
      this.sfx.win();
      this.ui.status(dv > 21 ? `A banca estourou com ${dv}!` : 'Ninguém perdeu para a banca!', 'O revólver descansa nesta rodada.');
      return;
    }
    this.dealerAnim.emote('Yes');
    this.sfx.lose();
    this.ui.status(
      `Banca: ${dv > 21 ? 'estourou' : dv}. Perdedores: ${losers.map((p) => p.name).join(', ')}`,
      'Hora da roleta russa...',
    );
    await this.g(this.ui.choose([{ id: 'go', label: 'Ir para a roleta', primary: true }]), token);

    for (const p of losers) await this.roulette(p, token);
    await this.g(this.director.preset('mesa', 1.2), token);
  }

  // ------------------------------------------------------------------ cartas
  spawnCard(card) {
    const mesh = createCard(card.rank, card.suit);
    const deckPos = this.world.table.deckPos;
    mesh.position.set(deckPos.x, TABLE_TOP + 0.055, deckPos.z);
    mesh.rotation.set(0, DEALER_ANGLE + 0.3, Math.PI);
    this.cardGroup.add(mesh);
    this.allCards.push(mesh);
    this.sfx.card();
    return mesh;
  }

  // Voo da carta (em arco) até uma posição/rotação/escala no mundo
  flyCard(mesh, toPos, toQuat, toScale = 1, duration = 0.5) {
    const p0 = mesh.position.clone();
    const q0 = mesh.quaternion.clone();
    const s0 = mesh.scale.x;
    return tween({
      duration,
      ease: Ease.outCubic,
      onUpdate: (e) => {
        mesh.position.lerpVectors(p0, toPos, e);
        mesh.position.y += Math.sin(e * Math.PI) * 0.3;
        mesh.quaternion.slerpQuaternions(q0, toQuat, e);
        mesh.scale.setScalar(THREE.MathUtils.lerp(s0, toScale, e));
      },
    });
  }

  // Carta vai para a mão do jogador (leque virado para ele)
  async dealToPlayer(p, deck) {
    const card = deck.pop();
    p.hand.push(card);
    const mesh = this.spawnCard(card);
    const n = p.hand.length;
    p.animal.pose('cards');

    // abre o leque para caber a nova carta
    p.cards.forEach((c, i) => {
      const s = fanSlot(i, n);
      tweenVec(c.position, s.pos, { duration: 0.3 });
      tweenQuat(c.quaternion, s.quat, { duration: 0.3 });
    });
    const slot = fanSlot(n - 1, n);
    p.holder.updateWorldMatrix(true, false);
    const wp = p.holder.localToWorld(slot.pos.clone());
    const wq = p.holder.getWorldQuaternion(new THREE.Quaternion()).multiply(slot.quat);
    await this.flyCard(mesh, wp, wq, HAND_SCALE);
    p.holder.attach(mesh);
    mesh.position.copy(slot.pos);
    mesh.quaternion.copy(slot.quat);
    mesh.scale.setScalar(HAND_SCALE);
    p.cards.push(mesh);
    this.updateHandText(p);
    this.refresh();
  }

  // Carta da banca fica sobre a mesa, na frente do robô
  async dealToDealer(deck, faceUp) {
    const card = deck.pop();
    card.hidden = !faceUp;
    this.dealer.hand.push(card);
    const mesh = this.spawnCard(card);
    const k = this.dealer.cards.length;
    this.dealer.cards.push(mesh);
    const theta = DEALER_ANGLE;
    const tangent = new THREE.Vector3(Math.cos(theta), 0, -Math.sin(theta));
    const pos = aroundTable(theta, 0.82, TABLE_TOP + 0.003 + k * 0.0012).addScaledVector(tangent, k * 0.1 - 0.1);
    const rot = new THREE.Euler(0, theta, faceUp ? 0 : Math.PI);
    await this.flyCard(mesh, pos, new THREE.Quaternion().setFromEuler(rot));
    mesh.rotation.copy(rot);
    this.updateHandText(this.dealer);
    this.refresh();
  }

  async reveal(mesh, card) {
    card.hidden = false;
    this.sfx.card();
    const y0 = mesh.position.y;
    await tween({
      duration: 0.5,
      onUpdate: (e) => {
        mesh.rotation.z = Math.PI * (1 - e);
        mesh.position.y = y0 + Math.sin(e * Math.PI) * 0.12;
      },
    });
    this.updateHandText(this.dealer);
    this.refresh();
  }

  updateHandText(who) {
    const v = handValue(who.hand);
    const hidden = who.hand.some((c) => c.hidden);
    who.handText = `${v}${hidden ? ' + ?' : ''}`;
    if (who === this.dealer) this.dealerLabel.draw('Crupiê', `${who.handText} pontos`);
    else who.label.draw(who.name, `${who.handText} pontos`);
  }

  // As cartas da mão vão para a mesa, viradas para cima, na frente do jogador
  showdown(p) {
    const theta = p.theta;
    const tangent = new THREE.Vector3(Math.cos(theta), 0, -Math.sin(theta));
    p.animal.pose('rest');
    const n = p.cards.length;
    const cards = p.cards;
    p.cards = [];
    return Promise.all(cards.map((mesh, k) => {
      this.cardGroup.attach(mesh);
      const pos = aroundTable(theta, 0.95, TABLE_TOP + 0.003 + k * 0.0012).addScaledVector(tangent, (k - (n - 1) / 2) * 0.1);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, theta, 0));
      return this.flyCard(mesh, pos, q, 1, 0.45 + k * 0.05);
    }));
  }

  // Câmera nos olhos do personagem, olhando para as cartas e para a mesa
  async enterPOV(p) {
    const a = p.animal;
    const eye = a.eyeWorld();
    const look = a.group.localToWorld(new THREE.Vector3(0, 0.78, 1.25));
    await this.director.enterPOV(eye, look, 1.2);
    a.setFirstPerson(true);
  }

  // ------------------------------------------------------------------ roleta russa
  async roulette(p, token) {
    const rev = this.revolver;
    const { drum, hammer, trigger, flash, flashLight } = rev.userData;
    const a = p.animal;
    const local = (x, y, z) => a.group.localToWorld(new THREE.Vector3(x, y, z));

    this.current = p;
    this.refresh();
    p.label.sprite.visible = false;
    this.ui.status(`${p.name} vai para a roleta russa`, 'Ninguém sabe onde estão as balas...');

    // câmera de frente para o personagem (vista de cima da mesa)
    const camMove = this.director.flyTo(local(-0.3, 1.55, 1.5), local(-0.18, 1.3, 0), 1.5);

    // 1) o personagem estica a mão e pega o revólver na mesa
    a.follow('R', () => a.toTorso(rev.localToWorld(GRIP.clone())));
    await this.g(Promise.all([camMove, wait(0.8)]), token);
    a.torso.attach(rev);
    const spinPos = new THREE.Vector3(-0.1, 0.42, 0.42);
    const spinQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2); // cano para cima
    this.sfx.cock();
    await this.g(Promise.all([
      tweenVec(rev.position, spinPos, { duration: 0.8 }),
      tweenQuat(rev.quaternion, spinQuat, { duration: 0.8 }),
    ]), token);
    a.follow('L', () => a.toTorso(rev.localToWorld(DRUM.clone())));

    // carrega o tambor em segredo: sorteia quais câmaras têm bala
    const loaded = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, BULLETS);

    // 2) girar o tambor
    this.ui.status(`${p.name} segura o revólver`, 'Gire o tambor...');
    await this.g(this.ui.choose([{ id: 'spin', label: '🔄 Girar o tambor', primary: true }]), token);
    this.ui.status(`${p.name} gira o tambor...`, 'clic, clic, clic...');
    const landed = Math.floor(Math.random() * 6);
    const step = Math.PI / 3;
    const start = drum.rotation.x;
    const turns = 4 + Math.random() * 2;
    const end = Math.ceil((start + turns * Math.PI * 2) / step) * step; // para exatamente numa câmara
    let lastStep = Math.floor(start / step);
    await this.g(tween({
      duration: 2.4,
      ease: Ease.outCubic,
      onUpdate: (e) => {
        drum.rotation.x = start + (end - start) * e;
        const s = Math.floor(drum.rotation.x / step);
        if (s !== lastStep) { lastStep = s; this.sfx.tick(0.25); }
      },
    }), token);

    // 3) encosta o cano na cabeça
    a.pose('rest');
    a.follow('R', () => a.toTorso(rev.localToWorld(GRIP.clone())));
    const half = HEAD_HALF_WIDTH[p.kind] ?? 0.2;
    const sc = rev.scale.x;
    const templePos = new THREE.Vector3(-(half + 0.015) - 0.6 * sc, a.head.position.y + 0.01, a.head.position.z);
    this.ui.status(`${p.name} encosta o revólver na cabeça`, 'Respire fundo...');
    await this.g(Promise.all([
      tweenVec(rev.position, templePos, { duration: 1.0 }),
      tweenQuat(rev.quaternion, new THREE.Quaternion(), { duration: 1.0 }),
      this.director.flyTo(local(-1.0, 1.55, 1.05), local(-0.25, 1.36, 0), 1.0),
    ]), token);
    await this.g(this.ui.choose([{ id: 'pull', label: '💀 Puxar o gatilho', primary: true }]), token);

    // 4) engatilha + suspense
    this.sfx.cock();
    this.ui.status('...', '');
    await this.g(tween({ duration: 0.35, onUpdate: (e) => { hammer.rotation.z = 0.7 * e; } }), token);
    this.sfx.heartbeat(3, 0.62);
    await this.g(this.director.flyTo(local(-0.65, 1.48, 0.7), local(-0.25, 1.38, 0), 1.8, Ease.inCubic), token);

    // 5) dispara: o cão bate e o tambor avança uma câmara
    trigger.rotation.z = 0.35;
    hammer.rotation.z = 0;
    drum.rotation.x += step;
    p.pulls++;
    const bang = loaded.includes(landed);

    if (bang) {
      // faíscas e fumaça saindo do revólver
      const revQuat = rev.getWorldQuaternion(new THREE.Quaternion());
      const barrel = new THREE.Vector3(1, 0, 0).applyQuaternion(revQuat);
      const muzzle = rev.localToWorld(flash.position.clone());
      this.effects.muzzle(muzzle, barrel.clone().negate().add(new THREE.Vector3(0, 0.6, 0)));
      this.effects.muzzle(rev.localToWorld(new THREE.Vector3(0.1, 0.03, 0)), new THREE.Vector3(0, 1, 0).add(barrel.clone().multiplyScalar(-0.5)));
      if (this.gore) {
        // o sangue sai do outro lado da cabeça e respinga na mesa
        const head = a.head.getWorldPosition(new THREE.Vector3());
        const exit = head.clone().addScaledVector(barrel, half);
        const towardTable = a.group.localToWorld(new THREE.Vector3(0, 0, 1)).sub(a.group.position).normalize();
        this.effects.blood(exit, barrel.clone().addScaledVector(towardTable, 0.9).add(new THREE.Vector3(0, 0.35, 0)));
        this.effects.blood(exit, barrel.clone().addScaledVector(towardTable, 0.3).add(new THREE.Vector3(0, 0.6, 0)));
        a.addWound(-1, half, 0.035);
        a.addWound(1, half, 0.06);
        // poça crescendo no chão, embaixo do lado em que ele tombou, e uma mancha grande na mesa
        setTimeout(() => {
          this.effects.pool(a.group.localToWorld(new THREE.Vector3(0.45, 0, 0.15)), 0.8);
          this.effects.splat(aroundTable(p.theta + 0.12, 1.25), 0.35, 0.4);
        }, 900);
      }
      this.sfx.bang();
      this.ui.flash('#fff2d0', 900);
      flashLight.intensity = 60;
      this.director.shake(0.5, 0.1);
      tween({ duration: 0.45, onUpdate: (e) => { flash.material.opacity = 1 - e; flash.scale.setScalar(2 + e * 5); flashLight.intensity = 60 * (1 - e); } });
      p.alive = false;
      p.result = 'eliminado';
      this.lastEvent = `BANG! ${p.name} foi eliminado na rodada ${this.round}`;
      this.ui.status(`💥 BANG! ${p.name} foi eliminado!`, 'A bala estava na câmara.');
      this.dealerAnim.emote('No');
      // o revólver cai na mesa e o personagem tomba
      this.scene.attach(rev);
      const home = this.world.table.revolverHome;
      const fallPos = aroundTable(p.theta, 1.25, TABLE_TOP + 0.022);
      tween({ duration: 0.6, ease: Ease.inCubic, onUpdate: (e) => { rev.position.lerp(fallPos, e); } });
      tweenQuat(rev.quaternion, home.quaternion, { duration: 0.6 });
      a.kill(tween, Ease.outBack);
      this.director.flyTo(local(-1.2, 1.8, 1.8), local(-0.1, 1.05, 0), 1.4);
      p.label.draw(p.name, '☠ eliminado', true);
    } else {
      this.sfx.dryClick();
      p.survived++;
      this.lastEvent = `Click... ${p.name} sobreviveu à roleta`;
      this.ui.status(`Click... ${p.name} sobreviveu!`, 'Câmara vazia. Que sorte!');
      this.dealerAnim.emote('ThumbsUp');
      p.label.draw(p.name, 'sobreviveu!');
    }
    this.refresh();
    await this.g(wait(0.25), token);
    trigger.rotation.z = 0;
    await this.g(wait(bang ? 2.0 : 1.0), token);

    // 6) revólver volta para o centro da mesa
    if (!bang) a.follow('R', () => a.toTorso(rev.localToWorld(GRIP.clone())));
    this.scene.attach(rev);
    const home = this.world.table.revolverHome;
    const p0 = rev.position.clone();
    await this.g(Promise.all([
      tween({ duration: 1.0, onUpdate: (e) => { rev.position.lerpVectors(p0, home.position, e); rev.position.y += Math.sin(e * Math.PI) * 0.25; } }),
      tweenQuat(rev.quaternion, home.quaternion, { duration: 1.0 }),
    ]), token);
    flash.scale.setScalar(1);
    if (!bang) a.pose('rest');
    p.label.sprite.visible = true;
    this.current = null;
    this.refresh();
  }

  async gameOver(token) {
    this.current = null;
    const alive = this.alive();
    if (alive.length === 1) {
      const w = alive[0];
      this.lastEvent = `${w.name} é o último de pé e vence a partida!`;
      this.hallOfFame.unshift(`${w.name} — ${this.round} rodada(s)`);
      this.saveHall();
      this.ui.status(`🏆 ${w.name} venceu!`, 'O último jogador de pé leva tudo.');
      this.sfx.win();
      this.dealerAnim.emote('ThumbsUp');
      w.label.draw(w.name, '🏆 campeão');
      const m = w.animal.group;
      tween({ duration: 1.2, ease: Ease.linear, onUpdate: (e) => { m.position.y = Math.abs(Math.sin(e * Math.PI * 3)) * 0.25; } });
    } else {
      this.lastEvent = 'Ninguém sobreviveu. A casa vence!';
      this.hallOfFame.unshift('A CASA — ninguém sobreviveu');
      this.saveHall();
      this.ui.status('Ninguém sobreviveu...', 'A casa sempre vence.');
      this.dealerAnim.emote('Dance', true);
    }
    this.refresh();
    await this.g(this.director.preset('placar', 2.0), token);
    const choice = await this.g(this.ui.choose([
      { id: 'again', label: 'Jogar de novo (mesmos jogadores)', primary: true },
      { id: 'menu', label: 'Menu' },
    ]), token);
    if (choice === 'again') this.start(this.players.map((p) => p.name));
    else this.onMenu?.();
  }

  // ------------------------------------------------------------------ placar
  refresh() {
    const idx = this.current ? this.players.indexOf(this.current) : -1;
    this.ui.renderScore(this.players, this.dealer, this.round, idx);
    this.updateBoards();
  }

  // Desenha o placar no painel 3D do Salão
  updateBoards() {
    const { canvas, texture } = this.world.scoreboard;
    const g = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#16070b');
    bg.addColorStop(1, '#2a0d12');
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    g.textBaseline = 'middle';
    g.textAlign = 'left';

    g.fillStyle = '#ff4f7b';
    g.font = 'bold 64px Georgia';
    g.fillText('PLACAR', 50, 66);
    g.fillStyle = '#e8b04a';
    g.font = '36px Georgia';
    g.fillText(this.round ? `Rodada ${this.round}` : 'Sem partida em andamento', 360, 70);

    const cols = [60, 430, 560, 680, 860, 1040];
    g.font = 'bold 30px Segoe UI, Arial';
    g.fillStyle = '#a99878';
    ['JOGADOR', 'MÃO', 'V', 'D', 'ROLETAS', 'STATUS'].forEach((h, i) => g.fillText(h, cols[i], 140));
    g.fillStyle = '#6b5232';
    g.fillRect(50, 165, W - 100, 3);

    this.players.forEach((p, i) => {
      const y = 210 + i * 62;
      if (this.current === p) {
        g.fillStyle = 'rgba(232,176,74,0.18)';
        g.fillRect(50, y - 28, W - 100, 56);
      }
      g.fillStyle = p.alive ? p.color : '#555';
      g.beginPath(); g.arc(cols[0] + 12, y, 12, 0, Math.PI * 2); g.fill();
      g.font = 'bold 36px Segoe UI, Arial';
      g.fillStyle = p.alive ? '#f3e9d2' : '#777';
      g.fillText(p.name, cols[0] + 36, y, 320);
      g.font = '34px Segoe UI, Arial';
      g.fillText(p.hand.length ? p.handText : '–', cols[1], y);
      g.fillText(String(p.wins), cols[2], y);
      g.fillText(String(p.losses), cols[3], y);
      g.fillText(`${p.survived}/${p.pulls}`, cols[4], y);
      g.fillStyle = p.alive ? '#7ee08a' : '#ff5a5a';
      g.fillText(p.alive ? (p.result || 'vivo') : 'ELIMINADO', cols[5], y, 200);
    });
    if (!this.players.length) {
      g.font = '34px Segoe UI, Arial';
      g.fillStyle = '#a99878';
      g.fillText('Comece uma partida pelo menu.', 60, 230);
    }

    // último evento
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(50, 470, W - 100, 60);
    g.fillStyle = '#ffd27a';
    g.font = 'italic 32px Georgia';
    g.fillText(this.lastEvent, 70, 500, W - 140);

    // hall da fama
    g.fillStyle = '#e8b04a';
    g.font = 'bold 34px Georgia';
    g.fillText('HALL DA FAMA', 60, 575);
    g.font = '28px Segoe UI, Arial';
    g.fillStyle = '#d9c9a5';
    const hall = this.hallOfFame.slice(0, 4);
    if (!hall.length) g.fillText('ainda sem campeões', 60, 620);
    hall.forEach((h, i) => g.fillText(`${i + 1}. ${h}`, 60 + (i % 2) * 590, 620 + Math.floor(i / 2) * 44, 560));
    texture.needsUpdate = true;
  }
}
