/* =====================================================================
   UTILIDADES
   Ferramentas de uso geral, sem nenhuma relação com "planeta" ou "nave".
   São os tijolos usados por texturas.js para desenhar as superfícies.

   Nada aqui depende de outro arquivo do projeto, por isso é o primeiro
   a ser carregado no index.html.
   ===================================================================== */


/**
 * mulberry32 — sorteador de números aleatórios COM SEMENTE.
 *
 * Por que não usar Math.random()? Porque ele muda a cada execução, e o
 * planeta ficaria com uma cara diferente toda vez que a página abrisse.
 * Aqui, a mesma "semente" sempre devolve a mesma sequência de números,
 * então Júpiter é sempre o mesmo Júpiter.
 *
 * @param {number} semente - qualquer número inteiro. Sementes diferentes
 *                           geram resultados diferentes (mas sempre iguais
 *                           entre si para a mesma semente).
 * @returns {function(): number} uma função que, a cada chamada, devolve um
 *                               número de 0 (inclusive) a 1 (exclusive).
 *
 * Exemplo:
 *   const rnd = mulberry32(42);
 *   rnd(); // 0.6011037519201636  (sempre esse valor, em qualquer computador)
 */
function mulberry32(semente) {
  return function () {
    // As operações abaixo são "embaralhamento de bits": elas misturam os
    // dígitos binários do número para que o resultado pareça aleatório.
    // |0 e >>> forçam o JavaScript a tratar os valores como inteiros de 32 bits.
    semente |= 0;
    semente = (semente + 0x6D2B79F5) | 0;                        // avança a semente
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);   // mistura 1
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;               // mistura 2
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;                 // normaliza para 0..1
  };
}


/**
 * criarRuido — gerador de manchas suaves e contínuas (ruído "fbm").
 *
 * Números puramente aleatórios formam um chuvisco de TV, que não parece
 * natural. O ruído aqui é "suave": pontos vizinhos têm valores parecidos,
 * formando manchas — exatamente o que lembra continentes, nuvens e rochas.
 *
 * Um detalhe importante: a textura de um planeta é enrolada em volta de
 * uma esfera, então a borda esquerda encosta na borda direita. Esta função
 * faz as bordas combinarem, evitando aquela "costura" visível ao girar.
 *
 * @param {number} semente - define o desenho das manchas (veja mulberry32).
 * @returns {function(number, number, number, number): number} função fbm(u, v, base, oitavas)
 *          que devolve um valor entre 0 e 1 para cada ponto da imagem, onde:
 *            u, v    = posição na imagem (0 a 1: u = horizontal, v = vertical)
 *            base    = tamanho das manchas (número baixo = manchas grandes)
 *            oitavas = quantas camadas de detalhe somar (mais = mais rugoso)
 */
function criarRuido(semente) {
  const rnd = mulberry32(semente);
  const N = 256;                          // a grade-base tem 256 x 256 valores
  const grade = new Float32Array(N * N);  // array "plano" guardando a grade inteira
  for (let i = 0; i < grade.length; i++) grade[i] = rnd();

  // Curva de suavização (smoothstep): transforma uma transição reta numa
  // transição com início e fim macios, tirando o aspecto de "quadriculado".
  const suave = t => t * t * (3 - 2 * t);

  /**
   * amostra — lê um valor da grade misturando os 4 pontos vizinhos.
   * É isso que transforma pontos soltos num degradê contínuo.
   * O "% periodo" faz a imagem se repetir e emendar sem costura.
   */
  function amostra(x, y, periodo, desloc) {
    const xi = Math.floor(x), yi = Math.floor(y);   // célula inteira onde o ponto caiu
    const fx = suave(x - xi), fy = suave(y - yi);   // o quanto avançou dentro da célula

    // Coluna atual e a próxima, dando a volta no período (emenda a imagem).
    const x0 = (((xi % periodo) + periodo) % periodo) + desloc;
    const x1 = ((((xi + 1) % periodo) + periodo) % periodo) + desloc;

    // Atalho para ler a grade como se ela fosse uma tabela 2D.
    const g = (gx, gy) => grade[((gy & 255) * N) + (gx & 255)];

    // Os 4 cantos que cercam o ponto...
    const a = g(x0, yi), b = g(x1, yi), c = g(x0, yi + 1), d = g(x1, yi + 1);
    // ...misturados proporcionalmente (interpolação bilinear).
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }

  // Soma várias camadas do mesmo ruído: cada camada tem manchas menores e
  // peso menor. É o que cria detalhe grosso + detalhe fino ao mesmo tempo.
  return function fbm(u, v, base, oitavas) {
    let soma = 0, amp = 0.5, total = 0, freq = base;
    for (let k = 0; k < oitavas; k++) {
      soma += amp * amostra(u * freq, v * freq * 0.5, freq, k * 61);
      total += amp;   // guarda a soma dos pesos para normalizar no fim
      amp *= 0.5;     // cada camada pesa metade da anterior
      freq *= 2;      // e tem manchas com metade do tamanho
    }
    return soma / total;   // divide pelos pesos => resultado sempre entre 0 e 1
  };
}


