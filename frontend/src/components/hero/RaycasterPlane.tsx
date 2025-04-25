import React from "react";
import { ThreeEvent } from "@react-three/fiber";

// Update event types to match Three.js events
interface RaycasterPlaneProps {
  handlePointerDown: any;
  handlePointerUp: any;
  handlePointerMove: any;
  
}

const RaycasterPlane: React.FC<RaycasterPlaneProps> = ({
  handlePointerDown,
  handlePointerUp,
  handlePointerMove,
}) => {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      <planeGeometry args={[1000, 1000]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
};

export default RaycasterPlane;
