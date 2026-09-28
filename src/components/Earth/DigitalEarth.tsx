import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface DigitalEarthProps {
  interactive?: boolean;
  size?: "sm" | "md" | "lg" | "fullscreen";
  className?: string;
  scrollDriven?: boolean;
  onEarthClick?: () => void;
}

export const DigitalEarth: React.FC<DigitalEarthProps> = ({
  interactive = true,
  size = "fullscreen",
  className = "",
  scrollDriven = true,
  onEarthClick,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrameId: number;

    try {
      const container = containerRef.current;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      // Scene setup
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = size === "sm" ? 3.5 : size === "md" ? 4.5 : 5.5;

      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);

      // Earth Root Group
      const earthGroup = new THREE.Group();
      scene.add(earthGroup);

      // 1. Core Sphere (Dark Landmass Base)
      const radius = size === "sm" ? 1 : size === "md" ? 1.4 : 1.8;
      const globeGeo = new THREE.SphereGeometry(radius, 64, 64);
      const globeMat = new THREE.MeshPhongMaterial({
        color: new THREE.Color("#06130E"),
        emissive: new THREE.Color("#020805"),
        specular: new THREE.Color("#18A66A"),
        shininess: 25,
        wireframe: false,
        transparent: true,
        opacity: 0.95,
      });
      const globeMesh = new THREE.Mesh(globeGeo, globeMat);
      earthGroup.add(globeMesh);

      // 2. Lat/Long Wireframe Grid Overlay
      const gridGeo = new THREE.SphereGeometry(radius * 1.002, 32, 16);
      const gridMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#18A66A"),
        wireframe: true,
        transparent: true,
        opacity: 0.12,
      });
      const gridMesh = new THREE.Mesh(gridGeo, gridMat);
      earthGroup.add(gridMesh);

      // 3. Atmosphere Glow Shader / Outer Layer
      const atmosGeo = new THREE.SphereGeometry(radius * 1.15, 48, 48);
      const atmosMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#39FF88"),
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
      });
      const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
      earthGroup.add(atmosMesh);

      // 4. Continent Points Cloud (Bio-luminescent Earth dots)
      const pointsCount = 2000;
      const pointsGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(pointsCount * 3);
      const colors = new Float32Array(pointsCount * 3);

      const colorEmerald = new THREE.Color("#39FF88");
      const colorOcean = new THREE.Color("#1687D9");
      const colorTeal = new THREE.Color("#18A66A");

      for (let i = 0; i < pointsCount; i++) {
        // Uniform spherical distribution
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = radius * 1.02;

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const randColor = Math.random();
        const c = randColor > 0.6 ? colorEmerald : randColor > 0.3 ? colorTeal : colorOcean;
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }

      pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      pointsGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const pointsMat = new THREE.PointsMaterial({
        size: 0.035,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const pointsMesh = new THREE.Points(pointsGeo, pointsMat);
      earthGroup.add(pointsMesh);

      // 5. Floating Carbon / Energy Orbit Particles
      const orbitParticlesCount = 600;
      const orbitGeo = new THREE.BufferGeometry();
      const orbitPos = new Float32Array(orbitParticlesCount * 3);

      for (let i = 0; i < orbitParticlesCount; i++) {
        const dist = radius * (1.2 + Math.random() * 0.8);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        orbitPos[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
        orbitPos[i * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
        orbitPos[i * 3 + 2] = dist * Math.cos(phi);
      }

      orbitGeo.setAttribute("position", new THREE.BufferAttribute(orbitPos, 3));
      const orbitMat = new THREE.PointsMaterial({
        color: new THREE.Color("#39FF88"),
        size: 0.025,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
      });
      const orbitMesh = new THREE.Points(orbitGeo, orbitMat);
      scene.add(orbitMesh);

      // Lights
      const ambientLight = new THREE.AmbientLight(0x061a12, 1.5);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0x39ff88, 2.5);
      mainLight.position.set(5, 3, 5);
      scene.add(mainLight);

      const blueLight = new THREE.DirectionalLight(0x1687d9, 2.0);
      blueLight.position.set(-5, -3, -4);
      scene.add(blueLight);

      // Mouse & Scroll Listeners
      let targetRotationX = 0;
      let targetRotationY = 0;
      let mouseX = 0;
      let mouseY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        if (!interactive) return;
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        targetRotationY = mouseX * 0.4;
        targetRotationX = mouseY * 0.3;
      };

      let scrollY = 0;
      const handleScroll = () => {
        if (!scrollDriven) return;
        scrollY = window.scrollY || window.pageYOffset;
      };

      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("scroll", handleScroll, { passive: true });

      // Resize Listener
      const handleResize = () => {
        if (!containerRef.current || !renderer) return;
        const w = containerRef.current.clientWidth || window.innerWidth;
        const h = containerRef.current.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", handleResize);

      // Animation Loop
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        // Constant baseline rotation
        earthGroup.rotation.y += 0.0025;
        gridMesh.rotation.y -= 0.001;
        orbitMesh.rotation.y += 0.0008;
        orbitMesh.rotation.x += 0.0004;

        // Smooth mouse tilt interpolation
        earthGroup.rotation.y += (targetRotationY - earthGroup.rotation.y) * 0.03;
        earthGroup.rotation.x += (targetRotationX - earthGroup.rotation.x) * 0.03;

        // Scroll transform
        if (scrollDriven) {
          const scrollFactor = scrollY * 0.0008;
          earthGroup.rotation.z = Math.sin(scrollFactor) * 0.15;
          camera.position.z = (size === "sm" ? 3.5 : size === "md" ? 4.5 : 5.5) + Math.sin(scrollFactor * 0.5) * 0.5;
        }

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResize);
        if (renderer) renderer.dispose();
      };
    } catch (err) {
      console.warn("WebGL initialization fallback:", err);
      setHasWebGL(false);
    }
  }, [interactive, size, scrollDriven]);

  return (
    <div
      ref={containerRef}
      onClick={onEarthClick}
      className={`relative flex items-center justify-center overflow-hidden ${
        size === "fullscreen"
          ? "w-full h-full"
          : size === "lg"
          ? "w-[500px] h-[500px]"
          : size === "md"
          ? "w-[360px] h-[360px]"
          : "w-[180px] h-[180px]"
      } ${className}`}
    >
      {hasWebGL ? (
        <canvas ref={canvasRef} className="w-full h-full pointer-events-auto cursor-grab active:cursor-grabbing" />
      ) : (
        /* Graceful 2D Canvas / CSS Glow Fallback for Low-Spec GPUs */
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-emerald-900 via-teal-900 to-cyan-950 border border-emerald-500/40 shadow-[0_0_80px_rgba(57,255,136,0.3)] animate-pulse flex items-center justify-center">
            <div className="w-40 h-40 rounded-full border border-emerald-400/20 border-dashed animate-[spin_20s_linear_infinite]" />
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalEarth;
