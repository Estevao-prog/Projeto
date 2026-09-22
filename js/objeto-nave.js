/* =====================================================================
   A NAVE
   Montada com formas geométricas simples encaixadas (cilindro, cone,
   caixas e uma esfera achatada). Nenhum modelo 3D externo é usado.

   Convenção de direção adotada aqui: o NARIZ da nave aponta para -Z.
   Isso importa porque o movimento em controle-teclado.js empurra a nave
   justamente nessa direção.

   Depende de: cena.js, compartilhado.js, dados-astros.js
   ===================================================================== */

const nave = new THREE.Group();

/**
 * A ordem das rotações muda o resultado final (girar e depois inclinar não
 * é a mesma coisa que inclinar e depois girar). 'YXZ' significa:
 *   Y primeiro (yaw: virar para os lados)
 *   X depois   (pitch: levantar/baixar o nariz)
 *   Z por fim  (roll: rolar nas curvas)
 * É a ordem usada em simuladores de voo, e evita o efeito de travamento
 * em que dois eixos se sobrepõem (gimbal lock).
 */
nave.rotation.order = 'YXZ';


/* ---------------------------------------------------------------------
   MATERIAIS
   Criados uma vez e reaproveitados pelas várias peças.
   --------------------------------------------------------------------- */

// Casco: branco-acinzentado, um pouco metálico e liso.
const matCasco = new THREE.MeshStandardMaterial({ color: 0xdde6f0, metalness: 0.2, roughness: 0.4 });

// Asas e leme: azul.
const matAsa = new THREE.MeshStandardMaterial({ color: 0x3a7bd5, metalness: 0.2, roughness: 0.5 });

// Vidro da cabine: ciano com "emissive" para parecer iluminado por dentro.
const matVidro = new THREE.MeshStandardMaterial({ color: 0x66e0ff, emissive: 0x2288aa, roughness: 0.1 });


/* ---------------------------------------------------------------------
   PEÇAS
   --------------------------------------------------------------------- */

/**
 * Corpo: cilindro mais fino na frente (0.15) do que atrás (0.25).
 * Cilindros nascem "em pé" (ao longo de Y); girar -90° em X os deita
 * apontando para -Z, que é a frente da nave.
 */
const corpoNave = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 1.2, 16), matCasco);
corpoNave.rotation.x = -Math.PI / 2;

// Nariz: cone deitado do mesmo jeito e empurrado para a frente.
const narizNave = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.5, 16), matCasco);
narizNave.rotation.x = -Math.PI / 2;
narizNave.position.z = -0.85;

// Asas: uma caixa larga (1.5) e bem fina (0.04), atravessando o corpo.
const asasNave = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.5), matAsa);
asasNave.position.z = 0.15;

// Leme: caixa vertical na traseira (a "barbatana" de cima).
const leme = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.4), matAsa);
leme.position.set(0, 0.22, 0.45);

// Cabine: a esfera compartilhada achatada em X e Y e esticada em Z => bolha oval.
const cabine = new THREE.Mesh(esferaGeo, matVidro);
cabine.scale.set(0.12, 0.1, 0.25);
cabine.position.set(0, 0.17, -0.2);


/* ---------------------------------------------------------------------
   MOTOR: CHAMA E LUZ
   --------------------------------------------------------------------- */

/**
 * O translate na geometria coloca a BASE da chama na origem do objeto.
 * Isso é essencial: assim, quando o loop aumenta chama.scale.y ao acelerar,
 * a chama cresce para trás a partir do motor, em vez de crescer para os
 * dois lados e atravessar a nave.
 */
const chamaGeo = new THREE.ConeGeometry(0.11, 0.7, 12);
chamaGeo.translate(0, 0.35, 0);

const chama = new THREE.Mesh(chamaGeo, new THREE.MeshBasicMaterial({
  color: 0xff9a3c,     // laranja
  transparent: true,
  opacity: 0.85
}));
chama.rotation.x = Math.PI / 2;   // +90° (e não -90°) para apontar para TRÁS
chama.position.z = 0.6;

/**
 * Luz de verdade saindo do motor: ilumina o que a nave passa perto.
 * Começa com intensidade 0 e o loop a acende conforme a aceleração.
 */
const luzMotor = new THREE.PointLight(0xff8844, 0, 5);
luzMotor.position.z = 1.0;


/* ---------------------------------------------------------------------
   MONTAGEM FINAL
   --------------------------------------------------------------------- */

nave.add(corpoNave, narizNave, asasNave, leme, cabine, chama, luzMotor);
nave.scale.setScalar(1.1);
nave.position.set(8, 1.5, 26);   // começa fora do sistema, olhando para ele

nave.userData = { info: INFO.nave, raio: 0.9, distFoco: 6 };

scene.add(nave);
clicaveis.push(nave);
criarRotulo(nave, 'Nave', 1.2);

// A nave não entra em "obstaculos" — ela não precisa colidir consigo mesma.
