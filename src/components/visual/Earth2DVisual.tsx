import React from "react";

interface Earth2DVisualProps {
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  glowColor?: "green" | "blue" | "teal";
}

export const Earth2DVisual: React.FC<Earth2DVisualProps> = ({
  size = "hero",
  className = "",
  glowColor = "green",
}) => {
  const getSizeDimensions = () => {
    switch (size) {
      case "sm":
        return "w-32 h-32";
      case "md":
        return "w-56 h-56";
      case "lg":
        return "w-80 h-80";
      case "hero":
      default:
        return "w-full max-w-[500px] h-[450px]";
    }
  };

  const getGlowBg = () => {
    switch (glowColor) {
      case "blue":
        return "from-[#1687D9]/20 via-[#0B5EA8]/10 to-transparent";
      case "teal":
        return "from-[#35B9FF]/20 via-[#18A66A]/10 to-transparent";
      case "green":
      default:
        return "from-[#18A66A]/25 via-[#0B3D2E]/15 to-transparent";
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${getSizeDimensions()} ${className}`}>
      {/* Outer Radial Glow */}
      <div className={`absolute inset-0 rounded-full bg-radial ${getGlowBg()} blur-2xl animate-pulse pointer-events-none`} />

      {/* Layered 2D Graphic Earth Container */}
      <div className="relative w-[85%] h-[85%] rounded-full bg-gradient-to-tr from-[#050807] via-[#07110D] to-[#0A0F0D] border border-[#18A66A]/40 shadow-[0_0_60px_rgba(24,166,106,0.25)] flex items-center justify-center overflow-hidden">
        {/* Fine Lat/Long Grid Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#18a66a22_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

        {/* Orbit Grid Rings */}
        <div className="absolute w-[90%] h-[90%] rounded-full border border-[#39FF88]/20 border-dashed animate-[spin_40s_linear_infinite]" />
        <div className="absolute w-[70%] h-[70%] rounded-full border border-[#1687D9]/20 border-dashed animate-[spin_30s_linear_infinite_reverse]" />

        {/* Stylized Continent SVG Graphic Layer */}
        <svg className="w-3/4 h-3/4 text-[#18A66A]/80 opacity-75" viewBox="0 0 100 100" fill="currentColor">
          <path d="M 20 40 Q 30 20 50 25 Q 70 30 80 50 Q 75 75 55 80 Q 30 85 20 60 Z" fill="url(#earthGradient)" />
          <path d="M 60 15 Q 75 10 85 25 Q 90 40 75 45 Z" fill="url(#earthGradient)" />
          <defs>
            <linearGradient id="earthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#39FF88" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#18A66A" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#1687D9" stopOpacity="0.7" />
            </linearGradient>
          </defs>
        </svg>

        {/* Atmospheric Glow Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-[#39FF88]/30 shadow-[inset_0_0_20px_rgba(57,255,136,0.2)] pointer-events-none" />
      </div>
    </div>
  );
};

export default Earth2DVisual;
