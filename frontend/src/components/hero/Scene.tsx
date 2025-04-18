import React, { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraControls, OrbitControls } from "@react-three/drei";
import DrawLayout from "./DrawLayout";
import CameraView from "./CameraView";
import { useToolStore } from "../../store/store";

const Scene = () => {
  const { is3d } = useToolStore();
  return (
    <div className="canvas" style={{ height: "100vh", background: '#fafafa' }}>
      <Canvas>
        {/* perspective // orthograpic */}
        <CameraView />
        {/* Draw Layout */}
        <DrawLayout />
        {/* Controls */}
        <OrbitControls
          enableRotate={is3d}
          enablePan={true}
          enableZoom={true}
          minZoom={10}
          maxZoom={100}
        />
        {/* Grid */}
        <gridHelper
          args={[
            1000,
            1000,
            "#cccccc",
            "#e0e0e0"
          ]}
          position={[0, -0.01, 0]}  // slightly below objects
        />
      </Canvas>
    </div>
  );
};

export default Scene;