/* ---------------------------------------------------------------------
   Tamanho padrão das texturas.
   512 x 256 é o dobro na horizontal porque a imagem dá a volta no planeta
   (360° na horizontal, 180° na vertical).
   --------------------------------------------------------------------- */
const LARG_TEX = 512, ALT_TEX = 256;


/**
 * novoCanvas — cria um "papel de desenho" invisível na memória.
 * Nada disso aparece na página: serve só para pintar a imagem que depois
 * será colada na superfície de um planeta.
 *
 * @param {number} [l] - largura em pixels.
 * @param {number} [a] - altura em pixels.
 * @returns {HTMLCanvasElement}
 */
function novoCanvas(l = LARG_TEX, a = ALT_TEX) {
  const c = document.createElement('canvas');
  c.width = l;
  c.height = a;
  return c;
}


/**
 * pintarPixels — pinta a imagem PIXEL POR PIXEL.
 *
 * Você passa uma função que decide a cor de um ponto qualquer, e esta
 * função a chama para cada um dos ~131 mil pixels da imagem.
 *
 * @param {function(number, number, number[]): void} funcaoCor
 *        recebe (u, v, cor):
 *          u   = posição horizontal de 0 a 1
 *          v   = posição vertical de 0 a 1
 *          cor = array [vermelho, verde, azul, opacidade], cada um de 0 a 255.
 *                A função deve ESCREVER dentro desse array (não devolver nada).
 *                Reaproveitar o mesmo array evita criar lixo na memória.
 * @param {number} [l] - largura da imagem.
 * @param {number} [a] - altura da imagem.
 * @returns {HTMLCanvasElement} o canvas já pintado.
 */
function pintarPixels(funcaoCor, l = LARG_TEX, a = ALT_TEX) {
  const cv = novoCanvas(l, a);
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(l, a);   // buffer cru: 4 números por pixel (R,G,B,A)
  const cor = [0, 0, 0, 255];

  for (let y = 0; y < a; y++) {
    for (let x = 0; x < l; x++) {
      cor[3] = 255;                    // opacidade volta ao padrão a cada pixel
      funcaoCor(x / l, y / a, cor);    // converte pixel -> 0..1 e pede a cor
      const i = (y * l + x) * 4;       // posição desse pixel dentro do buffer
      img.data[i]     = cor[0];
      img.data[i + 1] = cor[1];
      img.data[i + 2] = cor[2];
      img.data[i + 3] = cor[3];
    }
  }

  ctx.putImageData(img, 0, 0);   // joga o buffer pintado de volta no canvas
  return cv;
}


/**
 * paraTextura — converte um canvas em textura que o three.js entende.
 *
 * @param {HTMLCanvasElement} cv - a imagem já pintada.
 * @param {boolean} [repetir] - se true, a imagem pode "rolar" infinitamente na
 *        horizontal. Usado no Sol, cuja textura desliza para simular o plasma.
 * @returns {THREE.CanvasTexture}
 */
