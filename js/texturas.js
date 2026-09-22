/* =====================================================================
   TEXTURAS DOS ASTROS
   Aqui ficam as "pinturas" que são coladas na superfície de cada astro.

   Nenhuma imagem é baixada da internet: tudo é desenhado por código
   usando as ferramentas de utilidades.js. Isso tem duas vantagens:
     1. o projeto funciona abrindo o arquivo direto no navegador;
     2. não existe pasta de imagens para se perder.

   Quer usar fotos reais da NASA? Troque a chamada da textura por:
       new THREE.TextureLoader().load('imagens/terra.jpg')
   (nesse caso será preciso rodar um servidor local, como o Live Server.)

   Depende de: utilidades.js
   ===================================================================== */


/**
 * texturaSol — superfície granulada do Sol, em laranja e amarelo.
 *
 * Duas camadas de ruído se somam: uma faz as manchas grandes do plasma,
 * a outra adiciona a granulação fina.
 *
 * @returns {THREE.CanvasTexture} textura repetível (desliza na animação).
 */
function texturaSol() {
  const ruido = criarRuido(11);

  const cv = pintarPixels((u, v, c) => {
    const n = ruido(u, v, 6, 5);        // manchas grandes
    const m = ruido(u + 0.3, v, 12, 3); // granulação fina (deslocada para não coincidir)

    // Combina as duas e trava o resultado entre 0 e 1.
    const q = Math.min(1, Math.max(0, n * 1.5 + (m - 0.5) * 0.5 - 0.15));

    // Vermelho sempre no máximo; verde e azul sobem conforme q.
    // Resultado: das partes vermelho-escuras às amarelo-claras.
    c[0] = 255;
    c[1] = 110 + 145 * q;
    c[2] = 10 + 90 * q * q;
  });

  return paraTextura(cv, true);   // "true" permite rolar a textura na animação
}


/**
 * texturaRochosa — planetas e luas de pedra (Mercúrio, Marte, Lua, asteroides).
 *
 * A receita é simples: ruído misturando duas cores + crateras por cima.
 *
 * @param {number} semente - define o desenho das manchas e das crateras.
 * @param {number[]} corA - cor das partes baixas, como [r, g, b] de 0 a 255.
 * @param {number[]} corB - cor das partes altas.
 * @param {number} crateras - quantas crateras desenhar (0 para nenhuma).
 * @param {boolean} calotas - se true, pinta gelo nos polos (caso de Marte).
 * @returns {THREE.CanvasTexture}
 */
function texturaRochosa(semente, corA, corB, crateras, calotas) {
  const ruido = criarRuido(semente);

  const cv = pintarPixels((u, v, c) => {
    const n = ruido(u, v, 8, 5);   // 0 = terreno baixo, 1 = terreno alto
    // Mistura corA e corB na proporção n (interpolação linear).
    for (let i = 0; i < 3; i++) c[i] = corA[i] + (corB[i] - corA[i]) * n;
  });

  if (crateras) desenharCrateras(cv, semente + 1, crateras);
  if (calotas) desenharCalotas(cv, 0.85);

  return paraTextura(cv);
}


/**
 * texturaGasosa — gigantes gasosos (Júpiter, Saturno, Urano, Netuno, Vênus).
 *
 * A ideia central: faixas horizontais feitas com Math.sin, depois
 * entortadas pelo ruído para não ficarem retas e artificiais.
 *
 * @param {number} semente - define o formato das ondulações.
 * @param {number[][]} paleta - cores das faixas, do escuro ao claro.
 * @param {number} faixas - quantas listras aparecem do polo ao polo.
 * @param {number} turbulencia - o quanto as faixas são entortadas (0 = retas).
 * @param {?object} mancha - tempestade opcional (Grande Mancha Vermelha), com:
 *        {u, v} posição de 0 a 1 na textura, {r} raio em pixels, {cor} em CSS.
 * @returns {THREE.CanvasTexture}
 */
function texturaGasosa(semente, paleta, faixas, turbulencia, mancha) {
  const ruido = criarRuido(semente);

  const cv = pintarPixels((u, v, c) => {
    const n = ruido(u, v, 4, 4);

    // Math.sin cria a alternância das listras conforme descemos na imagem (v).
    // O ruído somado dentro do seno é o que "amassa" as listras.
    // O resultado do seno vai de -1 a 1; a conta 0.5 + 0.5 * ... leva para 0 a 1.
    const t = 0.5 + 0.5 * Math.sin(v * Math.PI * faixas + (n - 0.5) * turbulencia * 6);

    corDaPaleta(paleta, t, c);
  });

  // Tempestade oval, desenhada por cima das faixas.
  if (mancha) {
    const ctx = cv.getContext('2d');
    ctx.save();                                                   // guarda o estado do desenho
    ctx.translate(cv.width * mancha.u, cv.height * mancha.v);     // vai até a posição da mancha
    ctx.scale(2.2, 1);                                            // achata o círculo => oval
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, mancha.r);  // forte no centro
    g.addColorStop(0, mancha.cor);
    g.addColorStop(1, 'rgba(0,0,0,0)');                           // some nas bordas
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, mancha.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();                                                // desfaz translate e scale
  }

  return paraTextura(cv);
}


