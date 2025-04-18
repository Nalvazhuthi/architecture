import * as THREE from "three";
export const finalizeRectangle = (
  startPoint: THREE.Vector3,
  endPoint: THREE.Vector3,
  rooms: any,
  setRooms: any
) => {
  const rectPoints = [
    new THREE.Vector3(startPoint.x, 0, startPoint.z),
    new THREE.Vector3(endPoint.x, 0, startPoint.z),
    new THREE.Vector3(endPoint.x, 0, endPoint.z),
    new THREE.Vector3(startPoint.x, 0, endPoint.z),
  ];
  
  setRooms((prev: any) => [
    ...prev,
    {
      points: rectPoints,
      name: `Room ${rooms.length + 1}`,
    },
  ]);
};
