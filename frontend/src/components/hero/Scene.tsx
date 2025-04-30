import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import DrawLayout from "./DrawLayout";
import CameraView from "./CameraView";
import { useToolStore } from "../../store/store";
import DisplayAsset from "./DisplayAsset";
import { useState } from "react";
import * as THREE from "three";

type Room = {
  id: string;
  type: "rectangle" | "polygon";
  points: THREE.Vector3[];
  height: number;
  color: string;
  edges?: THREE.Line3[];
  label?: string;
  sharedEdges?: { roomId: string; edgeIndex: number }[];
};

const Scene = () => {
  const { is3d } = useToolStore();
  const [rooms, setRooms] = useState<Room[]>([]);

  return (
    <div className="canvas" style={{ height: "100vh", background: "#fafafa" }}>
      <Canvas>
        {/* perspective // orthograpic */}
        <CameraView />
        {/* Draw Layout */}
        <DrawLayout rooms={rooms} setRooms={setRooms} />
        {/* asset drag and drop */}
        <DisplayAsset rooms={rooms} />
        {/* Controls */}
        <OrbitControls
          enableRotate={is3d}
          enablePan={true}
          enableZoom={true}
          minZoom={10}
          maxZoom={100}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2.1}
        />
        <ambientLight />
        {/* Grid */}
        <gridHelper
          args={[1000, 1000, "#b5b5c8", "#b7b7c6"]}
          position={[0, -0.1, 0]} // slightly below objects
        />
      </Canvas>
    </div>
  );
};

export default Scene;
