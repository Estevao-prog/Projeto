/* =====================================================================
   ACESSÓRIOS DOS PLANETAS
   Três peças que se penduram em planetas já criados:
     1. as nuvens da Terra
     2. o anel de Saturno
     3. a Lua

   Por isso este arquivo vem DEPOIS de objeto-planetas.js: ele precisa
   das variáveis "terra" e "saturno" já existirem.

   Depende de: objeto-planetas.js, compartilhado.js, texturas.js, dados-astros.js
   ===================================================================== */


/* ---------------------------------------------------------------------
   1. NUVENS DA TERRA
   --------------------------------------------------------------------- */

/**
 * As nuvens são uma SEGUNDA esfera, só um tiquinho maior que o planeta,
 * usando uma textura com partes transparentes. Como ela gira um pouco mais
 * rápido que a superfície, as nuvens parecem passear pelo globo.
 *
 * depthWrite: false evita artefatos gráficos onde a esfera das nuvens e a
 * do planeta quase se encostam.
 */
const nuvens = new THREE.Mesh(
  esferaGeo,
  new THREE.MeshStandardMaterial({
    map: texturaNuvens(),
    transparent: true,
    depthWrite: false,
    roughness: 1
  })
);

// 2,5% maior que a Terra (raio 0.9): o suficiente para flutuar sem atravessar.
nuvens.scale.setScalar(0.9 * 1.025);

// Entra na camada "inclinado" para acompanhar a inclinação do eixo terrestre.
terra.inclinado.add(nuvens);


/* ---------------------------------------------------------------------
   2. ANEL DE SATURNO
   --------------------------------------------------------------------- */

const RAIO_INT = 2.1;   // onde o anel começa (fora da superfície do planeta)
const RAIO_EXT = 3.7;   // onde o anel termina

// RingGeometry cria um "disco com buraco no meio". O 96 são as divisões
// em volta: quanto maior, mais redondo o anel fica.
const anelGeo = new THREE.RingGeometry(RAIO_INT, RAIO_EXT, 96);

/**
 * CORREÇÃO DAS COORDENADAS DE TEXTURA (UV).
 *
 * O problema: o RingGeometry vem com UVs pensadas para um quadrado, então
 * a textura do anel apareceria esticada e torta.
 *
 * A solução: reescrever a UV de cada vértice para que o eixo horizontal da
 * imagem (u) represente a DISTÂNCIA até o centro — 0 na borda interna, 1 na
 * externa. É exatamente como texturaAnel() foi desenhada.
 */
(function () {
  const pos = anelGeo.attributes.position;   // lista de vértices
  const uv = anelGeo.attributes.uv;          // lista de coordenadas de textura
  const v3 = new THREE.Vector3();            // reaproveitado no laço, sem criar lixo

  for (let i = 0; i < pos.count; i++) {
    v3.fromBufferAttribute(pos, i);          // pega a posição do vértice i
    // v3.length() = distância do vértice até o centro.
    // A conta converte essa distância para a faixa 0..1.
    uv.setXY(i, (v3.length() - RAIO_INT) / (RAIO_EXT - RAIO_INT), 0.5);
  }
})();

const anelSaturno = new THREE.Mesh(anelGeo, new THREE.MeshStandardMaterial({
  map: texturaAnel(),
  side: THREE.DoubleSide,   // visível por cima E por baixo (senão some de um ângulo)
  transparent: true,        // respeita as falhas entre os anéis
  roughness: 1,
  depthWrite: false
}));

// O RingGeometry nasce "em pé", como uma placa. Girar 90° o deita no plano
// do equador do planeta, que é onde os anéis realmente ficam.
anelSaturno.rotation.x = Math.PI / 2;

saturno.inclinado.add(anelSaturno);


/* ---------------------------------------------------------------------
   3. A LUA
   --------------------------------------------------------------------- */

/**
 * A Lua repete a mesma ideia da órbita dos planetas, só que em miniatura:
 * um pivô que gira, com a Lua afastada dele.
 *
 * O pivô é filho de terra.ponto (e não de terra.inclinado) porque a órbita
 * da Lua não acompanha a inclinação do eixo da Terra.
 */
const luaPivo = new THREE.Object3D();
terra.ponto.add(luaPivo);

// A linha da órbita é filha do pivô, então viaja junto com a Terra.
criarLinhaOrbita(1.9, luaPivo);

const lua = new THREE.Mesh(
  esferaGeo,
  new THREE.MeshStandardMaterial({
    map: texturaRochosa(31, [110, 110, 112], [200, 200, 200], 90, false),
    roughness: 1
  })
);
lua.scale.setScalar(0.25);
lua.position.x = 1.9;   // afastada do pivô: é isso que cria a órbita

lua.userData = { info: INFO.lua, raio: 0.25, distFoco: 5 };

luaPivo.add(lua);
clicaveis.push(lua);
obstaculos.push(lua);

/**
 * Curiosidade sobre o código: como a Lua é FILHA do pivô, ela gira junto
 * com ele. O efeito colateral é que ela sempre mostra a mesma face para a
 * Terra — exatamente o que acontece na realidade (rotação sincronizada),
 * e de graça, sem nenhuma linha de código extra.
 */
