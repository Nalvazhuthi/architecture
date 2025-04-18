import { useEffect, useState, useRef } from "react";
import RaycasterPlane from "./RaycasterPlane";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { snapToGrid } from "../../functions/snapToGrid";

interface Wall {
  position: THREE.Vector3;
}

const DrawLayout: React.FC = () => {
  const [points, setPoints] = useState<THREE.Vector3[]>([]);
  const [tempPoint, setTempPoint] = useState<THREE.Vector3 | null>(null);
  const { scene, camera } = useThree();
  const lineRef = useRef<THREE.Line | null>(null);
  const isDrawing = useRef(false);

  // Handle pointer down (left click to add points)
  const handlePointerDown = (event: any) => {
    if (event.button !== 0) return; // Only proceed for left click
    
    isDrawing.current = true;
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(mouseX, mouseY);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const snappedPosition = snapToGrid(intersect.point.clone());
      setPoints(prev => [...prev, snappedPosition]);
    }
  };

  // Handle right click to close the shape
  const handlePointerUp = (event: any) => {
    if (event.button === 2) { // Right click
      if (points.length >= 2) {
        // Close the shape by adding the first point at the end
        setPoints(prev => [...prev, prev[0].clone()]);
      }
      isDrawing.current = false;
      setTempPoint(null);
    }
  };

  // Handle pointer move to show preview line
  const handlePointerMove = (event: any) => {
    if (!isDrawing.current || points.length === 0) return;
    
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(mouseX, mouseY);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      setTempPoint(snapToGrid(intersect.point.clone()));
    }
  };

  // Create or update the line geometry when points change
  useEffect(() => {
    if (points.length < 1) return;

    // Combine existing points with temp point for preview
    const linePoints = [...points];
    if (tempPoint) {
      linePoints.push(tempPoint);
    }

    // Create or update the line
    if (!lineRef.current) {
      const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
      const line = new THREE.Line(geometry, material);
      scene.add(line);
      lineRef.current = line;
    } else {
      const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      lineRef.current.geometry.dispose();
      lineRef.current.geometry = geometry;
    }

    return () => {
      if (lineRef.current) {
        scene.remove(lineRef.current);
        lineRef.current.geometry.dispose();
        lineRef.current = null;
      }
    };
  }, [points, tempPoint, scene]);

  return (
    <>
      {/* Render points as spheres */}
      {points.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="red" />
        </mesh>
      ))}

      <RaycasterPlane
        handlePointerDown={handlePointerDown}
        handlePointerUp={handlePointerUp}
        handlePointerMove={handlePointerMove}
      />
    </>
  );
};

export default DrawLayout;



// line is not following the curser wjile pointerMove should follow the curser move perfectly