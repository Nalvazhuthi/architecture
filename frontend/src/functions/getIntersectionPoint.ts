import * as THREE from "three";
import { getWorldPosition } from "./getWorldPosition";

// Get world position from mouse event
export const getIntersectionPoint = (
  event: { clientX: number; clientY: number },
  camera: THREE.Camera,
  scene: THREE.Scene,
  size: any
): THREE.Vector3 | null => {
  const worldPos = getWorldPosition(event, camera, size);
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(
    new THREE.Vector2(
      (event.clientX / size.width) * 2 - 1,
      -(event.clientY / size.height) * 2 + 1
    ),
    camera
  );
  const intersects = raycaster.intersectObjects(scene.children);
  return intersects.length > 0 ? intersects[0].point : null;
};
