/* =====================================================================
   INTERFACE E ESTADO GERAL
   Cuida de tudo que é 2D: o painel de informações, os nomes flutuantes
   e as variáveis que controlam o tempo da simulação.

   É a ponte entre o mundo 3D e o HTML da página.

   Depende de: cena.js, compartilhado.js
   ===================================================================== */


/* ---------------------------------------------------------------------
   1. ESTADO DA SIMULAÇÃO
   Variáveis "globais" que várias partes do projeto leem e escrevem.
   --------------------------------------------------------------------- */

/** Velocidades de tempo disponíveis com as teclas + e -. */
const ESCALAS_TEMPO = [0.25, 0.5, 1, 2, 4, 8];

/** Qual velocidade está ativa. Começa em 2, que é o valor 1x (normal). */
let idxEscala = 2;

/** Tecla P liga e desliga isto. */
let pausado = false;

/**
 * DOIS RELÓGIOS, e a diferença entre eles é importante:
 *   tempoReal - segundos desde que a página abriu. NUNCA para. É usado
 *               por animações da interface (o pulso do Sol, as transições
 *               da câmera), que devem continuar mesmo com tudo pausado.
 *   tempoSim  - o tempo "dos astros". Congela quando pausado e corre mais
 *               rápido ou devagar conforme a escala. As órbitas usam este.
 */
let tempoReal = 0;
let tempoSim = 0;

/** Tecla L liga e desliga os nomes na tela. */
let mostrarNomes = true;

/**
 * O Clock do three.js mede quanto tempo passou entre um quadro e outro.
 * Isso é o que permite a simulação rodar na mesma velocidade num PC
 * potente e num computador lento (movimento baseado em tempo, não em quadros).
 */
const relogio = new THREE.Clock();


/* ---------------------------------------------------------------------
   2. ELEMENTOS DA PÁGINA
   Buscados uma única vez e guardados. Procurar por id a cada quadro
   (60 vezes por segundo) seria desperdício.
   --------------------------------------------------------------------- */

const elTempo = document.getElementById('st-tempo');   // "1x" no rodapé
const elNave = document.getElementById('st-nave');     // velocidade da nave
const elFoco = document.getElementById('st-foco');     // nome do astro focado
const elInfo = document.getElementById('info');        // painel lateral direito


/* ---------------------------------------------------------------------
   3. PAINEL DE INFORMAÇÕES
   --------------------------------------------------------------------- */

/**
 * mostrarInfo — preenche e exibe o painel lateral, ou o esconde.
 *
 * O painel não é destruído ao fechar: ele só perde a classe "ativo", e o
 * CSS cuida de sumir com ele suavemente (opacity + transform).
 *
 * @param {?object} info - uma ficha vinda de INFO (dados-astros.js),
 *        ou null/undefined para fechar o painel.
 */
function mostrarInfo(info) {
  if (!info) {
    elInfo.classList.remove('ativo');
    return;
  }

  // Monta o HTML de uma vez só. Como todo o conteúdo vem do nosso próprio
  // arquivo de dados (nada digitado pelo usuário), usar innerHTML aqui é seguro.
  elInfo.innerHTML =
    `<h2>${info.nome}</h2>` +
    `<p class="tipo">${info.tipo}</p>` +
    `<dl><dt>Diâmetro</dt><dd>${info.diametro}</dd>` +
    `<dt>Distância</dt><dd>${info.distancia}</dd>` +
    `<dt>Órbita</dt><dd>${info.periodo}</dd></dl>` +
    `<p class="curiosidade">${info.curiosidade}</p>` +
    `<p class="dica">Esc volta à visão geral.</p>`;

  elInfo.classList.add('ativo');
}


/* ---------------------------------------------------------------------
   4. NOMES FLUTUANTES
   --------------------------------------------------------------------- */

// Vetor reaproveitado em todos os cálculos abaixo. Criar um Vector3 novo
// para cada astro, 60 vezes por segundo, geraria lixo e travadinhas.
const tmpV = new THREE.Vector3();

/**
 * atualizarRotulos — coloca cada nome em cima do seu astro na tela.
 *
 * O caminho percorrido por cada nome:
 *   1. descobrir onde o astro está no mundo 3D (getWorldPosition);
 *   2. subir um pouco, para o nome flutuar acima dele;
 *   3. PROJETAR esse ponto 3D na tela (project) — o resultado é um valor
 *      de -1 a +1 em cada eixo, chamado de coordenadas normalizadas;
 *   4. converter de -1..1 para pixels da janela;
 *   5. mover a <div> para lá.
 *
 * Chamada a cada quadro pelo loop de animação.
 */
function atualizarRotulos() {
  const w = window.innerWidth, h = window.innerHeight;

  rotulos.forEach(r => {
    // Tecla L: esconde todos de uma vez.
    if (!mostrarNomes) {
      r.el.style.display = 'none';
      return;
    }

    r.objeto.getWorldPosition(tmpV);   // posição real, já considerando os pais
    tmpV.y += r.alturaExtra;
    tmpV.project(camera);              // 3D -> coordenadas de tela (-1 a 1)

    /**
     * Três testes para saber se o nome deve aparecer:
     *   tmpV.z < 1        - o astro está NA FRENTE da câmera (senão, nomes de
     *                       objetos atrás de você apareceriam espelhados);
     *   |x| e |y| < 1.05  - está dentro da tela (com 5% de folga, para o
     *                       nome não piscar bem na borda).
     */
    const visivel = tmpV.z < 1 && Math.abs(tmpV.x) < 1.05 && Math.abs(tmpV.y) < 1.05;
    r.el.style.display = visivel ? 'block' : 'none';

    if (visivel) {
      // De -1..1 para pixels. O Y é invertido porque, na tela, o zero fica
      // no TOPO, enquanto no 3D o Y cresce para cima.
      const x = (tmpV.x * 0.5 + 0.5) * w;
      const y = (-tmpV.y * 0.5 + 0.5) * h;

      // O segundo translate (-50%, -100%) centraliza o texto na horizontal
      // e o coloca logo ACIMA do ponto calculado.
      // Usar transform (e não left/top) é mais rápido: a placa de vídeo cuida.
      r.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    }
  });
}
