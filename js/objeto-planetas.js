/* =====================================================================
   OS OITO PLANETAS
   Uma função monta o planeta, e oito chamadas configuram cada um.

   Depende de: cena.js, compartilhado.js, texturas.js, dados-astros.js
   ===================================================================== */


/**
 * criarPlaneta — monta um planeta completo e o cadastra nas listas do projeto.
 *
 * A HIERARQUIA (a parte mais importante deste arquivo):
 *
 *   orbita    -> um objeto vazio no centro do Sol. Girá-lo faz tudo que
 *                está dentro dele dar a volta => é a TRANSLAÇÃO.
 *     ponto   -> afastado do centro pela distância da órbita. É o lugar
 *                onde o planeta realmente fica.
 *       inclinado -> aplica a inclinação do eixo (a Terra é tombada 23°).
 *         mesh    -> a bola em si. Girá-la faz o dia e a noite => ROTAÇÃO.
 *
 * Essa separação em camadas é o que permite girar a órbita SEM girar o
 * planeta junto, e vice-versa. Cada camada tem uma responsabilidade só.
 *
 * @param {object} cfg - configuração do planeta:
 * @param {string} cfg.chave      - chave em INFO (ex.: 'terra').
 * @param {number} cfg.raio       - tamanho na cena.
 * @param {number} cfg.distancia  - distância até o Sol, na cena.
 * @param {number} cfg.velOrbita  - velocidade da translação (rad/s simulado).
 * @param {number} cfg.velRotacao - velocidade do giro no próprio eixo.
 *                                  Negativo = gira ao contrário (Vênus!).
 * @param {number} [cfg.inclinacao] - inclinação do eixo, em radianos.
 * @param {number} cfg.fase       - ponto de partida na órbita, em radianos.
 *                                  Evita que todos comecem alinhados.
 * @param {THREE.Texture} cfg.textura - a pintura da superfície.
 * @returns {{mesh: THREE.Mesh, ponto: THREE.Object3D, inclinado: THREE.Object3D}}
 *          As três camadas são devolvidas porque outros objetos precisam
 *          se pendurar nelas (a Lua no "ponto" da Terra, o anel no
 *          "inclinado" de Saturno).
 */
function criarPlaneta(cfg) {
  // --- Camada 1: a órbita (gira em torno do Sol) ---
  const orbita = new THREE.Object3D();   // objeto vazio: só serve de eixo
  orbita.rotation.y = cfg.fase;
  scene.add(orbita);

  // A linha do caminho é filha da CENA, não da órbita — assim ela fica
  // parada enquanto o planeta se move sobre ela.
  criarLinhaOrbita(cfg.distancia, scene);

  // --- Camada 2: o ponto na distância certa ---
  const ponto = new THREE.Object3D();
  ponto.position.x = cfg.distancia;
  orbita.add(ponto);

  // --- Camada 3: a inclinação do eixo ---
  const inclinado = new THREE.Object3D();
  inclinado.rotation.z = cfg.inclinacao || 0;
  ponto.add(inclinado);

  // --- Camada 4: a bola visível ---
  const mesh = new THREE.Mesh(
    esferaGeo,
    // MeshStandardMaterial reage à luz do Sol: cria o lado dia e o lado noite.
    // roughness 1 = superfície fosca; metalness 0 = não é metal.
    new THREE.MeshStandardMaterial({ map: cfg.textura, roughness: 1, metalness: 0 })
  );
  mesh.scale.setScalar(cfg.raio);
  mesh.userData = {
    info: INFO[cfg.chave],
    raio: cfg.raio,
    distFoco: cfg.raio * 4 + 4   // planetas maiores exigem a câmera mais longe
  };
  inclinado.add(mesh);

  // --- Cadastro nas listas do projeto ---
  planetas.push({ mesh, orbita, velOrbita: cfg.velOrbita, velRotacao: cfg.velRotacao });
  clicaveis.push(mesh);
  obstaculos.push(mesh);
  criarRotulo(mesh, INFO[cfg.chave].nome, cfg.raio * 1.5);

  return { mesh, ponto, inclinado };
}


