# Sistema Solar

## Integrantes

- Thiago Brito da Silveira
- Estevão Olegário da Silva
- Ana Ruth Muniz Carvalhal de Queiroz Silva
- Wesley Monteiro Ribeiro
- Igor Mazorque da Silva

## Descrição da cena

A cena representa um sistema solar em 3D, criado com a biblioteca Three.js. Ela apresenta o Sol no centro e oito planetas orbitando ao seu redor: Mercúrio, Vênus, Terra, Marte, Júpiter, Saturno, Urano e Netuno. A cena possui iluminação, linhas que representam as órbitas e controles para movimentar a câmera e observar o sistema de diferentes ângulos.

## Geometrias utilizadas

- `SphereGeometry`: utilizada para criar o Sol e os oito planetas.
- `TorusGeometry`: utilizada para criar o anel de Saturno.
- `BufferGeometry` com `LineLoop`: utilizada para desenhar as trajetórias orbitais dos planetas.

## Transformações utilizadas

### Position

- A câmera é posicionada em `(0, 24, 42)` para visualizar o sistema solar.
- Cada planeta recebe uma posição inicial no eixo X, de acordo com a distância da sua órbita em relação ao Sol.
- O anel de Saturno é posicionado no centro do planeta.
- A posição dos planetas é alterada indiretamente pela rotação dos grupos que representam suas órbitas.

### Rotation

- Os planetas giram continuamente em torno do próprio eixo.
- Os grupos orbitais giram no eixo Y, fazendo os planetas orbitarem o Sol.
- A Terra possui inclinação no eixo Z de `0.41` radianos.
- Urano possui inclinação no eixo Z de `1.71` radianos.
- O anel de Saturno possui inclinação no eixo X de `1.2` radianos.

### Scale

- O Sol é ampliado para `3, 3, 3`.
- Júpiter é ampliado para `2, 2, 2`.
- Mercúrio é reduzido para `0.4, 0.4, 0.4`.
