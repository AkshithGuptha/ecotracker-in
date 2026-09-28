import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EarthParticles } from "./EarthParticles";
import { FloatingEcoObjects } from "./FloatingEcoObjects";

interface EarthGlobeProps {
  carbonLevel?: number;
  ecoPoints?: number;
}

const EarthGlobe: React.FC<EarthGlobeProps> = ({ carbonLevel = 15, ecoPoints = 250 }) => {
  const earthRef = useRef<THREE.Group | null>(null);
  const cloudRef = useRef<THREE.Mesh | null>(null);

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.12;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.18; // Clouds rotate independently
    }
  });

  return (
    <group ref={earthRef}>
      {/* 1. Core Sphere */}
      <mesh>
        <sphereGeometry args={[1.8, 64, 64]} />
        <meshPhongMaterial
          color="#06130E"
          emissive="#020805"
          specular="#18A66A"
          shininess={30}
        />
      </mesh>

      {/* 2. Lat/Long Grid Wireframe */}
      <mesh>
        <sphereGeometry args={[1.805, 36, 18]} />
        <meshBasicMaterial color="#18A66A" wireframe transparent opacity={0.15} />
      </mesh>

      {/* 3. Atmosphere Glow Outer Shell */}
      <mesh>
        <sphereGeometry args={[2.05, 48, 48]} />
        <meshBasicMaterial color="#39FF88" transparent opacity={0.09} side={THREE.BackSide} />
      </mesh>

      {/* 4. Independent Cloud Sphere */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[1.88, 48, 48]} />
        <meshStandardMaterial color="#A7F3D0" transparent opacity={0.15} roughness={0.9} />
      </mesh>

      {/* 5. Dynamic Particles Layer */}
      <EarthParticles carbonLevel={carbonLevel} ecoPoints={ecoPoints} />

      {/* 6. Floating 3D Eco Objects */}
      <FloatingEcoObjects />
    </group>
  );
};

interface EarthSceneProps {
  carbonLevel?: number;
  ecoPoints?: number;
  className?: string;
}

export const EarthScene: React.FC<EarthSceneProps> = ({
  carbonLevel = 15,
  ecoPoints = 250,
  className = "w-full h-[500px]",
}) => {
  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={1.2} color="#061a12" />
        <directionalLight position={[5, 3, 5]} intensity={2.5} color="#39ff88" />
        <directionalLight position={[-5, -3, -4]} intensity={2.0} color="#1687d9" />
        <EarthGlobe carbonLevel={carbonLevel} ecoPoints={ecoPoints} />
      </Canvas>
    </div>
  );
};

export default EarthScene;
