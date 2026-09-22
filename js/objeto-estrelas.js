/* =====================================================================
   FUNDO DE ESTRELAS
   2.500 pontinhos espalhados numa esfera gigante em volta de tudo.

   Por que "Points" e não 2.500 esferas? Porque cada esfera seria um
   objeto 3D completo, e a placa de vídeo travaria. Points desenha todos
   os pontos de uma vez só, usando um único objeto.

   Depende de: cena.js, utilidades.js (mulberry32)
   ===================================================================== */

const NUM_ESTRELAS = 2500;

/**
 * Em três.js, a posição e a cor de milhares de pontos são guardadas em
 * arrays "planos": três números seguidos por estrela.
 *   estPos = [x1, y1, z1,  x2, y2, z2,  x3, y3, z3, ...]
 *   estCor = [r1, g1, b1,  r2, g2, b2,  ...]   (aqui de 0 a 1, não 0 a 255)
 *
 * Float32Array é um array de tamanho fixo e tipo fixo — é o formato que a
 * placa de vídeo entende diretamente, sem conversão.
 */
const estrelasGeo = new THREE.BufferGeometry();
const estPos = new Float32Array(NUM_ESTRELAS * 3);
const estCor = new Float32Array(NUM_ESTRELAS * 3);

/**
 * Função anônima executada na hora (IIFE): serve para deixar as variáveis
 * temporárias (rnd, tons, z, ang...) presas aqui dentro, sem poluir o
 * resto do projeto.
 */
(function () {
  const rnd = mulberry32(2024);   // semente fixa => o mesmo céu sempre

  // Três tons reais de estrela: branca, azulada (quente) e alaranjada (fria).
  const tons = [[1, 1, 1], [0.7, 0.8, 1], [1, 0.9, 0.7]];

  for (let i = 0; i < NUM_ESTRELAS; i++) {
    // --- POSIÇÃO ---
    // Truque para espalhar pontos por igual na superfície de uma esfera:
    // sorteia a altura (z, de -1 a 1) e o ângulo da volta, e calcula o
    // raio daquela "fatia" com Pitágoras. Sortear latitude e longitude
    // direto amontoaria estrelas nos polos.
    const z = rnd() * 2 - 1;              // altura relativa, de -1 a 1
    const ang = rnd() * Math.PI * 2;      // ângulo em volta, de 0 a 360°
    const raio = 500 + rnd() * 300;       // distância: entre 500 e 800
    const xy = Math.sqrt(1 - z * z);      // raio da fatia horizontal

    estPos.set([
      Math.cos(ang) * xy * raio,
      z * raio,
      Math.sin(ang) * xy * raio
    ], i * 3);   // o "i * 3" escreve no lugar certo do array plano

    // --- COR ---
    const tom = tons[Math.floor(rnd() * tons.length)];
    const brilho = 0.5 + rnd() * 0.5;   // estrelas mais fracas e mais fortes
    estCor.set([tom[0] * brilho, tom[1] * brilho, tom[2] * brilho], i * 3);
  }
})();

// Entrega os arrays à geometria. O "3" avisa: leia de três em três números.
estrelasGeo.setAttribute('position', new THREE.BufferAttribute(estPos, 3));
estrelasGeo.setAttribute('color', new THREE.BufferAttribute(estCor, 3));

/**
 * Material dos pontos:
 *   size: 1.6            - tamanho na tela, em pixels
 *   sizeAttenuation:false- NÃO diminui com a distância. Estrelas reais são
 *                          tão distantes que aparecem como pontos fixos.
 *   vertexColors: true   - usa a cor individual de cada estrela (estCor)
 *   transparent: true    - permite a cintilação animada mexer na opacidade
 */
const matEstrelas = new THREE.PointsMaterial({
  size: 1.6,
  sizeAttenuation: false,
  vertexColors: true,
  transparent: true
});

const estrelas = new THREE.Points(estrelasGeo, matEstrelas);

// O three.js normalmente esconde objetos cujo centro saiu da tela. Como o
// centro deste "céu" é a origem, ele sumiria ao olharmos para o lado.
// frustumCulled = false desliga essa otimização para este objeto.
estrelas.frustumCulled = false;

scene.add(estrelas);
