import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import DrawLayout from "./DrawLayout";
import CameraView from "./CameraView";
import { useToolStore } from "../../store/store";
import DisplayAsset from "./DisplayAsset";

const Scene = () => {
  const { is3d } = useToolStore();

  return (
    <div className="canvas" style={{ height: "100vh", background: "#fafafa" }}>
      <Canvas>
        {/* perspective // orthograpic */}
        <CameraView />
        {/* Draw Layout */}
        <DrawLayout />
        {/* asset drag and drop */}
        <DisplayAsset />
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