/* ---------------------------------------------------------------------
   CRIAÇÃO DOS PLANETAS

   Os números NÃO estão em escala real: se estivessem, Netuno ficaria a
   quilômetros do Sol na tela e os planetas seriam pontos invisíveis. As
   proporções foram comprimidas para caber numa visão só, mas a ORDEM e a
   ideia (quanto mais longe, mais devagar) foram mantidas.
   --------------------------------------------------------------------- */

const mercurio = criarPlaneta({
  chave: 'mercurio', raio: 0.45, distancia: 7, velOrbita: 0.60, velRotacao: 0.4,
  inclinacao: 0.0, fase: 0.5,
  // Cinza, cheio de crateras: 140 delas, como a superfície real.
  textura: texturaRochosa(21, [95, 92, 90], [175, 170, 165], 140, false)
});

const venus = criarPlaneta({
  chave: 'venus', raio: 0.8, distancia: 9.5, velOrbita: 0.45,
  // Rotação NEGATIVA: Vênus gira ao contrário de todos os outros planetas.
  velRotacao: -0.15, inclinacao: 0.05, fase: 2.2,
  // Usa textura "gasosa" porque o que vemos de Vênus são as nuvens de ácido.
  textura: texturaGasosa(3, [[200, 160, 90], [235, 205, 140], [250, 235, 190]], 3, 4, null)
});

const terra = criarPlaneta({
  chave: 'terra', raio: 0.9, distancia: 12, velOrbita: 0.36, velRotacao: 1.2,
  inclinacao: 0.41,   // 23,4° em radianos: a inclinação que causa as estações
  fase: 4.0,
  textura: texturaTerra()
});

const marte = criarPlaneta({
  chave: 'marte', raio: 0.6, distancia: 14.5, velOrbita: 0.30, velRotacao: 1.1,
  inclinacao: 0.44, fase: 1.0,
  // Vermelho enferrujado + calotas polares (o "true" no fim).
  textura: texturaRochosa(41, [150, 60, 35], [215, 120, 70], 40, true)
});

const jupiter = criarPlaneta({
  chave: 'jupiter', raio: 2.0, distancia: 19, velOrbita: 0.21,
  velRotacao: 2.2,   // o planeta que gira mais rápido: um dia dura ~10 horas
  inclinacao: 0.05, fase: 5.3,
  textura: texturaGasosa(
    7,
    [[120, 80, 50], [205, 160, 115], [240, 225, 200], [170, 110, 75]],
    9,    // muitas faixas
    1.2,  // bem turbulentas
    { u: 0.7, v: 0.62, r: 14, cor: 'rgba(185,60,40,0.95)' }   // Grande Mancha Vermelha
  )
});

const saturno = criarPlaneta({
  chave: 'saturno', raio: 1.7, distancia: 24.5, velOrbita: 0.15, velRotacao: 2.0,
  inclinacao: 0.47,   // é essa inclinação que faz os anéis aparecerem tortos
  fase: 3.1,
  textura: texturaGasosa(13, [[190, 165, 120], [230, 210, 160], [245, 232, 200]], 7, 0.5, null)
});

const urano = criarPlaneta({
  chave: 'urano', raio: 1.2, distancia: 29.5, velOrbita: 0.105, velRotacao: 1.2,
  inclinacao: 1.71,   // 98°: Urano gira "deitado", rolando pela órbita
  fase: 0.2,
  textura: texturaGasosa(17, [[150, 220, 225], [185, 240, 240], [160, 225, 230]], 4, 0.3, null)
});

const netuno = criarPlaneta({
  chave: 'netuno', raio: 1.15, distancia: 34, velOrbita: 0.075, velRotacao: 1.4,
  inclinacao: 0.49, fase: 2.6,
  textura: texturaGasosa(
    19,
    [[30, 60, 170], [55, 95, 210], [90, 140, 240]],
    6, 1.5,
    { u: 0.3, v: 0.4, r: 10, cor: 'rgba(15,30,110,0.8)' }   // a Grande Mancha Escura
  )
});
