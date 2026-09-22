/* =====================================================================
   CENA, CÂMERA, RENDERIZADOR, CONTROLES E LUZES
   O "palco" onde tudo acontece. Estes quatro elementos são a base de
   qualquer projeto three.js:

     scene    - a caixa que guarda todos os objetos 3D
     camera   - o ponto de vista de quem assiste
     renderer - quem transforma a cena 3D em pixels na tela
     controls - quem deixa o mouse girar e aproximar a câmera

   Também cuida da responsividade (o que fazer quando a janela muda de
   tamanho), porque isso mexe justamente na câmera e no renderizador.

   Depende de: a biblioteca three.js e o OrbitControls.
   ===================================================================== */


/* ---------------------------------------------------------------------
   1. A CENA
   --------------------------------------------------------------------- */

// Tudo que aparece precisa ser adicionado aqui com scene.add(...).
const scene = new THREE.Scene();

// Cor do "vazio" atrás de tudo: azul quase preto, não preto puro,
// para o espaço não parecer um buraco morto.
scene.background = new THREE.Color(0x02030a);


/* ---------------------------------------------------------------------
   2. A CÂMERA
   --------------------------------------------------------------------- */

/**
 * PerspectiveCamera imita o olho humano: o que está longe parece menor.
 * Os quatro números são:
 *   60   - abertura do campo de visão, em graus (quanto "cabe" na tela).
 *          Valores grandes distorcem as bordas, como uma lente olho-de-peixe.
 *   ...  - proporção da tela (largura ÷ altura), para nada ficar esticado.
 *   0.1  - distância mínima visível: mais perto que isso, some.
 *   2000 - distância máxima visível: mais longe que isso, some.
 *          Precisa ser grande porque o fundo de estrelas fica a ~800 de distância.
 */
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);

// Posição de "visão geral", para onde a câmera volta ao apertar Esc.
// (x = 0, y = 26 acima do plano, z = 46 afastado) => olhando o sistema de cima.
const POSICAO_INICIAL_CAMERA = new THREE.Vector3(0, 26, 46);

// O centro do sistema (onde está o Sol). Guardado como constante porque
// a câmera precisa dele para voltar à visão geral.
const ORIGEM = new THREE.Vector3(0, 0, 0);

camera.position.copy(POSICAO_INICIAL_CAMERA);


/* ---------------------------------------------------------------------
   3. O RENDERIZADOR
   --------------------------------------------------------------------- */

// antialias suaviza as bordas "serrilhadas" dos objetos.
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Em telas de alta densidade (celulares, Retina), desenhar na resolução
// real deixa tudo nítido — mas é pesado. O limite de 2 é o meio-termo
// usual entre qualidade e desempenho.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// O renderizador cria uma tag <canvas>; aqui ela entra na página.
document.body.appendChild(renderer.domElement);

// Guardamos o canvas numa variável porque os cliques do mouse são
// escutados nele (veja interacao-mouse.js).
const canvas = renderer.domElement;


/* ---------------------------------------------------------------------
   4. CONTROLES DE ÓRBITA (mouse)
   --------------------------------------------------------------------- */

// Arrastar com o botão esquerdo gira, a rolagem aproxima/afasta.
const controls = new THREE.OrbitControls(camera, canvas);

// Damping = inércia: a câmera continua um pouquinho depois que você solta
// o mouse, em vez de parar seco. Exige chamar controls.update() a cada quadro.
controls.enableDamping = true;
controls.dampingFactor = 0.06;

controls.minDistance = 2;     // permite chegar bem perto da Lua e da nave
controls.maxDistance = 140;   // impede afastar tanto que o sistema suma


/* ---------------------------------------------------------------------
   5. ILUMINAÇÃO
   --------------------------------------------------------------------- */

/**
 * Luz pontual no centro, representando o Sol.
 * Os números são: (cor, intensidade, alcance, decaimento).
 *   0xfff1d6 - branco levemente amarelado, como a luz solar
 *   2.2      - intensidade
 *   170      - a partir dessa distância a luz não chega mais
 *   1        - decaimento linear: perde força conforme se afasta
 *
 * Importante: só materiais do tipo "Standard" reagem à luz. O Sol usa
 * material "Basic", que ignora luz — por isso ele brilha sozinho.
 */
const luzSol = new THREE.PointLight(0xfff1d6, 2.2, 170, 1);
luzSol.position.set(0, 0, 0);
scene.add(luzSol);

/**
 * Luz ambiente: ilumina tudo igualmente, de todos os lados.
 * Sem ela, o lado noturno dos planetas ficaria 100% preto e invisível.
 * A cor azulada escura simula o reflexo tênue do resto do espaço.
 */
scene.add(new THREE.AmbientLight(0x4a5470, 1));


/* ---------------------------------------------------------------------
   6. RESPONSIVIDADE
   --------------------------------------------------------------------- */

/**
 * Quando a janela muda de tamanho, dois ajustes são obrigatórios:
 *   1. a proporção da câmera, senão tudo estica ou achata;
 *   2. o tamanho do renderizador, senão a imagem fica com moldura ou cortada.
 *
 * updateProjectionMatrix() é o "confirmar" da câmera: sem ele, a mudança
 * de aspect não tem efeito nenhum.
 */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
