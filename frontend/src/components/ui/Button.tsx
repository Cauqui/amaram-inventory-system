import type { ReactNode } from "react";

export function Btn({
  children, onClick, variant = "primary", size = "md", disabled = false, className = "",
}: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md"; disabled?: boolean; className?: string;
}) {
  const base = "inline-flex items-center gap-1.5 font-medium rounded transition-all cursor-pointer select-none";
  const sizes = { sm: "px-2.5 py-1 text-xs", md: "px-3.5 py-1.5 text-sm" };
  const variants = {
    primary: "bg-[#2D6A6A] text-white hover:bg-[#245757] active:scale-95",
    secondary: "bg-white text-[#1A1A1A] border border-[#E2DDD7] hover:bg-[#F5F3F0] active:scale-95",
    ghost: "text-[#6B6560] hover:bg-[#F5F3F0] hover:text-[#1A1A1A] active:scale-95",
    danger: "bg-[#FFEBEE] text-[#C62828] hover:bg-[#FFCDD2] active:scale-95",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      {children}
    </button>
  );
}
