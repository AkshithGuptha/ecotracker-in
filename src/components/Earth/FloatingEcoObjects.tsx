import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export const FloatingEcoObjects: React.FC = () => {
  const groupRef = useRef<THREE.Group | null>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
      groupRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 3D Stylized Wind Turbine Rotor */}
      <mesh position={[2.8, 1.2, 0.5]} rotation={[0.4, 0.2, 0]}>
        <cylinderGeometry args={[0.04, 0.08, 1.2, 16]} />
        <meshStandardMaterial color="#39FF88" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* 3D Solar Panel Diamond */}
      <mesh position={[-2.9, -1.0, 0.8]} rotation={[0.3, 0.5, 0.2]}>
        <boxGeometry args={[0.8, 0.5, 0.05]} />
        <meshStandardMaterial color="#1687D9" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* 3D Environmental Leaf */}
      <mesh position={[2.2, -1.8, -0.6]} rotation={[0.8, 0.3, 0.5]}>
        <coneGeometry args={[0.3, 0.9, 16]} />
        <meshStandardMaterial color="#18A66A" roughness={0.4} />
      </mesh>

      {/* 3D Water Droplet Sphere */}
      <mesh position={[-2.5, 1.6, -0.4]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color="#38BDF8" transparent opacity={0.85} roughness={0.1} />
      </mesh>
    </group>
  );
};

export default FloatingEcoObjects;
