/* =====================================================================
   DADOS DOS ASTROS
   Só conteúdo de texto: é o que aparece no painel lateral quando você
   clica em um astro. Nenhum código de desenho aqui.

   Para acrescentar um corpo novo (Plutão, por exemplo), basta adicionar
   uma linha nova neste objeto e usar a mesma chave ao criar o planeta em
   objeto-planetas.js.

   Não depende de nenhum outro arquivo.
   ===================================================================== */

/**
 * INFO — dicionário com a ficha de cada astro.
 *
 * A "chave" (sol, mercurio, venus...) é como o código encontra a ficha:
 * INFO.terra devolve o objeto da Terra. Cada ficha tem sempre os mesmos
 * campos, então o painel consegue montar o HTML sem verificações extras.
 *
 * Campos:
 *   nome        - título exibido em destaque
 *   tipo        - classificação (estrela, planeta rochoso, gigante gasoso...)
 *   diametro    - tamanho real do astro
 *   distancia   - distância média até o Sol (ou até a Terra, no caso da Lua)
 *   periodo     - tempo de uma volta completa na órbita
 *   curiosidade - o fato interessante mostrado no fim do painel
 *
 * Observação: "—" é usado onde o campo não faz sentido (o Sol não orbita
 * nada dentro desta simulação, por exemplo).
 */
const INFO = {
  sol: {
    nome: 'Sol',
    tipo: 'Estrela',
    diametro: '1.392.700 km',
    distancia: '—',
    periodo: '—',
    curiosidade: 'Concentra cerca de 99,86% de toda a massa do Sistema Solar. A superfície tem cerca de 5.500 °C.'
  },

  mercurio: {
    nome: 'Mercúrio',
    tipo: 'Planeta rochoso',
    diametro: '4.879 km',
    distancia: '57,9 milhões de km',
    periodo: '88 dias',
    curiosidade: 'É o menor planeta. A temperatura vai de -180 °C à noite a 430 °C de dia.'
  },

  venus: {
    nome: 'Vênus',
    tipo: 'Planeta rochoso',
    diametro: '12.104 km',
    distancia: '108,2 milhões de km',
    periodo: '225 dias',
    curiosidade: 'É o planeta mais quente (cerca de 465 °C) e gira ao contrário. Um dia lá dura mais que um ano.'
  },

  terra: {
    nome: 'Terra',
    tipo: 'Planeta rochoso',
    diametro: '12.742 km',
    distancia: '149,6 milhões de km',
    periodo: '365,25 dias',
    curiosidade: 'Único mundo conhecido com vida. Cerca de 71% da superfície é coberta por oceanos.'
  },

  lua: {
    nome: 'Lua',
    tipo: 'Satélite natural da Terra',
    diametro: '3.474 km',
    distancia: '384.400 km da Terra',
    periodo: '27,3 dias',
    curiosidade: 'Mostra sempre a mesma face para a Terra e se afasta cerca de 3,8 cm por ano.'
  },

  marte: {
    nome: 'Marte',
    tipo: 'Planeta rochoso',
    diametro: '6.779 km',
    distancia: '227,9 milhões de km',
    periodo: '687 dias',
    curiosidade: 'Abriga o Monte Olimpo, vulcão de cerca de 22 km de altura, o maior do Sistema Solar.'
  },

  jupiter: {
    nome: 'Júpiter',
    tipo: 'Gigante gasoso',
    diametro: '139.820 km',
    distancia: '778,5 milhões de km',
    periodo: '11,9 anos',
    curiosidade: 'A Grande Mancha Vermelha é uma tempestade observada há séculos, maior que a Terra.'
  },

  saturno: {
    nome: 'Saturno',
    tipo: 'Gigante gasoso',
    diametro: '116.460 km',
    distancia: '1,43 bilhão de km',
    periodo: '29,5 anos',
    curiosidade: 'É menos denso que a água. Seus anéis são feitos de gelo e rocha.'
  },

  urano: {
    nome: 'Urano',
    tipo: 'Gigante de gelo',
    diametro: '50.724 km',
    distancia: '2,87 bilhões de km',
    periodo: '84 anos',
    curiosidade: 'O eixo é inclinado cerca de 98°, então o planeta gira "deitado".'
  },

  netuno: {
    nome: 'Netuno',
    tipo: 'Gigante de gelo',
    diametro: '49.244 km',
    distancia: '4,50 bilhões de km',
    periodo: '165 anos',
    curiosidade: 'Tem os ventos mais rápidos do Sistema Solar, de até cerca de 2.000 km/h.'
  },

  cometa: {
    nome: 'Cometa',
    tipo: 'Corpo de gelo (exemplo fictício)',
    diametro: '—',
    distancia: 'órbita elíptica',
    periodo: 'cerca de 63 s nesta simulação',
    curiosidade: 'A cauda aponta sempre para longe do Sol, e o cometa acelera ao passar perto dele.'
  },

  nave: {
    nome: 'Sonda exploradora',
    tipo: 'Nave controlada por você',
    diametro: '—',
    distancia: '—',
    periodo: '—',
    curiosidade: 'Use W, A, S, D, R, F e Shift para explorar. O Sol e os planetas repelem a nave.'
  }
};
