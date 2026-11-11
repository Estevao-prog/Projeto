# Última Carta — 21 & Roleta Russa (Three.js)

Ambiente virtual 3D de um **cassino clandestino** feito com Three.js. Dá para explorar o salão com o mouse e jogar uma partida multiplayer local (2 a 4 jogadores no mesmo computador):

- cada jogador é um **bicho** (urso, coelho, gato ou sapo) e joga **21 (blackjack)** contra o **robô crupiê**;
- na sua vez, a câmera vai para os **olhos do personagem**: você vê as cartas nas patas e a mesa à frente (arraste o mouse para olhar em volta);
- quem **passar de 21** ou **perder a mão** para a banca vai para a **roleta russa**: o personagem pega o revólver, gira o tambor (ninguém sabe quantas balas há nele), encosta o cano na cabeça e puxa o gatilho;
- quem tirar a bala é eliminado: faíscas e fumaça saem do revólver, o sangue espirra do outro lado da cabeça e mancha a mesa e o chão, e o personagem tomba com olhos em X. As manchas ficam até o fim da partida. O **último jogador de pé vence**;
- o botão **Sangue: ligado/desligado** tira o sangue (as faíscas continuam), caso precise de uma versão mais leve.

## Como executar

Os módulos ES e o GLTFLoader **não funcionam abrindo o `index.html` direto** (`file://`). É preciso um servidor local:

| Opção | Como |
|---|---|
| Windows (mais fácil) | dê dois cliques em **`iniciar.bat`**. O navegador abre sozinho |
| Node.js | `node server.js --open` (sem dependências; se a porta 8000 estiver ocupada, usa a próxima livre) |
| VS Code | extensão **Live Server**, depois *Open with Live Server* no `index.html` |
| Python | `python -m http.server 8000` e abrir `http://localhost:8000` |

O three.js (v0.160.0) está dentro de `libs/`, então **não precisa de internet**.

## Controles

- **Botão esquerdo + arrastar**: girar a câmera (OrbitControls)
- **Roda do mouse**: zoom
- **Botão direito + arrastar**: mover a câmera (pan)
- **Botões à esquerda**: atalhos de câmera para cada setor
- **Requisitos**: painel que conta elementos, tipos, setores e modelos da cena

## Setores do cenário

| Setor | Função | Principais elementos |
|---|---|---|
| **Entrada** | recepção dos jogadores | porta dupla, letreiro neon, segurança (GLB), recepção/caixa, fila com pedestais e cordas, cabideiro, plantas, quadro de regras |
| **Bar & Lounge** | descanso e bebidas | balcão, estante espelhada, garrafas, copos, chopeira, banquetas, sofá, mesa de centro, poltronas (GLB), luminária de chão (GLB), jukebox, caixotes, barris |
| **Mesa do 21** (espaço principal) | onde o jogo acontece | mesa de feltro, cadeiras, os 4 personagens animais, fichas, baralho, **revólver animado**, garrafa de whisky, copos com gelo, cinzeiro com charuto e cigarros acesos (com fumaça), caixa de charutos, maço de cigarros, robô crupiê (GLB), luminária pendente com cone de luz, pedestais em volta da arena, piano |
| **Salão de Jogos & Placar** | resultados e outros jogos | **painel do placar em tempo real**, troféu (hall da fama), caça-níqueis, mesa de sinuca, alvo de dardos, mesas bistrô |

## Requisitos do trabalho

| Requisito | Como foi atendido |
|---|---|
| ≥ 3 setores | 4 setores, separados por balaustradas, pisos diferentes e placas suspensas |
| ≥ 20 elementos, ≥ 8 tipos | 117 elementos de 42 tipos (o painel **Requisitos** mostra a contagem ao vivo) |
| ≥ 3 modelos .glb/.gltf com GLTFLoader | 4 arquivos: `RobotExpressive.glb`, `Soldier.glb`, `SheenChair.glb`, `LightsPunctualLamp.glb` (escala ajustada automaticamente por `fitToHeight`) |
| ≥ 3 texturas | 4 texturas de cor (madeira, tijolo, piso xadrez, caixote) + mapas de relevo/rugosidade (madeira e tijolo) + texturas geradas em canvas (feltro, cartas, tapetes, placas, rótulos, placar) |
| Scene, PerspectiveCamera, WebGLRenderer, luz, piso | luz hemisférica, spot com sombra sobre a mesa, direcional, luzes pontuais por setor, piso de madeira e paredes de tijolo; pós-processamento com bloom (brilho do neon, lâmpadas e brasas) e névoa leve |
| OrbitControls | rotação, zoom e pan, com limite para a câmera não passar do piso; em primeira pessoa o mesmo OrbitControls vira "olhar em volta" |
| Organização visual | cada setor tem área própria; os objetos foram posicionados sem sobreposição |

O piso principal, as paredes, as vigas e as balaustradas são estruturais e **não entram** na contagem.

## Estrutura do projeto

```
index.html          página + importmap do three.js
css/style.css       interface (HUD, placar, menus)
js/main.js          renderer, câmera, OrbitControls, carregamento e loop
js/world.js         salão, iluminação e montagem dos 4 setores
js/props.js         objetos 3D modelados por código (móveis, revólver, cartas...)
js/tableprops.js    whisky, copos, cinzeiro, charutos, cigarros, fumaça, cone de luz
js/characters.js    personagens animais com braços articulados (IK de dois ossos)
js/models.js        carregamento dos .glb com GLTFLoader
js/textures.js      texturas de arquivo e texturas desenhadas em canvas
js/game.js          regras do 21, roleta russa, placar 3D
js/ui.js            interface HTML
js/audio.js         efeitos sonoros sintetizados (Web Audio)
js/tween.js         animações suaves
js/effects.js       faíscas, fumaça do tiro, jato de sangue e manchas (decals)
libs/three/         three.js 0.160.0 (build + addons usados, incluindo pós-processamento)
models/             modelos .glb
textures/           imagens das texturas
server.js           servidor local sem dependências
iniciar.bat         atalho para Windows
```

## Créditos dos recursos externos

Modelos e texturas vêm do repositório de exemplos do three.js (`mrdoob/three.js`, tag r160):

- `RobotExpressive.glb`: Tomás Laulhé (CC0)
- `Soldier.glb`: modelo/animações do Mixamo, distribuído nos exemplos do three.js
- `SheenChair.glb` e `LightsPunctualLamp.glb`: Khronos glTF Sample Assets (CC BY 4.0)
- Texturas `hardwood2_diffuse/bump/roughness.jpg`, `brick_diffuse/bump.jpg`, `FloorsCheckerboard_S_Diffuse.jpg`, `crate.gif`: exemplos do three.js
- Os personagens animais, o revólver, as cartas e os itens da mesa foram modelados por código neste projeto
- three.js: licença MIT (`libs/three/LICENSE`)
