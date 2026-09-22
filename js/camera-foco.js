/* =====================================================================
   FOCO DA CÂMERA
   Guarda em qual astro a câmera está "grudada" e cuida da transição:
   ao trocar de foco, a câmera pula para a distância ideal daquele astro
   (distFoco, definida em cada objeto); depois disso, o OrbitControls
   assume a rotação/zoom manual, e aqui só mantemos o ALVO (target) grudado
   no astro, que pode estar se movendo pela órbita.

   Depende de: cena.js (camera, controls), compartilhado.js, interface.js
   (mostrarInfo, elFoco)
   ===================================================================== */


/** Astro atualmente focado, ou null quando a câmera está livre. */
let foco = null;

// Vetores reaproveitados para não gerar lixo a cada quadro.
const tmpFoco = new THREE.Vector3();
const tmpDirFoco = new THREE.Vector3();

/** Distância usada quando não há astro focado (visão geral). */
const DIST_FOCO_LIVRE = 46;

/**
 * definirFoco — troca o astro focado e ajusta a câmera para ele.
 *
 * Em vez de simplesmente colocar a câmera numa posição fixa, mantemos a
 * DIREÇÃO em que você já estava olhando (dirCamera) e só trocamos a
 * distância para o valor certo daquele astro (distFoco). O resultado é um
 * "zoom" natural, sem virar a cena de repente.
 *
 * @param {?THREE.Object3D} objeto - o astro a focar, ou null para soltar.
 */
function definirFoco(objeto) {
  foco = objeto;

  mostrarInfo(objeto ? objeto.userData.info : null);
  elFoco.textContent = objeto ? objeto.userData.info.nome : 'livre';

  const alvo = objeto ? objeto.getWorldPosition(tmpFoco) : tmpFoco.set(0, 0, 0);
  const distancia = objeto ? objeto.userData.distFoco : DIST_FOCO_LIVRE;

  // Direção atual da câmera em relação ao alvo antigo, preservada no salto.
  tmpDirFoco.subVectors(camera.position, controls.target);
  if (tmpDirFoco.lengthSq() < 0.0001) tmpDirFoco.set(0, 0.4, 1);
  tmpDirFoco.setLength(distancia);

  camera.position.copy(alvo).add(tmpDirFoco);
  controls.target.copy(alvo);
}


/**
 * atualizarCamera — chamada a cada quadro pelo loop de animação.
 *
 * Sem foco, não há nada a fazer (o OrbitControls já cuida de tudo). Com
 * foco, o astro pode ter se movido na órbita desde o último quadro, então
 * arrastamos o alvo (e a câmera junto, pois o OrbitControls sempre orbita
 * em volta do target) suavemente até a nova posição dele.
 *
 * @param {number} dt - segundos desde o quadro anterior.
 */
function atualizarCamera(dt) {
  if (!foco) return;

  foco.getWorldPosition(tmpFoco);

  const suav = Math.min(1, 4 * dt);
  const antes = controls.target.clone();
  controls.target.lerp(tmpFoco, suav);
  camera.position.add(controls.target.clone().sub(antes));
}
