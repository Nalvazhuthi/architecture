import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree, ThreeEvent } from "@react-three/fiber";
import { Line, Text } from "@react-three/drei";
import { snapToGrid } from "../../functions/snapToGrid";
import { getIntersectionPoint } from "../../functions/getIntersectionPoint";
import { useToolStore } from "../../store/store";
import RaycasterPlane from "./RaycasterPlane";

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

type Action =
  | { type: "ADD_POINT"; roomId: string; point: THREE.Vector3; index: number }
  | {
      type: "MOVE_POINT";
      roomId: string;
      index: number;
      newPosition: THREE.Vector3;
      oldPosition: THREE.Vector3;
    }
  | {
      type: "DELETE_POINT";
      roomId: string;
      index: number;
      point: THREE.Vector3;
    }
  | { type: "CREATE_ROOM"; room: Room }
  | {
      type: "MERGE_LINES";
      roomId: string;
      edgeIndex: number;
      newPoints: THREE.Vector3[];
    }
  | {
      type: "SHARE_EDGE";
      roomId1: string;
      roomId2: string;
      edgeIndex1: number;
      edgeIndex2: number;
    }
  | {
      type: "SPLIT_SHARED_EDGE";
      roomIds: string[];
      edgeIndices: number[];
      splitPoint: THREE.Vector3;
    }
  | { type: "UNDO"; originalAction: Action };

interface DrawLayoutProps {
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
}

