import React, { useEffect, useRef, useState } from "react";
import { useAssetControl } from "../../store/assetControls";
import { useThree } from "@react-three/fiber";
import { getIntersectionPoint } from "../../functions/getIntersectionPoint";
import * as THREE from "three";
import { snapToGrid } from "../../functions/snapToGrid";
import { useToolStore } from "../../store/store";
import { Text } from "@react-three/drei";

type Room = {
  id: string;
  type: "rectangle" | "polygon";
  points: THREE.Vector3[];
  height: number;
  color: string;
  edges?: THREE.Line3[];
  label?: string;
};

interface DisplayAssetProps {
  rooms: Room[];
}

const DisplayAsset: React.FC<DisplayAssetProps> = ({ rooms }) => {
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

  const { camera, scene, size, gl } = useThree();
  const isDragging = useRef(false);

  const [placeHolderPosition, setPlaceHolderPosition] =
    useState<THREE.Vector3 | null>(null);
  const [distanceLines, setDistanceLines] = useState<
    Array<{ start: THREE.Vector3; end: THREE.Vector3 }>
  >([]);
  const [closestWalls, setClosestWalls] = useState<{
    primary: THREE.Line3;
    secondary?: THREE.Line3;
  } | null>(null);
  const [labels, setLabels] = useState<
    Array<{ position: THREE.Vector3; text: string }>
  >([]);

  // Helper: find closest N walls
  const getClosestWalls = (
    position: THREE.Vector3,
    count = 2
  ): THREE.Line3[] => {
    const allEdges: THREE.Line3[] = [];
    for (const room of rooms) {
      if (room.edges) allEdges.push(...room.edges);
    }

    const sorted = [...allEdges].sort((a) => {
      const point = new THREE.Vector3();
      a.closestPointToPoint(position, true, point);
      return position.distanceTo(point);
    });

    return sorted.slice(0, count);
  };

  // Calculate lines and labels
  const calculateDistanceLabels = (position: THREE.Vector3) => {
    const walls = getClosestWalls(position, 2);
    if (walls.length === 0) return;

    const lines = walls.map((wall) => {
      const closest = new THREE.Vector3();
      wall.closestPointToPoint(position, true, closest);

      return {
        start: position.clone(),
        end: closest.clone(),
      };
    });

    const lineLabels = walls.map((wall, i) => {
      const closest = new THREE.Vector3();
      wall.closestPointToPoint(position, true, closest);

      const dist = position.distanceTo(closest).toFixed(2);

      const midpoint = new THREE.Vector3()
        .addVectors(position, closest)
        .multiplyScalar(0.5);

      return {
        position: midpoint,
        text: `${dist}m`,
      };
    });

    setDistanceLines(lines);
    setLabels(lineLabels);

    setClosestWalls({
      primary: walls[0],
      secondary: walls[1],
    });
  };

  // Drag events
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
        calculateDistanceLabels(snapped);
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
        setDistanceLines([]);
        setLabels([]);
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

  // Pointer move for dragging
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current || selectedAsset == null || is3d) return;

      const point = getIntersectionPoint(
        { clientX: e.clientX, clientY: e.clientY },
        camera,
        scene,
        size
      );

      if (point) {
        const snapped = snapToGrid(point);
        updateAssetPosition(selectedAsset, {
          x: snapped.x,
          y: 0,
          z: snapped.z,
        });
        calculateDistanceLabels(snapped);
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

  // Deselect on click outside
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
      {/* Placeholder */}
      {draggedAsset && placeHolderPosition && (
        <mesh
          position={[
            placeHolderPosition.x,
            0.01,
            placeHolderPosition.z,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.5, 32]} />
          <meshBasicMaterial color="gray" transparent opacity={0.5} />
        </mesh>
      )}

      {/* Distance Lines */}
      {distanceLines.map((line, i) => {
        const points = [
          new THREE.Vector3().copy(line.start),
          new THREE.Vector3().copy(line.end),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <line key={`distance-line-${i}`}>
            <bufferGeometry attach="geometry" attributes={geometry.attributes} />
            <lineBasicMaterial
              attach="material"
              color="red"
              linewidth={2}
            />
          </line>
        );
      })}

      {/* Distance Labels */}
      {labels.map((label, idx) => (
        <Text
          key={`label-${idx}`}
          position={[label.position.x, 0.1, label.position.z]}
          fontSize={0.25}
          color="black"
          anchorX="center"
          anchorY="middle"
        >
          {label.text}
        </Text>
      ))}

      {/* Placed Assets */}
      {assets.map((asset) => (
        <mesh
          key={asset.id}
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