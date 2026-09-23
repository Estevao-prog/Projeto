Sistema Solar 

Grupo: Estevão Olegário da Silva, Igor Mazorque da Silva, Gabriel da Silva Souza, Matheus Antônio Ferreira Saluto, Thiago Brito da Silveira, Ana Ruth Muniz Carvalhal de Queiroz Silva, Wesley Monteiro Ribeiro.


Resumo:
O projeto consiste em uma experiência 3D interativa do Sistema Solar desenvolvida com Three.js, permitindo visualizar os planetas, suas órbitas e interagir com eles por meio do navegador, além de controlar uma nave espacial. Para isso, são utilizados Scene, PerspectiveCamera, WebGLRenderer, OrbitControls e Mesh, responsáveis pela organização, visualização e interação com a cena.

Os planetas são construídos principalmente com SphereGeometry, enquanto a nave utiliza diferentes geometrias, como cilindros, cones, caixas e esferas. Os objetos são posicionados, rotacionados e redimensionados utilizando position, rotation e scale nos eixos X, Y e Z. Na parte visual, são utilizados materiais como MeshStandardMaterial e MeshBasicMaterial, além de AmbientLight e TextureLoader para iluminação e aplicação de texturas.

A animação é executada continuamente por meio do THREE.Clock, do render loop e de funções como Math.sin(), permitindo criar movimentos periódicos, como a pulsação do Sol. A nave espacial pode ser controlada pelo teclado usando W/S, A/D e R/F, com o Shift podendo aumentar sua velocidade. Por fim, a interação com os planetas é realizada utilizando THREE.Raycaster e THREE.Vector2, que identificam o objeto selecionado pelo mouse e permitem apresentar informações e respostas visuais ao usuário.