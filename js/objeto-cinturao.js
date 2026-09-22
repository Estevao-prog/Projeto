/* =====================================================================
   CINTURÃO DE ASTEROIDES
   600 pedras entre Marte e Júpiter.

   A técnica-chave aqui é o InstancedMesh: ele desenha as 600 rochas com
   UMA única chamada à placa de vídeo. Criar 600 Mesh separados seria 600
   chamadas e derrubaria a taxa de quadros. A regra é: mesma geometria e
   mesmo material, só mudando posição, rotação e tamanho.

   Depende de: cena.js, texturas.js, utilidades.js
   ===================================================================== */

// Um grupo serve de "pasta": girar o grupo gira as 600 rochas de uma vez.
const cinturao = new THREE.Group();
scene.add(cinturao);

(function () {
  const N = 600;
  const rnd = mulberry32(99);   // semente fixa => o cinturão é sempre igual

  const rochas = new THREE.InstancedMesh(
    // Icosaedro de detalhe 0 = uma pedra de 20 faces, bem leve.
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({
      map: texturaRochosa(51, [90, 84, 78], [170, 160, 150], 60, false),
      roughness: 1,
      flatShading: true   // faces chapadas, sem suavizar: dá cara de rocha bruta
    }),
    N   // quantas cópias reservar
  );

  /**
   * O "dummy" é um objeto 3D descartável usado como régua: posicionamos
   * ele onde a rocha deve ficar, pedimos a matriz resultante e copiamos
   * essa matriz para a cópia número i. O mesmo dummy é reaproveitado 600
   * vezes, então nenhum objeto extra é criado na memória.
   */
  const dummy = new THREE.Object3D();

  for (let i = 0; i < N; i++) {
    // --- Posição: em algum ponto do anel entre os raios 15.4 e 16.8 ---
    const ang = rnd() * Math.PI * 2;
    const r = 15.4 + rnd() * 1.4;
    dummy.position.set(
      Math.cos(ang) * r,
      (rnd() - 0.5) * 0.7,   // leve variação de altura: o cinturão tem espessura
      Math.sin(ang) * r
    );

    // --- Rotação: totalmente aleatória (rochas não têm "lado certo") ---
    dummy.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6);

    // --- Tamanho: rnd() * rnd() favorece pedras pequenas, poucas grandes ---
    const s = 0.05 + rnd() * rnd() * 0.16;
    // Escalas diferentes em cada eixo deixam as pedras irregulares, não esféricas.
    dummy.scale.set(s, s * (0.6 + rnd() * 0.6), s * (0.7 + rnd() * 0.6));

    // Converte posição + rotação + escala numa matriz e copia para a cópia i.
    dummy.updateMatrix();
    rochas.setMatrixAt(i, dummy.matrix);
  }

  // Sem isso, o cinturão inteiro desaparece quando seu CENTRO (o Sol) sai
  // da tela, mesmo com rochas ainda visíveis na borda.
  rochas.frustumCulled = false;

  cinturao.add(rochas);
})();
