/* =====================================================================
   INTERAÇÃO COM O MOUSE
   Descobrir em qual astro você clicou é um problema clássico do 3D: a
   tela é plana, mas a cena tem profundidade.

   A solução chama-se RAYCASTER: imagine disparar um raio laser da câmera
   passando pelo ponto onde está o cursor. O primeiro objeto atingido é o
   que está "embaixo do mouse".

   Depende de: cena.js, compartilhado.js, camera-foco.js, objeto-marcador.js
   ===================================================================== */


/* ---------------------------------------------------------------------
   1. FERRAMENTAS
   --------------------------------------------------------------------- */

const raycaster = new THREE.Raycaster();

// Posição do mouse em coordenadas normalizadas: -1 a +1 nos dois eixos,
// com o zero no CENTRO da tela. É o formato que o raycaster exige.
const mouse = new THREE.Vector2();

// Onde o botão foi pressionado, para distinguir clique de arrasto.
let clique = { x: 0, y: 0 };


/**
 * atualizarMouse — converte a posição do cursor (pixels) para o formato
 * que o raycaster entende (-1 a +1).
 *
 * getBoundingClientRect() devolve a posição e o tamanho reais do canvas na
 * página; usá-lo (em vez de window.innerWidth) mantém a conta correta caso
 * o canvas um dia não ocupe a tela inteira.
 *
 * O Y é invertido (sinal de menos) porque na tela o zero fica em cima,
 * enquanto no 3D o Y cresce para cima.
 *
 * @param {PointerEvent} e - o evento do mouse.
 */
function atualizarMouse(e) {
  const r = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
}


/**
 * astroSobMouse — dispara o raio e devolve o astro atingido.
 *
 * O laço "while" no fim existe por um motivo prático: ao clicar na asa da
 * nave, o raio acerta a ASA, não a nave inteira. Como a ficha (userData.info)
 * está no grupo pai, subimos pela hierarquia até encontrar quem a tem.
 *
 * @returns {?THREE.Object3D} o astro clicável mais próximo, ou null.
 */
function astroSobMouse() {
  raycaster.setFromCamera(mouse, camera);

  // O "true" manda verificar também os filhos de cada objeto da lista.
  // O three.js já devolve os acertos ordenados do mais perto ao mais longe.
  const acertos = raycaster.intersectObjects(clicaveis, true);
  if (!acertos.length) return null;

  let obj = acertos[0].object;
  while (obj && !obj.userData.info) obj = obj.parent;
  return obj || null;
}


/* ---------------------------------------------------------------------
   2. EVENTOS DO MOUSE
   --------------------------------------------------------------------- */

// Guarda onde o botão desceu.
canvas.addEventListener('pointerdown', e => {
  clique = { x: e.clientX, y: e.clientY };
});

/**
 * Ao soltar o botão: só conta como clique se o mouse quase não se moveu.
 *
 * Sem esse teste, girar a câmera passando por cima de um planeta acabaria
 * selecionando o planeta sem querer. 5 pixels é a tolerância para o
 * tremorzinho natural da mão.
 */
canvas.addEventListener('pointerup', e => {
  if (Math.hypot(e.clientX - clique.x, e.clientY - clique.y) > 5) return;

  atualizarMouse(e);
  const alvo = astroSobMouse();
  if (alvo) definirFoco(alvo);
});

/**
 * Ao mover: troca o cursor para a mãozinha ou para o dedo indicador,
 * avisando visualmente que dá para clicar ali.
 */
canvas.addEventListener('pointermove', e => {
  atualizarMouse(e);
  canvas.style.cursor = astroSobMouse() ? 'pointer' : 'grab';
});


/* ---------------------------------------------------------------------
   3. RESPOSTA VISUAL DA SELEÇÃO
   --------------------------------------------------------------------- */

/**
 * Guarda o último astro que recebeu brilho, para conseguir APAGAR esse
 * brilho quando a seleção mudar. Sem isso, cada planeta clicado ficaria
 * aceso para sempre.
 */
let brilhoAnterior = null;

/**
 * atualizarSelecao — anima o anel e o brilho do astro selecionado.
 * Chamada a cada quadro pelo loop de animação.
 *
 * @param {number} t - tempo real acumulado, que alimenta as animações.
 */
function atualizarSelecao(t) {
  // Limpeza: apaga o brilho do astro que deixou de ser o foco.
  if (brilhoAnterior && brilhoAnterior !== foco) {
    brilhoAnterior.material.emissive.setRGB(0, 0, 0);
  }
  brilhoAnterior = null;

  if (!foco) {
    marcador.visible = false;
    return;
  }

  // --- O anel ---
  marcador.visible = true;
  foco.getWorldPosition(marcador.position);   // gruda no astro

  // Tamanho = 1,7x o raio do astro, pulsando 6% com Math.sin.
  const escala = foco.userData.raio * 1.7 * (1 + 0.06 * Math.sin(t * 4));
  marcador.scale.setScalar(escala);

  // Rotação: gira devagar em Y e balança em X, dando a impressão de um
  // anel em 3D orbitando o astro, e não de um círculo chapado.
  marcador.rotation.set(Math.PI / 2 + 0.4 * Math.sin(t * 1.5), t * 0.6, 0);

  // --- O brilho azulado ---
  // Só materiais Standard têm "emissive". O Sol (Basic) e as linhas não
  // têm, por isso a verificação antes de mexer.
  if (foco.material && foco.material.emissive) {
    // Define um azul discreto e faz sua intensidade pulsar de 0 a 1.
    foco.material.emissive.setRGB(0.05, 0.15, 0.3).multiplyScalar(0.5 + 0.5 * Math.sin(t * 4));
    brilhoAnterior = foco;   // anota para apagar depois
  }
}
