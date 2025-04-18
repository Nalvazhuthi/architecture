import React, { useEffect, useState } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { generateWallsFromRooms } from "../../functions/generateWallsForRoom";
interface Room {
  name: string;
  area: number; // Ensure area is correctly populated
  points: THREE.Vector3[];
}

interface RenderRoomsProps {
  rooms: Room[];
}

const RenderRooms: React.FC<RenderRoomsProps> = ({ rooms }) => {
  const [walls, setWalls] = useState<any[]>([]);
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
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    return { minX, maxX, minZ, maxZ };
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
              <meshBasicMaterial
                color="#ccccc"
                side={THREE.BackSide}
                transparent
                opacity={1}
              />
            </mesh>
            <Html position={[adjustedPos.x, 0.02, adjustedPos.z]}>
              <div className="room-label">
                <div className="label">{room.name}</div>
                <div className="label area">Dimension : 10 * 14</div>
              </div>
            </Html>
          </group>
        );
      })}

      {/* Render Walls */}
      {walls.map((wall, index) => {
        const { start, end } = wall;
        return (
          <group key={`2d-wall-${index}`} position={[0, 0.015, 0]}>
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={
                    new Float32Array([start.x, 0, start.z, end.x, 0, end.z])
                  }
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial linewidth={2} color="black" />
            </line>
          </group>
        );
      })}
    </>
  );
};

export default RenderRooms;
