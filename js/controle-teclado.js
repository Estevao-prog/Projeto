/* =====================================================================
   CONTROLE POR TECLADO E MOVIMENTO DA NAVE
   Duas responsabilidades ligadas entre si:
     1. escutar o teclado e guardar o que está pressionado;
     2. usar isso para mover a nave a cada quadro.

   Uma distinção importante:
     - Teclas de AÇÃO (P, L, C, Esc, +, -) agem uma vez, no momento em que
       são apertadas => tratadas dentro do evento keydown.
     - Teclas de MOVIMENTO (W, A, S, D, R, F, Shift) agem continuamente
       enquanto seguram => só marcadas no objeto "teclas" e lidas depois,
       a cada quadro, por atualizarNave().

   Depende de: objeto-nave.js, compartilhado.js, camera-foco.js, interface.js
   ===================================================================== */


/* ---------------------------------------------------------------------
   1. ESCUTANDO O TECLADO
   --------------------------------------------------------------------- */

/**
 * Objeto que funciona como um painel de interruptores:
 *   teclas.KeyW = true  -> a tecla W está pressionada AGORA
 *
 * Usamos e.code (e não e.key) porque ele indica a POSIÇÃO física da tecla.
 * Assim o WASD continua funcionando em teclados AZERTY, e maiúsculas ou
 * minúsculas não fazem diferença.
 */
const teclas = {};

window.addEventListener('keydown', e => {
  teclas[e.code] = true;

  // Segurar uma tecla dispara keydown repetidamente. Para as ações abaixo
  // queremos só o primeiro disparo, senão P piscaria a pausa sem parar.
  if (e.repeat) return;

  switch (e.code) {
    // C: alterna entre focar a nave e soltar a câmera.
    case 'KeyC':
      definirFoco(foco === nave ? null : nave);
      break;

    // Esc: volta à visão geral.
    case 'Escape':
      definirFoco(null);
      break;

    // P: pausa e despausa o tempo da simulação.
    case 'KeyP':
      pausado = !pausado;
      break;

    // L: mostra ou esconde os nomes dos astros.
    case 'KeyL':
      mostrarNomes = !mostrarNomes;
      break;

    // H: mostra ou esconde o painel de ajuda (só mexe numa classe do CSS).
    case 'KeyH':
      document.getElementById('ajuda').classList.toggle('oculto');
      break;

    // + : acelera o tempo, sem passar do último item da lista.
    case 'Equal':
    case 'NumpadAdd':
      idxEscala = Math.min(idxEscala + 1, ESCALAS_TEMPO.length - 1);
      break;

    // - : desacelera o tempo, sem passar do primeiro item.
    case 'Minus':
    case 'NumpadSubtract':
      idxEscala = Math.max(idxEscala - 1, 0);
      break;
  }
});

window.addEventListener('keyup', e => {
  teclas[e.code] = false;
});

/**
 * Se você trocar de aba segurando o W, o navegador nunca envia o keyup e a
 * nave sairia acelerando sozinha para sempre. Ao perder o foco da janela,
 * soltamos todas as teclas por segurança.
 */
window.addEventListener('blur', () => {
  for (const k in teclas) teclas[k] = false;
});


/* ---------------------------------------------------------------------
   2. MOVIMENTO DA NAVE
   --------------------------------------------------------------------- */

/**
 * O estado físico da nave. Separado da posição porque a nave tem INÉRCIA:
 * ela guarda velocidade e continua deslizando depois que você solta a tecla.
 *   vel  - velocidade para frente (negativa = ré)
 *   velY - velocidade vertical (subindo/descendo)
 *   yaw  - para onde o nariz aponta, em radianos
 */
const naveEstado = { vel: 0, velY: 0, yaw: 0 };

// Vetor reaproveitado para a direção "frente".
const frenteNave = new THREE.Vector3();

/**
 * atualizarNave — aplica um quadro de movimento à nave.
 *
 * @param {number} dt - segundos desde o quadro anterior. Todo movimento é
 *        multiplicado por ele, para a nave andar igual em qualquer PC.
 * @param {number} t - tempo real acumulado, usado só para a chama tremular.
 */
