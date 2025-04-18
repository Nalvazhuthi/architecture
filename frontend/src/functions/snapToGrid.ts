import * as THREE from "three";
export const snapToGrid = (position: any) => {
  const gridSize = 0.5; // Adjust this value to change the grid size
  return new THREE.Vector3(
    Math.round(position.x / gridSize) * gridSize,
    Math.round(position.y / gridSize) * gridSize,
    Math.round(position.z / gridSize) * gridSize
  );
};



