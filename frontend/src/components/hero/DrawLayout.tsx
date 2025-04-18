import { useEffect, useState, useRef } from "react";
import RaycasterPlane from "./RaycasterPlane";
import * as THREE from "three";
import { useThree, ThreeEvent } from "@react-three/fiber";
import { snapToGrid } from "../../functions/snapToGrid";
import { getIntersectionPoint } from "../../functions/getIntersectionPoint";
import RenderRectanglePreview from "./RenderRectanglePreview";
import { finalizeRectangle } from "../../functions/finalizeRectangle";
import { useToolStore } from "../../store/store";
import RenderRooms from "./RenderRooms";
interface Wall {
  position: THREE.Vector3;
}

const DrawLayout: React.FC = () => {
  // all rooms
  const [rooms, setRooms] = useState([]);
  const { scene, camera, size } = useThree();
  // rectangle
  const [startPoint, setStartPoint] = useState<THREE.Vector3 | null>(null);
  const [endPoint, setEndPoint] = useState<THREE.Vector3 | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  // store
  const { gridSnap } = useToolStore();

  // Handle pointer down (left click to add points)
  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0) return; // Only proceed for left click
    setIsDrawing(true);
    const worldPosition = getIntersectionPoint(event, camera, scene, size);
    const snappedPosition = gridSnap
      ? snapToGrid(worldPosition)
      : worldPosition;
    setStartPoint(snappedPosition);
  };

  // Handle right click to close the shape
  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!startPoint || !endPoint) return;
    finalizeRectangle(startPoint, endPoint, rooms, setRooms);
    setIsDrawing(true);
    setStartPoint(null);
  };

  // Handle pointer move to show preview line
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    console.log('event',event);
    setIsDrawing(true);
    if (!isDrawing || !startPoint) return;
    const worldPosition = getIntersectionPoint(event, camera, scene, size);
    const snappedPosition = gridSnap
      ? snapToGrid(worldPosition)
      : worldPosition;
    setEndPoint(snappedPosition);
  };

  return (
    <>
      <RenderRooms rooms={rooms} />
      {startPoint && endPoint && (
        <RenderRectanglePreview
          startPoint={startPoint}
          endPoint={endPoint}
          drawingMode="veranda-rectangle"
        />
      )}
      <RaycasterPlane
        handlePointerDown={handlePointerDown}
        handlePointerUp={handlePointerUp}
        handlePointerMove={handlePointerMove}
      />
    </>
  );
};

export default DrawLayout;