function atualizarNave(dt, t) {
  /**
   * Lê as teclas e transforma em números de -1, 0 ou 1.
   * O truque "(tecla ? 1 : 0) - (tecla ? 1 : 0)" resolve o caso de apertar
   * W e S juntos: um cancela o outro e o resultado é 0.
   */
  const acelera = (teclas.KeyW ? 1 : 0) - (teclas.KeyS ? 1 : 0);
  const gira    = (teclas.KeyA ? 1 : 0) - (teclas.KeyD ? 1 : 0);
  const sobe    = (teclas.KeyR ? 1 : 0) - (teclas.KeyF ? 1 : 0);
  const turbo   = (teclas.ShiftLeft || teclas.ShiftRight) ? 2.5 : 1;

  /**
   * FÍSICA COM ATRITO, em dois passos:
   *   1. somar a aceleração das teclas;
   *   2. multiplicar por Math.exp(-atrito * dt), que reduz a velocidade
   *      em uma porcentagem por segundo.
   *
   * O resultado é uma nave que ganha velocidade progressivamente e vai
   * perdendo embalo ao soltar as teclas, em vez de parar no susto.
   * O 1.2 (frente) é menor que o 2 (vertical), então a nave desliza mais
   * para frente do que para cima — proposital, dá sensação de espaço.
   */
  naveEstado.vel  += acelera * 14 * turbo * dt;
  naveEstado.vel  *= Math.exp(-1.2 * dt);
  naveEstado.velY += sobe * 10 * dt;
  naveEstado.velY *= Math.exp(-2 * dt);

  // O giro não tem inércia: a nave para de virar assim que você solta A/D.
  naveEstado.yaw += gira * 1.8 * dt;

  /**
   * Converte o ângulo yaw num vetor apontando para a frente.
   * Os sinais negativos existem porque a nave foi modelada com o nariz
   * para -Z (veja objeto-nave.js). Com yaw = 0, o vetor vira (0, 0, -1).
   */
  frenteNave.set(-Math.sin(naveEstado.yaw), 0, -Math.cos(naveEstado.yaw));

  // Aplica o movimento: anda "vel * dt" unidades na direção do nariz.
  nave.position.addScaledVector(frenteNave, naveEstado.vel * dt);
  nave.position.y += naveEstado.velY * dt;

  /**
   * APARÊNCIA (não afeta para onde a nave vai, só como ela parece voar).
   *
   * suav é o quanto a inclinação se aproxima do alvo neste quadro. A conta
   * "atual += (alvo - atual) * suav" é o jeito clássico de fazer algo
   * perseguir um valor suavemente. Efeito: a nave levanta o nariz ao subir
   * e rola para dentro da curva, como um avião.
   */
  const suav = Math.min(1, 6 * dt);
  nave.rotation.y = naveEstado.yaw;                          // direção: imediata
  nave.rotation.x += (sobe * 0.25 - nave.rotation.x) * suav; // nariz: suave
  nave.rotation.z += (gira * 0.55 - nave.rotation.z) * suav; // rolagem: suave

  /**
   * CHAMA DO MOTOR.
   * empuxo cresce só quando você acelera para frente (Math.max(acelera, 0)
   * ignora a ré) e dispara com o turbo. tremor usa Math.sin com frequência
   * alta (45) para a chama vibrar rapidamente, como fogo de verdade.
   */
  const empuxo = 0.35 + 0.65 * Math.max(acelera, 0) * (turbo > 1 ? 1.6 : 1);
  const tremor = 0.85 + 0.15 * Math.sin(t * 45);
  chama.scale.set(tremor, empuxo * tremor, tremor);
  luzMotor.intensity = empuxo * 0.8 * tremor;   // a luz pulsa junto com a chama

  /**
   * COLISÃO (campo de força).
   * Em vez de simular impacto, usamos a solução mais simples que funciona:
   * se a nave entrou no raio de um astro, ela é empurrada de volta para a
   * borda e perde 40% da velocidade.
   *
   * A linha do empurrão faz três coisas em sequência:
   *   .sub(tmpV)          -> vetor do astro até a nave
   *   .setLength(distMin) -> estica esse vetor até a distância segura
   *   .add(tmpV)          -> volta para coordenadas do mundo
   */
  obstaculos.forEach(obs => {
    obs.getWorldPosition(tmpV);
    const distMin = obs.userData.raio * 1.15 + 0.6;   // raio + folga
    const d = nave.position.distanceTo(tmpV);

    if (d < distMin) {
      nave.position.sub(tmpV).setLength(distMin).add(tmpV);
      naveEstado.vel *= 0.6;
    }
  });

  // Limite do mapa: a 130 unidades do centro, a nave é segurada no lugar,
  // para não se perder no vazio onde nada é visível.
  if (nave.position.length() > 130) nave.position.setLength(130);
}
