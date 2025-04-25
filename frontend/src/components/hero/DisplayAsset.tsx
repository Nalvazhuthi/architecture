import { useEffect, useRef, useState } from "react";
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

  const [placeHolderPosition, setPlaceHolderPosition] =
    useState<THREE.Vector3 | null>(null);

  // Handle drag-and-drop from UI to canvas
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();

      const point = getIntersectionPoint(
        { clientX: e.clientX, clientY: e.clientY },
        camera,
        scene,
        size
      );
      if (point) {
        const snapped = snapToGrid(point);
        setPlaceHolderPosition(snapped);
      }
    };

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
        const snapped = snapToGrid(worldPosition);
        addAsset(draggedAsset, {
          x: snapped.x,
          y: 0,
          z: snapped.z,
        });
        setDraggedAsset(null);
        setPlaceHolderPosition(null);
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
      {/* PlaceHolder Preview */}
      {draggedAsset && placeHolderPosition && (
        <mesh
          position={[placeHolderPosition.x, 0.01, placeHolderPosition.z]}
          rotation={[-Math.PI / 2, 0, 0]} // Face up
        >
          <circleGeometry args={[0.5, 32]} />
          <meshBasicMaterial color="gray" transparent opacity={0.5} />
        </mesh>
      )}

      {/* Placed Assets */}
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
