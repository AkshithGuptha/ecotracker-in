import React, { useRef, useMemo } from "react";
import * as THREE from "three";

interface EarthParticlesProps {
  carbonLevel?: number; // e.g. 0 to 50 kg CO2
  ecoPoints?: number;   // e.g. 0 to 1000 pts
}

export const EarthParticles: React.FC<EarthParticlesProps> = ({
  carbonLevel = 15,
  ecoPoints = 250,
}) => {
  const carbonParticlesRef = useRef<THREE.Points | null>(null);
  const ecoParticlesRef = useRef<THREE.Points | null>(null);

  // Carbon Particles (Red/Amber/Dark Orange CO2 Swarm)
  const carbonCount = Math.min(1500, Math.max(200, Math.round(carbonLevel * 45)));
  const [carbonPositions, carbonColors] = useMemo(() => {
    const pos = new Float32Array(carbonCount * 3);
    const col = new Float32Array(carbonCount * 3);
    const cAmber = new THREE.Color("#FF5533");
    const cDark = new THREE.Color("#FF8844");

    for (let i = 0; i < carbonCount; i++) {
      const r = 2.0 + Math.random() * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const mix = Math.random();
      const c = mix > 0.5 ? cAmber : cDark;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [carbonCount]);

  // Eco Particles (Electric Green & Ocean Blue Eco Swarm)
  const ecoCount = Math.min(1200, Math.max(150, Math.round(ecoPoints * 1.5)));
  const [ecoPositions, ecoColors] = useMemo(() => {
    const pos = new Float32Array(ecoCount * 3);
    const col = new Float32Array(ecoCount * 3);
    const cGreen = new THREE.Color("#39FF88");
    const cCyan = new THREE.Color("#1687D9");

    for (let i = 0; i < ecoCount; i++) {
      const r = 2.1 + Math.random() * 1.1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const mix = Math.random();
      const c = mix > 0.4 ? cGreen : cCyan;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [ecoCount]);

  return (
    <>
      {/* Carbon Particle Swarm */}
      <points ref={carbonParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[carbonPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[carbonColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          vertexColors
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Positive Eco Particle Swarm */}
      <points ref={ecoParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[ecoPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[ecoColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
};

export default EarthParticles;
