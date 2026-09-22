/* =====================================================================
   LOOP DE ANIMAÇÃO
   O coração do projeto. Esta função roda cerca de 60 vezes por segundo e,
   a cada volta, faz sempre a mesma sequência:

       1. medir quanto tempo passou
       2. mover tudo um pouquinho
       3. desenhar a cena
       4. pedir para ser chamada de novo

   É o último arquivo carregado porque usa praticamente tudo que os
   anteriores criaram.
   ===================================================================== */

// Vetor reaproveitado para a posição do cometa.
const tmpCometa = new THREE.Vector3();

/**
 * animate — um quadro da simulação.
 *
 * Não recebe parâmetros e não devolve nada: ela lê e escreve diretamente
 * nas variáveis globais criadas pelos outros arquivos.
 */
function animate() {
  /**
   * Agenda a próxima chamada. requestAnimationFrame é melhor que setInterval
   * porque sincroniza com a taxa de atualização do monitor e PAUSA sozinho
   * quando a aba fica em segundo plano, poupando bateria.
   */
  requestAnimationFrame(animate);


  /* -------------------------------------------------------------------
     1. TEMPO
     ------------------------------------------------------------------- */

  /**
   * dt = segundos desde o quadro anterior (normalmente ~0.016).
   *
   * O Math.min com 0.05 é uma trava de segurança: se você minimizar a
   * janela por 10 segundos, dt viria gigante e todos os planetas dariam
   * um salto. Limitando, a simulação apenas "perde" esse tempo.
   */
  const dt = Math.min(relogio.getDelta(), 0.05);

  tempoReal += dt;   // nunca para: move a interface e as transições

  // dtSim é o tempo dos astros: zero quando pausado, multiplicado pela escala.
  const dtSim = pausado ? 0 : dt * ESCALAS_TEMPO[idxEscala];
  tempoSim += dtSim;


  /* -------------------------------------------------------------------
     2. O SOL
     ------------------------------------------------------------------- */

  // Pulsa 2,5% para cima e para baixo. Usa tempoReal, então continua
  // "respirando" mesmo com a simulação pausada.
  const pulso = 1 + 0.025 * Math.sin(tempoReal * 1.6);
  sol.scale.setScalar(3 * pulso);

  sol.rotation.y += 0.05 * dtSim;   // giro lento no próprio eixo

  /**
   * A textura escorre pela superfície: em vez de mover o objeto, movemos
   * a IMAGEM sobre ele. O "% 1" faz o valor voltar a zero ao completar uma
   * volta, evitando que o número cresça sem fim durante horas.
   * (Só funciona porque texturaSol() foi criada com RepeatWrapping.)
   */
  texSol.offset.x = (tempoSim * 0.004) % 1;

  // O halo pulsa junto, mas com "+ 1" na fase para não bater exatamente
  // no mesmo ritmo da esfera — fica mais orgânico.
  brilhoSol.scale.setScalar(17 * (1 + 0.05 * Math.sin(tempoReal * 1.6 + 1)));


  /* -------------------------------------------------------------------
     3. PLANETAS, LUA E CINTURÃO
     ------------------------------------------------------------------- */

  /**
   * Aqui está a recompensa pela hierarquia montada em objeto-planetas.js:
   * os oito planetas, com suas órbitas, luas e anéis, são animados em
   * apenas duas linhas.
   *   orbita.rotation.y -> translação (a volta em torno do Sol)
   *   mesh.rotation.y   -> rotação (o dia e a noite)
   */
  planetas.forEach(p => {
    p.orbita.rotation.y += p.velOrbita * dtSim;
    p.mesh.rotation.y += p.velRotacao * dtSim;
  });

  // Nuvens giram um pouco mais rápido que a Terra (1.45 contra 1.2),
  // então parecem passear sobre os continentes.
  nuvens.rotation.y += 1.45 * dtSim;

  luaPivo.rotation.y += 1.6 * dtSim;    // a Lua dá a volta na Terra
  cinturao.rotation.y += 0.05 * dtSim;  // as 600 rochas giram juntas


  /* -------------------------------------------------------------------
     4. O COMETA
     ------------------------------------------------------------------- */

  /**
   * EQUAÇÃO DE KEPLER: M = E - e * sen(E)
   *
   * M ("anomalia média") avança de forma constante com o tempo — é o
   * relógio da órbita. Mas o que precisamos é de E, que dá a posição real
   * na elipse. O problema é que a equação não pode ser resolvida
   * isolando E; é preciso APROXIMAR.
   *
   * O método aqui é o mais simples que existe: chutar E = M e reaplicar a
   * fórmula 6 vezes. A cada volta o valor chega mais perto do correto, e
   * 6 repetições já dão precisão de sobra para uma animação.
   *
   * O resultado físico: o cometa dispara ao passar perto do Sol e se
   * arrasta devagar no ponto mais distante — a 2ª Lei de Kepler acontecendo.
   */
  const M = tempoSim * 0.1;
  let E = M;
  for (let i = 0; i < 6; i++) E = M + COMETA.e * Math.sin(E);

  posicaoCometa(E, tmpCometa);
  cometa.position.copy(tmpCometa);

  /**
   * A CAUDA sempre aponta para longe do Sol (não para trás do movimento!),
   * porque na realidade quem a empurra é o vento solar.
   *
   * setFromUnitVectors calcula a rotação que leva o eixo +Y da cauda até
   * a direção "do Sol para o cometa" — que é exatamente a posição do
   * cometa normalizada, já que o Sol está na origem.
   */
  cometaCauda.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    tmpCometa.clone().normalize()
  );

  /**
   * O comprimento da cauda é inversamente proporcional à distância: perto
   * do Sol (distância pequena) a divisão dá um número grande e a cauda
   * cresce; longe, ela encolhe. O clamp evita exageros nos dois extremos.
   */
  cometaCauda.scale.set(1, THREE.MathUtils.clamp(60 / tmpCometa.length(), 0.3, 4), 1);

  // A cabeça cambaleia. Usa dt (e não dtSim) só por gosto visual.
  cometaCabeca.rotation.y += 0.8 * dt;


  /* -------------------------------------------------------------------
     5. ESTRELAS DO FUNDO
     ------------------------------------------------------------------- */

  // Cintilação: a opacidade oscila suavemente entre 0.6 e 1.0.
  matEstrelas.opacity = 0.8 + 0.2 * Math.sin(tempoReal * 0.7);

  // Giro quase imperceptível, só para o fundo não parecer uma foto colada.
  estrelas.rotation.y = tempoReal * 0.002;


  /* -------------------------------------------------------------------
     6. NAVE, CÂMERA E INTERFACE
     ------------------------------------------------------------------- */

  atualizarNave(dt, tempoReal);      // teclado -> movimento (controle-teclado.js)
  atualizarCamera(dt);               // segue o astro focado (camera-foco.js)
  atualizarSelecao(tempoReal);       // anel e brilho (interacao-mouse.js)

  // Obrigatório porque controls.enableDamping está ligado: é esta chamada
  // que aplica a inércia da câmera. Deve vir DEPOIS de atualizarCamera,
  // para que o alvo já esteja definido.
  controls.update();

  atualizarRotulos();                // nomes flutuantes (interface.js)

  // Textos do rodapé.
  elTempo.textContent = pausado ? 'pausado' : ESCALAS_TEMPO[idxEscala] + 'x';
  elNave.textContent = Math.abs(naveEstado.vel).toFixed(1);


  /* -------------------------------------------------------------------
     7. DESENHAR
     ------------------------------------------------------------------- */

  // Última linha, sempre: manda a placa de vídeo desenhar a cena do ponto
  // de vista da câmera. Tudo que foi calculado acima só aparece agora.
  renderer.render(scene, camera);
}


// Dispara o primeiro quadro. A partir daqui, a função se auto-agenda para
// sempre, graças ao requestAnimationFrame lá no começo.
animate();
