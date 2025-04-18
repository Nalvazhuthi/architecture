import * as THREE from "three";
import React from "react";

type RectanglePreviewProps = {
  startPoint: THREE.Vector3;
  endPoint: THREE.Vector3;
  drawingMode: string;
};

const RectanglePreview: React.FC<RectanglePreviewProps> = ({
  startPoint,
  endPoint,
  drawingMode,
}) => {
  console.log("drawingMode");
  const positions = new Float32Array([
    startPoint.x,
    0,
    startPoint.z,
    endPoint.x,
    0,
    startPoint.z,
    endPoint.x,
    0,
    endPoint.z,
    startPoint.x,
    0,
    endPoint.z,
    startPoint.x,
    0,
    startPoint.z, // Close the loop
  ]);

  return (
    <line>
      <bufferGeometry
        attach="geometry"
        attributes={{
          position: new THREE.BufferAttribute(positions, 3),
        }}
      />
      <lineBasicMaterial linewidth={2} color="black" />
    </line>
  );
};

export default RectanglePreview;
