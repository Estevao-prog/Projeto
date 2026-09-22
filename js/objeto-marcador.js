/* =====================================================================
   MARCADOR DE SELEÇÃO
   O anel azul que aparece em volta do astro clicado.

   Existe um único marcador na cena, que é escondido, reposicionado e
   redimensionado conforme a seleção muda (veja interacao-mouse.js).
   Isso é bem mais leve do que criar e destruir um anel a cada clique.

   Depende de: cena.js
   ===================================================================== */

const marcador = new THREE.Mesh(
  /**
   * TorusGeometry é a "rosquinha". Os números são:
   *   1     - raio do anel (será escalado depois conforme o astro)
   *   0.025 - espessura do tubo: bem fininho, só um contorno
   *   8     - divisões da espessura (poucas bastam: o tubo é minúsculo)
   *   64    - divisões em volta: muitas, para o anel parecer liso
   */
  new THREE.TorusGeometry(1, 0.025, 8, 64),

  // Basic = não reage à luz, então o anel tem o mesmo brilho de qualquer
  // ângulo e nunca some no lado escuro de um planeta.
  new THREE.MeshBasicMaterial({ color: 0x6fd3ff, transparent: true, opacity: 0.9 })
);

// Nasce escondido: só aparece quando algo é selecionado.
marcador.visible = false;

scene.add(marcador);
