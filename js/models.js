import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

// Modelos externos (.glb) carregados com GLTFLoader.
export const MODEL_FILES = {
  robot: 'models/RobotExpressive.glb',   // crupiê da mesa (animado)
  soldier: 'models/Soldier.glb',         // segurança da entrada (animado)
  chair: 'models/SheenChair.glb',        // poltrona do lounge
  lamp: 'models/LightsPunctualLamp.glb', // luminária de chão do lounge
};

export function loadModels(manager) {
  const loader = new GLTFLoader(manager);
  const entries = Object.entries(MODEL_FILES).map(([key, url]) =>
    loader.loadAsync(url)
      .then((gltf) => [key, gltf])
      .catch((err) => {
        console.error(`Falha ao carregar ${url}`, err);
        return [key, null];
      }),
  );
  return Promise.all(entries).then((list) => Object.fromEntries(list));
}

// Ajusta a escala para uma altura desejada e apoia o modelo no chão (y = 0).
export function fitToHeight(object, height) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const s = height / size.y;
  object.scale.multiplyScalar(s);
  object.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(object);
  object.position.y -= box2.min.y;
  return object;
}

// Envolve o modelo num grupo para podermos posicionar/girar livremente.
export function wrapModel(sceneRoot, height, { clone = false } = {}) {
  const inner = clone ? cloneSkinned(sceneRoot) : sceneRoot;
  inner.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  fitToHeight(inner, height);
  const holder = new THREE.Group();
  holder.add(inner);
  return holder;
}