function paraTextura(cv, repetir = false) {
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;   // mantém a textura nítida quando vista de lado
  if (repetir) tex.wrapS = THREE.RepeatWrapping;
  return tex;
}


/**
 * desenharCrateras — carimba círculos escuros com borda clara por cima
 * de uma textura já pintada. É o que dá cara de Lua/Mercúrio.
 *
 * @param {HTMLCanvasElement} cv - textura que receberá as crateras.
 * @param {number} semente - define onde as crateras caem (sempre as mesmas).
 * @param {number} quantidade - quantas crateras desenhar.
 */
function desenharCrateras(cv, semente, quantidade) {
  const ctx = cv.getContext('2d');
  const rnd = mulberry32(semente);

  for (let i = 0; i < quantidade; i++) {
    const x = rnd() * cv.width;
    const y = rnd() * cv.height;
    // rnd() * rnd() puxa o resultado para perto de zero: muitas crateras
    // pequenas e poucas grandes, como acontece de verdade.
    const r = 2 + rnd() * rnd() * 14;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.20)';       // fundo da cratera (sombra)
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; // borda elevada (luz)
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}


/**
 * desenharCalotas — pinta gelo branco no topo e na base da textura.
 * Como a imagem é enrolada na esfera, topo e base viram os polos.
 *
 * @param {HTMLCanvasElement} cv - textura que receberá o gelo.
 * @param {number} alfa - opacidade do branco (0 = nada, 1 = branco sólido).
 */
function desenharCalotas(cv, alfa) {
  const ctx = cv.getContext('2d');

  for (const topo of [true, false]) {   // faz o mesmo duas vezes: polo norte e sul
    // Degradê que vai de branco (no polo) até transparente (22 pixels adiante).
    const g = ctx.createLinearGradient(0, topo ? 0 : cv.height, 0, topo ? 22 : cv.height - 22);
    g.addColorStop(0, `rgba(255,255,255,${alfa})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, topo ? 0 : cv.height - 22, cv.width, 22);
  }
}


/**
 * corDaPaleta — escolhe uma cor dentro de uma lista, misturando as vizinhas.
 *
 * Serve para criar um degradê a partir de poucas cores. Com a paleta
 * [marrom, bege, branco]:  t = 0 -> marrom,  t = 0.5 -> bege,  t = 1 -> branco,
 * e qualquer valor no meio vira uma mistura proporcional.
 *
 * @param {number[][]} paleta - lista de cores, cada uma como [r, g, b] de 0 a 255.
 * @param {number} t - posição no degradê, de 0 a 1.
 * @param {number[]} saida - array onde a cor final é escrita (evita criar lixo).
 */
function corDaPaleta(paleta, t, saida) {
  t = Math.min(0.9999, Math.max(0, t));          // trava t no intervalo válido
  const escala = t * (paleta.length - 1);        // ex.: 3 cores e t=0.5 -> escala 1.0
  const i = Math.floor(escala);                  // cor da esquerda
  const f = escala - i;                          // o quanto já andou rumo à direita
  for (let k = 0; k < 3; k++) {
    saida[k] = paleta[i][k] + (paleta[i + 1][k] - paleta[i][k]) * f;
  }
}


/**
 * suavizar — transição macia entre dois limites (smoothstep).
 *
 * Devolve 0 antes de "a", 1 depois de "b" e, no meio, uma curva suave em S.
 * Usado para bordas que não podem ficar com "degrau", como a linha do gelo
 * polar da Terra ou o contorno das nuvens.
 *
 * @param {number} a - onde a transição começa.
 * @param {number} b - onde a transição termina.
 * @param {number} x - o valor sendo testado.
 * @returns {number} um número entre 0 e 1.
 */
const suavizar = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));  // posição relativa, travada em 0..1
  return t * t * (3 - 2 * t);                             // curva em S
};
