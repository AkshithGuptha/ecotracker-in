import React from "react";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: "emerald" | "blue" | "teal" | "none";
  border?: boolean;
  onClick?: () => void;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = "",
  glow = "emerald",
  border = true,
  onClick,
}) => {
  const getGlowClass = () => {
    switch (glow) {
      case "emerald":
        return "shadow-[0_0_30px_rgba(24,166,106,0.12)] hover:border-[#18A66A]/50";
      case "blue":
        return "shadow-[0_0_30px_rgba(22,135,217,0.12)] hover:border-[#1687D9]/50";
      case "teal":
        return "shadow-[0_0_30px_rgba(57,255,136,0.12)] hover:border-[#39FF88]/50";
      case "none":
      default:
        return "hover:border-zinc-700";
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-[#07110D]/85 backdrop-blur-2xl rounded-2xl ${
        border ? "border border-[#18A66A]/20" : ""
      } ${getGlowClass()} transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassPanel;