/**
 * texturaTerra — oceanos, continentes e gelo polar.
 *
 * O truque: usar o ruído como se fosse ALTITUDE. Abaixo de um limiar é
 * água (quanto mais fundo, mais escuro); acima é terra (verde perto do
 * nível do mar, marrom nas montanhas). No fim, branco nos polos.
 *
 * @returns {THREE.CanvasTexture}
 */
function texturaTerra() {
  const ruido = criarRuido(5);
  const LIMIAR = 0.54;   // "nível do mar": acima disso é continente

  const cv = pintarPixels((u, v, c) => {
    const n = ruido(u, v, 4, 6);          // altitude do ponto, de 0 a 1
    const lat = Math.abs(v - 0.5) * 2;    // 0 no equador, 1 nos polos

    let r, g, b;
    if (n < LIMIAR) {
      // OCEANO: p vai de 0 (fossa profunda) a 1 (beira da praia).
      const p = n / LIMIAR;
      r = 8 + 22 * p;
      g = 35 + 80 * p;
      b = 100 + 100 * p;
    } else {
      // CONTINENTE: p vai de 0 (planície verde) a 1 (montanha marrom).
      const p = (n - LIMIAR) / (1 - LIMIAR);
      r = 45 + 140 * p;
      g = 125 - 10 * p;
      b = 45 + 30 * p;
    }

    // Gelo polar: aparece perto dos polos, com a borda irregular graças ao ruído.
    const gelo = suavizar(0.84, 0.93, lat + (n - 0.5) * 0.1);
    c[0] = r + (245 - r) * gelo;
    c[1] = g + (250 - g) * gelo;
    c[2] = b + (255 - b) * gelo;
  });

  return paraTextura(cv);
}


/**
 * texturaNuvens — camada branca semitransparente que cobre a Terra.
 *
 * Aqui o que varia não é a cor (sempre branca), e sim a OPACIDADE:
 * onde o ruído é alto existe nuvem; onde é baixo, o planeta aparece.
 *
 * @returns {THREE.CanvasTexture} textura com transparência (canal alfa).
 */
function texturaNuvens() {
  const ruido = criarRuido(77);

  const cv = pintarPixels((u, v, c) => {
    const n = ruido(u, v, 5, 5);
    c[0] = c[1] = c[2] = 255;                            // sempre branco
    c[3] = 255 * suavizar(0.52, 0.78, n) * 0.9;          // opacidade com borda macia
  });

  return paraTextura(cv);
}


/**
 * texturaAnel — anéis de Saturno.
 *
 * Esta textura é diferente das outras: ela tem só 4 pixels de altura,
 * porque o eixo horizontal (u) representa a DISTÂNCIA a partir do centro
 * do planeta, e não uma volta em torno dele. Ou seja, é uma "fatia" do
 * anel que depois é girada em círculo pela geometria.
 *
 * @returns {THREE.CanvasTexture}
 */
function texturaAnel() {
  const ruido = criarRuido(9);

  const cv = pintarPixels((u, v, c) => {
    // Math.sin(u * 70) cria dezenas de aneizinhos finos; o ruído varia a espessura.
    const faixa = 0.55 + 0.45 * Math.sin(u * 70 + ruido(u, 0, 10, 3) * 8);

    // Divisão de Cassini: a falha larga e escura entre os anéis A e B.
    // A conta liga em u=0.60 e desliga em u=0.69, formando uma faixa vazia.
    const divisao = suavizar(0.60, 0.62, u) * (1 - suavizar(0.67, 0.69, u));

    c[0] = 200 + 40 * faixa;   // tons de gelo sujo, entre bege e branco
    c[1] = 180 + 40 * faixa;
    c[2] = 140 + 40 * faixa;

    // Opacidade final = brilho da faixa, menos a divisão de Cassini,
    // e ainda desbotando bem na borda interna (suavizar(0, 0.08, u)).
    c[3] = 255 * (0.25 + 0.65 * faixa) * (1 - 0.92 * divisao) * (0.35 + 0.65 * suavizar(0, 0.08, u));
  }, 512, 4);   // <- 512 de largura por apenas 4 de altura

  return paraTextura(cv);
}


/**
 * texturaBrilho — halo redondo e luminoso colado ao redor do Sol.
 *
 * Não usa ruído: é só um degradê do centro (amarelo forte) para a borda
 * (transparente). Aplicado num Sprite, que é sempre virado para a câmera.
 *
 * @returns {THREE.CanvasTexture}
 */
function texturaBrilho() {
  const cv = novoCanvas(128, 128);
  const ctx = cv.getContext('2d');

  // Degradê circular partindo do centro (64, 64) com raio 64.
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,235,160,1)');       // miolo quase branco
  g.addColorStop(0.25, 'rgba(255,180,60,0.55)');  // laranja médio
  g.addColorStop(1, 'rgba(255,120,0,0)');         // some por completo na borda

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);

  return new THREE.CanvasTexture(cv);
}