const DrawLayout: React.FC<DrawLayoutProps> = ({ rooms, setRooms }) => {
  const { scene, camera, size } = useThree();

  // Drawing states
  const [points, setPoints] = useState<THREE.Vector3[]>([]);
  const [currentPosition, setCurrentPosition] = useState<THREE.Vector3 | null>(
    null
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoverPoint, setHoverPoint] = useState<THREE.Vector3 | null>(null);
  const [showClosingHint, setShowClosingHint] = useState(false);
  const [roomCounter, setRoomCounter] = useState(1);

  // Selection states
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
    null
  );
  const [hoverEdge, setHoverEdge] = useState<{
    roomId: string;
    edgeIndex: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Undo/Redo states
  const [history, setHistory] = useState<Action[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);

  const lastClickTime = useRef(0);

  // Store
  const { gridSnap, activeTool, is3d } = useToolStore();

  // Save action to history
  const saveAction = (action: Action) => {
    setHistory((prev) => [...prev.slice(0, currentStep + 1), action]);
    setCurrentStep((prev) => prev + 1);
  };

  // Check if two edges are the same (within tolerance)
  const areEdgesEqual = (
    edge1: THREE.Line3,
    edge2: THREE.Line3,
    tolerance = 0.01
  ) => {
    return (
      (edge1.start.distanceTo(edge2.start) < tolerance &&
        edge1.end.distanceTo(edge2.end) < tolerance) ||
      (edge1.start.distanceTo(edge2.end) < tolerance &&
        edge1.end.distanceTo(edge2.start) < tolerance)
    );
  };

  // Find shared edges between rooms
  const findSharedEdges = (room1: Room, room2: Room) => {
    const sharedEdges: { edgeIndex1: number; edgeIndex2: number }[] = [];

    room1.edges?.forEach((edge1, edgeIndex1) => {
      room2.edges?.forEach((edge2, edgeIndex2) => {
        if (areEdgesEqual(edge1, edge2)) {
          sharedEdges.push({ edgeIndex1, edgeIndex2 });
        }
      });
    });

    return sharedEdges;
  };

  // Update shared edges when rooms change
  const updateSharedEdges = (updatedRooms: Room[]) => {
    return updatedRooms.map((room) => {
      const sharedEdges: { roomId: string; edgeIndex: number }[] = [];

      updatedRooms.forEach((otherRoom) => {
        if (otherRoom.id !== room.id) {
          const edges = findSharedEdges(room, otherRoom);
          edges.forEach(({ edgeIndex1 }) => {
            sharedEdges.push({ roomId: otherRoom.id, edgeIndex: edgeIndex1 });
          });
        }
      });

      return { ...room, sharedEdges };
    });
  };

  // Create edges for collision detection
  const createEdgesFromPoints = (points: THREE.Vector3[]) => {
    const edges: THREE.Line3[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      edges.push(new THREE.Line3(points[i], points[i + 1]));
    }
    return edges;
  };

  // Apply action with shared edge handling
  const applyAction = (action: Action, rooms: Room[]): Room[] => {
    let updatedRooms = [...rooms];

    switch (action.type) {
      case "ADD_POINT":
        updatedRooms = rooms.map((room) =>
          room.id === action.roomId
            ? {
                ...room,
                points: [
                  ...room.points.slice(0, action.index),
                  action.point,
                  ...room.points.slice(action.index),
                ],
                edges: createEdgesFromPoints([
                  ...room.points.slice(0, action.index),
                  action.point,
                  ...room.points.slice(action.index),
                ]),
              }
            : room
        );
        break;
      case "MOVE_POINT":
        updatedRooms = rooms.map((room) =>
          room.id === action.roomId
            ? {
                ...room,
                points: room.points.map((point, idx) =>
                  idx === action.index ? action.newPosition : point
                ),
                edges: createEdgesFromPoints(
                  room.points.map((point, idx) =>
                    idx === action.index ? action.newPosition : point
                  )
                ),
              }
            : room
        );
        break;
      case "DELETE_POINT":
        updatedRooms = rooms.map((room) =>
          room.id === action.roomId
            ? {
                ...room,
                points: room.points.filter((_, idx) => idx !== action.index),
                edges: createEdgesFromPoints(
                  room.points.filter((_, idx) => idx !== action.index)
                ),
              }
            : room
        );
        break;
      case "CREATE_ROOM":
        updatedRooms = [...rooms, action.room];
        break;
      case "MERGE_LINES":
        updatedRooms = rooms.map((room) =>
          room.id === action.roomId
            ? {
                ...room,
                points: action.newPoints,
                edges: createEdgesFromPoints(action.newPoints),
              }
            : room
        );
        break;
      case "SHARE_EDGE":
        updatedRooms = rooms.map((room) => {
          if (room.id === action.roomId1) {
            const sharedEdges = [
              ...(room.sharedEdges || []),
              { roomId: action.roomId2, edgeIndex: action.edgeIndex1 },
            ];
            return { ...room, sharedEdges };
          }
          if (room.id === action.roomId2) {
            const sharedEdges = [
              ...(room.sharedEdges || []),
              { roomId: action.roomId1, edgeIndex: action.edgeIndex2 },
            ];
            return { ...room, sharedEdges };
          }
          return room;
        });
        break;
      case "SPLIT_SHARED_EDGE":
        updatedRooms = rooms.map((room) => {
          if (action.roomIds.includes(room.id)) {
            const edgeIndex =
              action.edgeIndices[action.roomIds.indexOf(room.id)];
            const newPoints = [...room.points];
            newPoints.splice(edgeIndex + 1, 0, action.splitPoint);
            return {
              ...room,
              points: newPoints,
              edges: createEdgesFromPoints(newPoints),
            };
          }
          return room;
        });
        break;
      case "UNDO":
        return applyAction(action.originalAction, rooms);
      default:
        return rooms;
    }

    return updateSharedEdges(updatedRooms);
  };

  // When adding a point to a shared edge, split it in all connected rooms
  const splitSharedEdge = (
    roomId: string,
    edgeIndex: number,
    splitPoint: THREE.Vector3
  ) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    // Find all rooms that share this edge
    const connectedRooms: { roomId: string; edgeIndex: number }[] =
      room.sharedEdges?.filter((se) => {
        // Check if this shared edge corresponds to our edgeIndex
        const sharedEdge = rooms.find((r) => r.id === se.roomId)?.edges?.[
          se.edgeIndex
        ];
        const ourEdge = room.edges?.[edgeIndex];
        return sharedEdge && ourEdge && areEdgesEqual(sharedEdge, ourEdge);
      }) || [];

    // Include the original room
    connectedRooms.push({ roomId, edgeIndex });

    // Get all unique room IDs and their corresponding edge indices
    const roomIds = connectedRooms.map((r) => r.roomId);
    const edgeIndices = connectedRooms.map((r) => r.edgeIndex);

    setRooms((prev) =>
      applyAction(
        {
          type: "SPLIT_SHARED_EDGE",
          roomIds,
          edgeIndices,
          splitPoint,
        },
        prev
      )
    );
  };

  // When creating a new room, check for shared edges with existing rooms
  const checkForSharedEdges = (newRoom: Room) => {
    const sharedEdges: {
      roomId1: string;
      roomId2: string;
      edgeIndex1: number;
      edgeIndex2: number;
    }[] = [];

    rooms.forEach((existingRoom) => {
      newRoom.edges?.forEach((newEdge, newEdgeIndex) => {
        existingRoom.edges?.forEach((existingEdge, existingEdgeIndex) => {
          if (areEdgesEqual(newEdge, existingEdge)) {
            sharedEdges.push({
              roomId1: newRoom.id,
              roomId2: existingRoom.id,
              edgeIndex1: newEdgeIndex,
              edgeIndex2: existingEdgeIndex,
            });
          }
        });
      });
    });

    sharedEdges.forEach((sharedEdge) => {
      saveAction({
        type: "SHARE_EDGE",
        ...sharedEdge,
      });
    });
  };

  // Finalize polygon room with shared edge detection
  const finalizePolygon = (polygonPoints: THREE.Vector3[]) => {
    if (polygonPoints.length < 3) return;

    const closedPoints = [...polygonPoints, polygonPoints[0]];
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      type: "polygon",
      points: closedPoints,
      height: 2.5,
      color:
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0"),
      edges: createEdgesFromPoints(closedPoints),
      label: `Room ${roomCounter}`,
    };

    const updatedRooms = [...rooms, newRoom];
    setRooms(updateSharedEdges(updatedRooms));
    checkForSharedEdges(newRoom);

    saveAction({ type: "CREATE_ROOM", room: newRoom });
    setRoomCounter(roomCounter + 1);
    setIsDrawing(false);
    setPoints([]);
    setCurrentPosition(null);
    setShowClosingHint(false);
  };

  // Modified mergeLines to handle shared edges
  const mergeLines = (
    roomId: string,
    edgeIndex: number,
    newPoints: THREE.Vector3[]
  ) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    // Check if this edge is shared
    const isShared = room.sharedEdges?.some((se) => {
      const sharedEdge = rooms.find((r) => r.id === se.roomId)?.edges?.[
        se.edgeIndex
      ];
      const ourEdge = room.edges?.[edgeIndex];
      return sharedEdge && ourEdge && areEdgesEqual(sharedEdge, ourEdge);
    });

    if (isShared) {
      // If shared, split the edge in all connected rooms
      const pointToAdd = newPoints[edgeIndex + 1]; // The new point being added
      splitSharedEdge(roomId, edgeIndex, pointToAdd);
    } else {
      // If not shared, proceed as normal
      setRooms((prev) =>
        prev.map((room) =>
          room.id === roomId
            ? {
                ...room,
                points: newPoints,
                edges: createEdgesFromPoints(newPoints),
              }
            : room
        )
      );
      saveAction({ type: "MERGE_LINES", roomId, edgeIndex, newPoints });
    }
  };

  // Calculate polygon area
  const calculatePolygonArea = (vertices: THREE.Vector3[]) => {
    let total = 0;
    for (let i = 0; i < vertices.length - 1; i++) {
      const addX = vertices[i].x;
      const addY = vertices[i == vertices.length - 1 ? 0 : i + 1].z;
      const subX = vertices[i == vertices.length - 1 ? 0 : i + 1].x;
      const subY = vertices[i].z;
      total += addX * addY * 0.5;
      total -= subX * subY * 0.5;
    }
    return Math.abs(total).toFixed(2);
  };

  // Find the closest edge to a point
  const findClosestEdge = (point: THREE.Vector3) => {
    let closestEdge = null;
    let closestDistance = Infinity;
    rooms.forEach((room) => {
      room.edges?.forEach((edge, edgeIndex) => {
        const closestPoint = new THREE.Vector3();
        edge.closestPointToPoint(point, true, closestPoint);
        const distance = point.distanceTo(closestPoint);
        if (distance < closestDistance && distance < 0.5) {
          closestDistance = distance;
          closestEdge = { roomId: room.id, edgeIndex };
        }
      });
    });
    return closestEdge;
  };

  // Handle pointer down
  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0 || is3d) return;

    const now = Date.now();
    const isDoubleClick = now - lastClickTime.current < 300;
    lastClickTime.current = now;

    const worldPosition = getIntersectionPoint(event, camera, scene, size);
    const snappedPosition = gridSnap
      ? snapToGrid(worldPosition)
      : worldPosition;

    if (!snappedPosition) return;

    // Check for overlapping edges
    if (hoverEdge && !isDrawing) {
      const { roomId, edgeIndex } = hoverEdge;
      const room = rooms.find((r) => r.id === roomId);
      if (room) {
        const newPoints = [...room.points];
        newPoints.splice(edgeIndex + 1, 0, snappedPosition);
        mergeLines(roomId, edgeIndex, newPoints);
        return;
      }
    }

    if (activeTool === "PolygonWall") {
      if (!isDrawing) {
        setIsDrawing(true);
        setPoints([snappedPosition]);
      } else {
        if (
          points.length >= 2 &&
          snappedPosition.distanceTo(points[0]) < 0.5 * 0.8
        ) {
          finalizePolygon(points);
        } else if (isDoubleClick && points.length >= 2) {
          finalizePolygon(points);
        } else {
          setPoints([...points, snappedPosition]);
          saveAction({
            type: "ADD_POINT",
            roomId: `temp-${Date.now()}`,
            point: snappedPosition,
            index: points.length,
          });
        }
      }
    }
  };

  // Handle pointer move
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    const worldPosition = getIntersectionPoint(event, camera, scene, size);
    const snappedPosition = gridSnap
      ? snapToGrid(worldPosition)
      : worldPosition;

    if (!snappedPosition) return;

    setHoverPoint(snappedPosition);

    if (isDragging) {
      handlePointDragMove(event);
      return;
    }

    // Find closest edge when not drawing
    if (!isDrawing && !is3d) {
      const closestEdge = findClosestEdge(snappedPosition);
      setHoverEdge(closestEdge);
    }

    if (!isDrawing || is3d) return;

    if (activeTool === "PolygonWall") {
      setCurrentPosition(snappedPosition);

      if (points.length >= 2) {
        const shouldShowHint =
          snappedPosition.distanceTo(points[0]) < 0.5 * 0.8;
        setShowClosingHint(shouldShowHint);
      }
    }
  };

  // Handle pointer up
  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (event.button === 2 && isDrawing) {
      setIsDrawing(false);
      setPoints([]);
      setCurrentPosition(null);
      setShowClosingHint(false);
      setSelectedRoomId(null);
    }

    if (isDragging) {
      handlePointDragEnd();
    }

    setSelectedRoomId(null);
  };

  // Handle point drag start
  const handlePointDragStart = (
    roomId: string,
    pointIndex: number,
    event: ThreeEvent<PointerEvent>
  ) => {
    event.stopPropagation();
    setSelectedRoomId(roomId);
    setSelectedPointIndex(pointIndex);
    setIsDragging(true);
  };

  // Handle point drag move
  const handlePointDragMove = (event: ThreeEvent<PointerEvent>) => {
    if (!isDragging || selectedRoomId === null || selectedPointIndex === null)
      return;

    const worldPosition = getIntersectionPoint(event, camera, scene, size);
    const snappedPosition = gridSnap
      ? snapToGrid(worldPosition)
      : worldPosition;

    if (!snappedPosition) return;

    const oldPosition = rooms.find((room) => room.id === selectedRoomId)
      ?.points[selectedPointIndex];

    setRooms((prev) =>
      prev.map((room) =>
        room.id === selectedRoomId
          ? {
              ...room,
              points: room.points.map((point, idx) =>
                idx === selectedPointIndex ? snappedPosition : point
              ),
              edges: createEdgesFromPoints(
                room.points.map((point, idx) =>
                  idx === selectedPointIndex ? snappedPosition : point
                )
              ),
            }
          : room
      )
    );

    saveAction({
      type: "MOVE_POINT",
      roomId: selectedRoomId,
      index: selectedPointIndex,
      newPosition: snappedPosition,
      oldPosition: oldPosition!,
    });
  };

  // Handle point drag end
  const handlePointDragEnd = () => {
    setIsDragging(false);
  };

  // Handle point deletion
  const handlePointDelete = (roomId: string, pointIndex: number) => {
    const deletedPoint = rooms.find((room) => room.id === roomId)?.points[
      pointIndex
    ];

    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? {
              ...room,
              points: room.points.filter((_, idx) => idx !== pointIndex),
              edges: createEdgesFromPoints(
                room.points.filter((_, idx) => idx !== pointIndex)
              ),
            }
          : room
      )
    );

    saveAction({
      type: "DELETE_POINT",
      roomId,
      index: pointIndex,
      point: deletedPoint!,
    });

    setSelectedPointIndex(null);
    setSelectedRoomId(null);
  };

  // Render polygon preview
  const RenderPolygonPreview = () => {
    if (points.length === 0) return null;

    const allPoints = [...points];
    if (currentPosition) allPoints.push(currentPosition);

    return (
      <>
        <Line
          points={allPoints}
          color={showClosingHint ? "lime" : "orange"}
          lineWidth={3}
          dashed={false}
        />
        {points.map((point, index) => (
          <group key={index} position={point}>
            <mesh>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshBasicMaterial
                color={index === 0 && showClosingHint ? "lime" : "orange"}
              />
            </mesh>
            <Text
              position={[0, 0.3, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {index + 1}
            </Text>
          </group>
        ))}
        {currentPosition && (
          <mesh position={currentPosition}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color="white" />
          </mesh>
        )}
        {points.length > 0 && currentPosition && (
          <Text
            position={[
              (points[points.length - 1].x + currentPosition.x) / 2,
              0.1,
              (points[points.length - 1].z + currentPosition.z) / 2,
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.2}
            color="white"
          >
            {points[points.length - 1].distanceTo(currentPosition).toFixed(2)}m
          </Text>
        )}
        {showClosingHint && (
          <Text
            position={[points[0].x, 0.5, points[0].z]}
            fontSize={0.3}
            color="lime"
          >
            Click to close
          </Text>
        )}
      </>
    );
  };

  return (
    <>
      {/* Existing rooms */}
      {rooms.map((room) => {
        const centroid = new THREE.Vector3();
        room.points.forEach((point) => centroid.add(point));
        centroid.divideScalar(room.points.length);

        return (
          <group key={room.id}>
            <Line
              points={room.points}
              color={room.color}
              lineWidth={selectedRoomId === room.id ? 3 : 2}
              dashed={false}
            />
            {/* Highlight shared edges differently */}
            {room.edges?.map((edge, edgeIndex) => {
              const isShared = room.sharedEdges?.some(
                (se) => se.edgeIndex === edgeIndex
              );

              if (isShared) {
                return (
                  <Line
                    key={edgeIndex}
                    points={[edge.start, edge.end]}
                    color="white"
                    lineWidth={4}
                    dashed={false}
                  />
                );
              }
              return null;
            })}
            {/* Highlight hovered edge */}
            {hoverEdge?.roomId === room.id && (
              <Line
                points={[
                  room.points[hoverEdge.edgeIndex],
                  room.points[hoverEdge.edgeIndex + 1],
                ]}
                color="cyan"
                lineWidth={4}
                dashed={false}
              />
            )}
            {room.points.map((point, idx) => {
              // Don't render the closing point as a separate marker
              if (idx === room.points.length - 1) return null;

              const isSelected =
                selectedRoomId === room.id && selectedPointIndex === idx;

              return (
                <group
                  key={idx}
                  position={point}
                  onPointerDown={(e) => handlePointDragStart(room.id, idx, e)}
                >
                  <mesh>
                    <sphereGeometry args={[isSelected ? 0.25 : 0.15, 16, 16]} />
                    <meshBasicMaterial
                      color={isSelected ? "yellow" : room.color}
                    />
                  </mesh>
                  {isSelected && (
                    <Text
                      position={[0, -0.4, 0]}
                      rotation={[-Math.PI / 2, 0, 0]}
                      fontSize={0.2}
                      color="red"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        handlePointDelete(room.id, idx);
                      }}
                    >
                      Delete
                    </Text>
                  )}
                </group>
              );
            })}
            <Text
              position={[centroid.x, 0.1, centroid.z]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {room.label} ({calculatePolygonArea(room.points)}m²)
            </Text>
          </group>
        );
      })}

      {/* Polygon preview */}
      {activeTool === "PolygonWall" && isDrawing && <RenderPolygonPreview />}

      {/* Hover point indicator */}
      {hoverPoint && !isDragging && (
        <mesh position={hoverPoint}>
          <circleGeometry args={[0.1, 16]} />
          <meshBasicMaterial color="white" />
        </mesh>
      )}

      {/* Instructions */}
      {isDrawing && (
        <Text
          position={[0, 0.1, -5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
        >
          {points.length < 3
            ? "Click to add points"
            : "Double-click or press Enter to finish"}
        </Text>
      )}
      {isDragging && (
        <Text
          position={[0, 0.1, -5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.3}
          color="yellow"
          anchorX="center"
        >
          Dragging point | Release to finish | Esc to cancel
        </Text>
      )}
      {hoverEdge && !isDrawing && (
        <Text
          position={[0, 0.1, -6]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.3}
          color="cyan"
          anchorX="center"
        >
          Click to add point to edge
        </Text>
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
