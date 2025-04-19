import { useEffect, useRef } from "react";
import { useAssetControl } from "../../store/assetControls";
import { useThree } from "@react-three/fiber";
import { getIntersectionPoint } from "../../functions/getIntersectionPoint";
import * as THREE from "three";
import { snapToGrid } from "../../functions/snapToGrid";
import { useToolStore } from "../../store/store";

const DisplayAsset = () => {
  const {
    assets,
    addAsset,
    draggedAsset,
    setDraggedAsset,
    selectedAsset,
    setSelectedAsset,
    updateAssetPosition,
  } = useAssetControl();
  const { is3d } = useToolStore();

  const { scene, camera, size, gl } = useThree();
  const isDragging = useRef(false);
  const meshRefs = useRef<Record<number, THREE.Mesh>>({});

  // Handle drag-and-drop from UI to canvas
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => e.preventDefault();

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      if (!draggedAsset || is3d) return;

      const worldPosition = getIntersectionPoint(
        { clientX: e.clientX, clientY: e.clientY },
        camera,
        scene,
        size
      );

      if (worldPosition) {
        addAsset(draggedAsset, {
          x: worldPosition.x,
          y: 0,
          z: worldPosition.z,
        });
        setDraggedAsset(null);
      }
    };

    const canvas = gl.domElement;
    canvas.addEventListener("dragover", handleDragOver);
    canvas.addEventListener("drop", handleDrop);

    return () => {
      canvas.removeEventListener("dragover", handleDragOver);
      canvas.removeEventListener("drop", handleDrop);
    };
  }, [camera, scene, gl, draggedAsset, addAsset, setDraggedAsset, size]);

  // Handle pointer move for direct dragging
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current || selectedAsset == null || is3d) return;

      const point = getIntersectionPoint(
        { clientX: e.clientX, clientY: e.clientY },
        camera,
        scene,
        size
      );

      const snapped = snapToGrid(point);
      if (point) {
        updateAssetPosition(selectedAsset, {
          x: snapped.x,
          y: 0,
          z: snapped.z,
        });
      }
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    const canvas = gl.domElement;
    canvas.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [camera, scene, size, gl, selectedAsset, updateAssetPosition]);

  // Deselect asset when clicking outside any mesh
  useEffect(() => {
    const handleCanvasClick = (e: PointerEvent) => {
      if (!isDragging.current) {
        setSelectedAsset(null);
      }
    };

    const canvas = gl.domElement;
    canvas.addEventListener("pointerdown", handleCanvasClick);

    return () => {
      canvas.removeEventListener("pointerdown", handleCanvasClick);
    };
  }, [gl, setSelectedAsset]);

  return (
    <group>
      {/* Transparent floor plane to catch outer clicks */}
      <mesh
        position={[0, -0.51, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1000, 1000, 1]}
        onPointerDown={(e) => {
          e.stopPropagation();
          setSelectedAsset(null);
        }}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {assets.map((asset) => (
        <mesh
          key={asset.id}
          ref={(el) => {
            if (el) meshRefs.current[asset.id] = el;
          }}
          position={[asset.position?.x || 0, 0.5, asset.position?.z || 0]}
          onPointerDown={(e) => {
            e.stopPropagation();
            isDragging.current = true;
            setSelectedAsset(asset.id);
          }}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            color={selectedAsset === asset.id ? "yellow" : "orange"}
          />
        </mesh>
      ))}
    </group>
  );
};

export default DisplayAsset;
