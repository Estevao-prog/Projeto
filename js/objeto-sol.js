/* =====================================================================
   O SOL
   Duas peças: a esfera com a textura de plasma e um halo luminoso
   por trás dela.

   Depende de: cena.js, compartilhado.js, texturas.js, dados-astros.js
   ===================================================================== */


/* ---------------------------------------------------------------------
   A ESFERA
   --------------------------------------------------------------------- */

// Guardada numa variável própria porque o loop de animação faz a textura
// deslizar pela superfície (texSol.offset.x), simulando o plasma em movimento.
const texSol = texturaSol();

/**
 * MeshBasicMaterial é a escolha certa aqui: esse material IGNORA as luzes
 * da cena e mostra a textura com brilho total. É o que faz o Sol parecer
 * uma fonte de luz, e não uma bola iluminada por fora.
 * (Os planetas usam MeshStandardMaterial, que reage às luzes.)
 */
const sol = new THREE.Mesh(esferaGeo, new THREE.MeshBasicMaterial({ map: texSol }));

// A esfera compartilhada tem raio 1; aqui ela vira raio 3.
sol.scale.setScalar(3);

/**
 * userData é um espaço livre que o three.js reserva para os nossos dados.
 * Usamos para pendurar no objeto tudo que o resto do código precisa saber:
 *   info     - a ficha mostrada no painel ao clicar
 *   raio     - usado pela colisão da nave e pelo anel de seleção
 *   distFoco - a que distância a câmera para ao focar neste astro
 */
sol.userData = { info: INFO.sol, raio: 3, distFoco: 16 };

scene.add(sol);
clicaveis.push(sol);    // pode ser clicado
obstaculos.push(sol);   // a nave não atravessa
criarRotulo(sol, 'Sol', 4.2);


/* ---------------------------------------------------------------------
   O HALO (brilho ao redor)
   --------------------------------------------------------------------- */

/**
 * Sprite é uma imagem plana que gira sozinha para SEMPRE encarar a câmera.
 * Por isso o halo parece redondo de qualquer ângulo.
 *
 * AdditiveBlending soma a cor do halo à cor do que está atrás, em vez de
 * cobrir — é assim que se faz luz e fogo parecerem luminosos.
 *
 * depthWrite: false evita que o halo "recorte" objetos atrás dele.
 */
const brilhoSol = new THREE.Sprite(new THREE.SpriteMaterial({
  map: texturaBrilho(),
  blending: THREE.AdditiveBlending,
  transparent: true,
  depthWrite: false
}));

// Bem maior que a esfera (17 contra 3), para o brilho transbordar.
brilhoSol.scale.set(17, 17, 1);

scene.add(brilhoSol);
