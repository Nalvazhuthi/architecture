import { useState } from "react";
import RaycasterPlane from "./RaycasterPlane";
import * as THREE from "three";
import { useThree, ThreeEvent } from "@react-three/fiber";
import { snapToGrid } from "../../functions/snapToGrid";
import { getIntersectionPoint } from "../../functions/getIntersectionPoint";
import RenderRectanglePreview from "./RenderRectanglePreview";
import { finalizeRectangle } from "../../functions/finalizeRectangle";
import { useToolStore } from "../../store/store";
import RenderRooms from "./RenderRooms";
import { useAssetControl } from "../../store/assetControls";

const DrawLayout: React.FC = () => {
  // All rooms
  const [rooms, setRooms] = useState([]);
  const { scene, camera, size } = useThree();

  // Rectangle
  const [startPoint, setStartPoint] = useState<THREE.Vector3 | null>(null);
  const [endPoint, setEndPoint] = useState<THREE.Vector3 | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Store
  const { gridSnap } = useToolStore();
  const { is3d } = useToolStore();

  // Handle pointer down (left click to add points)
  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0 || is3d) return; // Only proceed for left click
    setIsDrawing(true); // User starts drawing
    const worldPosition = getIntersectionPoint(event, camera, scene, size);
    const snappedPosition = gridSnap
      ? snapToGrid(worldPosition)
      : worldPosition;
    setStartPoint(snappedPosition);
  };

  // Handle right click to close the shape
  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!startPoint || !endPoint || is3d) return;

    if (event.button === 2) {
      // Reset all states without finalizing the rectangle
      setIsDrawing(false); // Stop drawing
      setStartPoint(null);
      setEndPoint(null); // Clear preview line
      return; // Exit early to avoid finalizing the rectangle
    }

    // Finalize the rectangle and reset states
    finalizeRectangle(startPoint, endPoint, rooms, setRooms);

    // Reset drawing state and points
    setIsDrawing(false); // Stop drawing
    setStartPoint(null);
    setEndPoint(null); // Ensure the preview line disappears
  };

  // Handle pointer move to show preview line
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!isDrawing || !startPoint || is3d) return;

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
          drawingMode="rectangle"
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
