import * as THREE from "three";

// Utility function with proper types
export const getWorldPosition = (
  event: { clientX: number; clientY: number },
  camera: THREE.Camera,
  size: any
): THREE.Vector3 => {
  const x = (event.clientX / size.width) * 2 - 1;
  const y = -(event.clientY / size.width) * 2 + 1;
  const mouse = new THREE.Vector3(x, 0, y);
  mouse.unproject(camera);

  return new THREE.Vector3(mouse.x, 0, mouse.z);
};
