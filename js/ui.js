import { PLAYER_COLORS } from './world.js';
import { ANIMALS } from './characters.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Controla toda a interface HTML sobre o canvas 3D.
export class UI {
  constructor() {
    this.actionsEl = $('actions');
    this.pending = null;
    this.buildNameInputs();
    $('player-count').addEventListener('change', () => this.buildNameInputs());
    $('btn-requisitos').addEventListener('click', () => $('requisitos').classList.toggle('hidden'));
  }

  // ---------------- carregamento ----------------
  setLoading(fraction, text) {
    $('loading-bar').style.width = `${Math.round(fraction * 100)}%`;
    if (text) $('loading-text').textContent = text;
  }

  hideLoading() {
    $('loading').classList.add('hidden');
  }

  // ---------------- configuração ----------------
  buildNameInputs() {
    const n = Number($('player-count').value);
    const box = $('name-inputs');
    const old = [...box.querySelectorAll('input')].map((i) => i.value);
    box.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const row = document.createElement('div');
      row.className = 'name-row';
      row.innerHTML = `<span class="dot" style="background:${PLAYER_COLORS[i]}"></span>
        <span class="animal">${ANIMALS[i].nome}</span>
        <input type="text" maxlength="12" placeholder="${ANIMALS[i].nome}" value="${esc(old[i] ?? '')}">`;
      box.appendChild(row);
    }
  }

  showSetup(onStart, onExplore) {
    $('setup').classList.remove('hidden');
    $('hud').classList.add('hidden');
    $('btn-start').onclick = () => {
      const names = [...$('name-inputs').querySelectorAll('input')].map((inp, i) => inp.value.trim() || ANIMALS[i].nome);
      $('setup').classList.add('hidden');
      $('hud').classList.remove('hidden');
      onStart(names);
    };
    $('btn-explore').onclick = () => {
      $('setup').classList.add('hidden');
      $('hud').classList.remove('hidden');
      onExplore();
    };
  }

  bindMenu(onMenu) {
    $('btn-menu').onclick = onMenu;
  }

  bindGore(onToggle) {
    $('btn-sangue').onclick = () => {
      const on = onToggle();
      $('btn-sangue').textContent = `Sangue: ${on ? 'ligado' : 'desligado'}`;
    };
  }

  bindSound(onToggle) {
    $('btn-som').onclick = () => {
      const on = onToggle();
      $('btn-som').textContent = `Som: ${on ? 'ligado' : 'desligado'}`;
    };
  }

  bindCameraButtons(onCam) {
    document.querySelectorAll('#camera-buttons button').forEach((b) => {
      b.addEventListener('click', () => onCam(b.dataset.cam));
    });
  }

  // ---------------- status ----------------
  status(title, sub = '') {
    $('status-title').textContent = title;
    $('status-sub').textContent = sub;
  }

  // ---------------- botões de ação ----------------
  // Mostra botões e devolve uma Promise com o id do botão clicado.
  choose(options) {
    this.clearActions();
    return new Promise((resolve) => {
      this.pending = resolve;
      for (const opt of options) {
        const b = document.createElement('button');
        b.textContent = opt.label;
        b.className = `big ${opt.primary ? 'primary' : ''}`;
        b.onclick = () => {
          this.clearActions();
          resolve(opt.id);
        };
        this.actionsEl.appendChild(b);
      }
    });
  }

  clearActions() {
    this.actionsEl.innerHTML = '';
    this.pending = null;
  }

  // ---------------- placar ----------------
  renderScore(players, dealer, round, currentIndex) {
    const rows = players.map((p, i) => {
      const cls = [!p.alive ? 'dead' : '', i === currentIndex ? 'turn' : ''].join(' ');
      return `<tr class="${cls}">
        <td><span class="pdot" style="background:${p.color}"></span>${esc(p.name)}</td>
        <td>${p.hand.length ? p.handText : '–'}</td>
        <td>${p.wins}</td>
        <td>${p.losses}</td>
        <td>${p.survived}/${p.pulls}</td>
        <td>${p.alive ? (p.result || 'vivo') : '☠ fora'}</td>
      </tr>`;
    });
    rows.push(`<tr class="dealer"><td>🤖 Crupiê</td><td>${dealer.hand.length ? dealer.handText : '–'}</td><td colspan="4"></td></tr>`);
    $('score-body').innerHTML = rows.join('');
    $('round-info').textContent = round > 0 ? `Rodada ${round} · Roletas: sobreviveu/puxou` : 'Roletas: sobreviveu/puxou';
  }

  // ---------------- requisitos ----------------
  renderRequirements(html) {
    $('requisitos').innerHTML = html;
  }

  flash(color = '#fff', duration = 600) {
    const el = $('flash');
    el.style.background = color;
    el.style.transition = 'none';
    el.style.opacity = '0.95';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = `opacity ${duration}ms ease-out`;
        el.style.opacity = '0';
      });
    });
  }
}
