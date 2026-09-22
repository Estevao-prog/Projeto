/* =====================================================================
   RECURSOS COMPARTILHADOS
   Listas e funções que VÁRIOS objetos da cena usam. Ficam num arquivo
   só para evitar repetição e para haver uma única fonte de verdade
   sobre "o que é clicável", "o que é obstáculo", etc.

   Depende de: cena.js (usa a variável scene indiretamente, via quem chama)
   ===================================================================== */


/* ---------------------------------------------------------------------
   GEOMETRIA COMPARTILHADA
   --------------------------------------------------------------------- */

/**
 * Uma única esfera reaproveitada por TODOS os astros.
 *
 * Por que uma só? Criar uma esfera nova para cada planeta gastaria
 * memória à toa. Como todos têm o mesmo formato, basta criar uma esfera
 * de raio 1 e depois esticar cada cópia com .scale (raio 1 vira raio 3, etc.).
 *
 * Os números 48 e 32 são a quantidade de divisões horizontais e verticais:
 * mais divisões = esfera mais lisa, porém mais pesada.
 */
const esferaGeo = new THREE.SphereGeometry(1, 48, 32);


/* ---------------------------------------------------------------------
   LISTAS DE CONTROLE
   Cada objeto criado se cadastra na lista que lhe interessa. Depois, o
   loop de animação e a interação com o mouse percorrem essas listas.
   --------------------------------------------------------------------- */

/** Objetos que o clique do mouse consegue selecionar. */
const clicaveis = [];

/** Astros sólidos que empurram a nave para fora (colisão). */
const obstaculos = [];

/** Planetas com órbita e rotação, atualizados a cada quadro. */
const planetas = [];

/** Nomes flutuantes mostrados na tela sobre cada astro. */
const rotulos = [];


/* ---------------------------------------------------------------------
   FUNÇÕES AUXILIARES DE CENA
   --------------------------------------------------------------------- */

/** Material único para todas as linhas de órbita (economiza memória). */
const matOrbita = new THREE.LineBasicMaterial({
  color: 0x557080,
  transparent: true,
  opacity: 0.4      // discreto, para não competir com os planetas
});


/**
 * criarLinhaOrbita — desenha o círculo tracejado que marca o caminho de um astro.
 *
 * Como não existe "círculo" em 3D, a linha é feita de 160 pontos calculados
 * com seno e cosseno. Ligados em sequência (LineLoop), eles formam algo que
 * o olho lê como um círculo perfeito.
 *
 * O círculo fica no plano horizontal: x e z variam, y é sempre 0.
 *
 * @param {number} raio - distância do centro até a linha.
 * @param {THREE.Object3D} pai - a quem a linha pertence. Normalmente é a
 *        "scene" (órbita em volta do Sol), mas para a Lua é o pivô da Terra,
 *        assim a órbita dela acompanha o planeta.
 */
function criarLinhaOrbita(raio, pai) {
  const pontos = [];

  for (let i = 0; i < 160; i++) {
    const ang = (i / 160) * Math.PI * 2;   // divide a volta completa em 160 passos
    pontos.push(new THREE.Vector3(
      Math.cos(ang) * raio,   // x
      0,                      // y (sempre no plano)
      Math.sin(ang) * raio    // z
    ));
  }

  // LineLoop liga os pontos em ordem E fecha o último com o primeiro.
  pai.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pontos), matOrbita));
}


/**
 * criarRotulo — cria o nome flutuante que segue um astro pela tela.
 *
 * Detalhe importante: o nome NÃO é um objeto 3D. É uma <div> comum de HTML,
 * posicionada por cima do canvas. A cada quadro, interface.js calcula onde
 * o astro aparece na tela e move a div para lá. Isso deixa o texto sempre
 * nítido e do mesmo tamanho, independente da distância.
 *
 * @param {THREE.Object3D} objeto - o astro que o nome deve seguir.
 * @param {string} nome - o texto exibido.
 * @param {number} alturaExtra - o quanto subir o nome (em unidades da cena)
 *        para ele flutuar ACIMA do astro em vez de ficar em cima dele.
 */
function criarRotulo(objeto, nome, alturaExtra) {
  const el = document.createElement('div');
  el.className = 'rotulo';        // pega o estilo definido em css/estilo.css
  el.textContent = nome;
  document.getElementById('rotulos').appendChild(el);

  // Guarda o trio (elemento HTML + astro + altura) para o loop usar depois.
  rotulos.push({ el, objeto, alturaExtra });
}
