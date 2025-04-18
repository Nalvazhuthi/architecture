import React from "react";
import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { useToolStore } from "../../store/store";

const CameraView = () => {
  const { is3d } = useToolStore();
  return (
    <>
      {is3d ? (
        <PerspectiveCamera
          makeDefault
          position={[5, 5, 5]}
          fov={75}
          near={0.1}
          far={1000}
        />
      ) : (
        <OrthographicCamera
          makeDefault
          position={[0, 5, 0]}
          zoom={70}
          near={0.1}
          far={1000}
        />
      )}
    </>
  );
};

export default CameraView;
