import React from "react";
import { ArrowRight } from "lucide-react";

interface EcoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "icon" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  showArrow?: boolean;
  className?: string;
}

export const EcoButton: React.FC<EcoButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  showArrow = false,
  className = "",
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-gradient-to-r from-[#39FF88] via-[#18A66A] to-[#1687D9] text-[#050807] font-black hover:brightness-110 shadow-lg shadow-[#18A66A]/25 border-0";
      case "secondary":
        return "bg-[#0E1713] border border-[#18A66A]/30 text-[#F4F7F4] hover:border-[#39FF88] hover:bg-[#111C18] font-bold";
      case "ghost":
        return "bg-transparent text-[#C7D2CC] hover:text-white hover:bg-white/5 font-mono uppercase border-0";
      case "danger":
        return "bg-rose-950/80 border border-rose-500/40 text-rose-300 hover:bg-rose-900/80 font-bold";
      case "icon":
        return "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-[#18A66A]/50 p-2.5 rounded-xl";
      default:
        return "";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "px-4 py-2 text-xs";
      case "lg":
        return "px-8 py-4 text-sm";
      case "md":
      default:
        return "px-6 py-3 text-xs";
    }
  };

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full uppercase font-mono tracking-wider transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      {...props}
    >
      <span>{children}</span>
      {showArrow && (
        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
      )}
    </button>
  );
};

export default EcoButton;
