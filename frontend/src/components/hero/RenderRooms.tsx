import React, { useEffect, useState } from "react";
import * as THREE from "three";
import { Html, useTexture } from "@react-three/drei";
import { generateWallsFromRooms } from "../../functions/generateWallsForRoom";

interface Room {
  name: string;
  area: number;
  points: THREE.Vector3[];
}

interface RenderRoomsProps {
  rooms: Room[];
}

const RenderRooms: React.FC<RenderRoomsProps> = ({ rooms }) => {
  const [walls, setWalls] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState("");

  useEffect(() => {
    const roomWalls = generateWallsFromRooms(rooms);
    setWalls([...roomWalls]);
  }, [rooms]);

  const createShapeFromPoints = (points: THREE.Vector3[]) => {
    const shape = new THREE.Shape();
    if (points.length === 0) return shape;

    shape.moveTo(points[0].x, points[0].z);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].z);
    }
    shape.lineTo(points[0].x, points[0].z); // Close the loop

    return shape;
  };

  const calculateRoomBounds = (points: THREE.Vector3[]) => {
    const xs = points.map((p) => p.x);
    const zs = points.map((p) => p.z);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minZ: Math.min(...zs),
      maxZ: Math.max(...zs),
    };
  };

  const calculateRoomCenter = (points: THREE.Vector3[]) => {
    const bounds = calculateRoomBounds(points);
    return new THREE.Vector3(
      (bounds.minX + bounds.maxX) / 2,
      0,
      (bounds.minZ + bounds.maxZ) / 2
    );
  };

  const adjustLabelPosition = (
    offset: [number, number],
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
    center: THREE.Vector3
  ) => {
    const [offsetX, offsetZ] = offset;
    const adjustedX = center.x + (bounds.maxX - bounds.minX) * 0.5 * offsetX;
    const adjustedZ = center.z + (bounds.maxZ - bounds.minZ) * 0.5 * offsetZ;
    return { x: adjustedX, z: adjustedZ };
  };

  return (
    <>
      {/* Render Rooms */}
      {rooms.map((room, index) => {
        const shape = createShapeFromPoints(room.points);
        const geometry = new THREE.ShapeGeometry(shape);

        const bounds = calculateRoomBounds(room.points);
        const center = calculateRoomCenter(room.points);
        const adjustedPos = adjustLabelPosition([0, 0], bounds, center);

        return (
          <group key={`room-${index}`}>
            <mesh
              geometry={geometry}
              rotation={[Math.PI * 0.5, 0, 0]}
              position={[0, 0.01, 0]}
            >
              <meshStandardMaterial
                side={THREE.BackSide}
                transparent
                opacity={1}
              />
            </mesh>
            <Html
              position={[adjustedPos.x, 0.02, adjustedPos.z]}
              zIndexRange={[1, 0]}
            >
              <div className="room-label">
                <div className="label">{room.name}</div>
                <div className="label area">Dimension : 10 * 14</div>
              </div>
            </Html>
          </group>
        );
      })}

      {/* Render Extruded Walls */}
      {walls.map((wall, index) => {
        const { start, end } = wall;
        const wallThickness = 0.2; // Increased thickness for better visibility
        const wallHeight = 2; // Standard wall height (2.5 meters)

        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        direction.normalize();

        // Create a wall geometry with proper thickness and height
        const wallGeometry = new THREE.BoxGeometry(
          length + 0.2, // length of the wall
          wallHeight, // height of the wall
          wallThickness // thickness of the wall
        );

        // Calculate the center position
        const center = new THREE.Vector3()
          .addVectors(start, end)
          .multiplyScalar(0.5);

        // Calculate the rotation angle
        const angle = Math.atan2(end.z - start.z, end.x - start.x);

        return (
          <mesh
            key={`wall-${index}`}
            geometry={wallGeometry}
            position={[center.x, wallHeight / 2, center.z]} // Position at half height
            rotation={[0, -angle, 0]}
          >
            <meshStandardMaterial metalness={1} roughness={1} />
          </mesh>
        );
      })}
    </>
  );
};

export default RenderRooms;
