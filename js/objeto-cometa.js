/* =====================================================================
   O COMETA
   O único corpo com órbita ELÍPTICA (oval) em vez de circular. Ele
   mergulha na direção do Sol, acelera ao passar perto e depois se afasta
   devagar — igualzinho a um cometa de verdade.

   Depende de: cena.js, compartilhado.js, dados-astros.js
   ===================================================================== */


/* ---------------------------------------------------------------------
   1. A FORMA DA ÓRBITA
   --------------------------------------------------------------------- */

/**
 * Uma elipse é descrita por dois números:
 *   a = semieixo maior (o "raio" do lado comprido)
 *   e = excentricidade, de 0 a 1:
 *         0    = círculo perfeito
 *         0.85 = bem alongada, como a órbita de um cometa real
 */
const COMETA = { a: 46, e: 0.85 };

// O semieixo menor sai de uma fórmula fixa da geometria da elipse.
COMETA.b = COMETA.a * Math.sqrt(1 - COMETA.e * COMETA.e);

// Inclinação do plano da órbita. Sem isso o cometa viajaria no mesmo plano
// dos planetas; com isso ele cruza o sistema na diagonal, o que é mais fiel.
const planoCometa = new THREE.Euler(0.5, 0, 0.2);


/**
 * posicaoCometa — calcula onde o cometa está para um dado ângulo da órbita.
 *
 * A elipse é desenhada com a fórmula clássica (cosseno no eixo maior,
 * seno no menor). O "- COMETA.e" desloca a elipse de modo que o SOL fique
 * num dos focos, e não no centro — é por isso que o cometa passa raspando
 * o Sol de um lado e vai longe do outro.
 *
 * @param {number} E - "anomalia excêntrica": o ângulo que percorre a órbita.
 * @param {THREE.Vector3} saida - vetor onde o resultado é escrito
 *        (reaproveitado para não criar objetos a cada quadro).
 * @returns {THREE.Vector3} o mesmo vetor "saida", já preenchido.
 */
function posicaoCometa(E, saida) {
  saida.set(
    COMETA.a * (Math.cos(E) - COMETA.e),   // x
    0,                                      // y (o plano é inclinado depois)
    COMETA.b * Math.sin(E)                  // z
  ).applyEuler(planoCometa);                // inclina o plano inteiro
  return saida;
}


/* ---------------------------------------------------------------------
   2. O CORPO DO COMETA
   --------------------------------------------------------------------- */

// Grupo com duas peças: a cabeça (núcleo de gelo) e a cauda.
const cometa = new THREE.Group();

/**
 * A cabeça é um icosaedro de detalhe 1 — uma bola facetada, irregular,
 * que parece um bloco de gelo e rocha.
 * "emissive" faz o material brilhar um pouco sozinho, como o gelo
 * refletindo e evaporando perto do Sol.
 */
const cometaCabeca = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.35, 1),
  new THREE.MeshStandardMaterial({
    color: 0xcfe6ff,
    emissive: 0x3a6a9a,
    roughness: 0.8,
    flatShading: true
  })
);
cometaCabeca.userData = { info: INFO.cometa, raio: 0.35, distFoco: 6 };

/**
 * A cauda é um CONE OCO (o "true" no fim liga openEnded).
 *
 * Por padrão, o cone nasce centrado na origem. O translate empurra a
 * geometria para que a BASE larga fique no ponto zero (na cabeça) e a
 * ponta aponte para +Y. Fazer isso na geometria, e não no objeto, permite
 * esticar a cauda com scale.y sem que ela saia do lugar.
 */
const cometaCaudaGeo = new THREE.ConeGeometry(0.5, 6, 16, 1, true);
cometaCaudaGeo.translate(0, 3, 0);

const cometaCauda = new THREE.Mesh(cometaCaudaGeo, new THREE.MeshBasicMaterial({
  color: 0x9fd8ff,
  transparent: true,
  opacity: 0.3,                       // bem tênue, é gás rarefeito
  depthWrite: false,
  blending: THREE.AdditiveBlending,   // soma luz, em vez de cobrir o fundo
  side: THREE.DoubleSide              // visível por dentro e por fora
}));

cometa.add(cometaCabeca, cometaCauda);
scene.add(cometa);

clicaveis.push(cometaCabeca);
criarRotulo(cometaCabeca, 'Cometa', 1.2);

// Observação: o cometa NÃO entra em "obstaculos", então a nave atravessa
// a cauda livremente — o que faz sentido, já que ela é só gás.


/* ---------------------------------------------------------------------
   3. A LINHA DO CAMINHO
   --------------------------------------------------------------------- */

/**
 * Desenha a elipse inteira chamando posicaoCometa() em 200 ângulos e
 * ligando os pontos. Note o .clone(): como posicaoCometa reaproveita o
 * mesmo vetor "tmp", sem a cópia os 200 pontos apontariam todos para o
 * mesmo lugar na memória — e a linha sairia errada.
 */
(function () {
  const pontos = [];
  const tmp = new THREE.Vector3();

  for (let i = 0; i < 200; i++) {
    pontos.push(posicaoCometa((i / 200) * Math.PI * 2, tmp).clone());
  }

  scene.add(new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(pontos),
    new THREE.LineBasicMaterial({ color: 0x6a8fb0, transparent: true, opacity: 0.18 })
  ));
})();
