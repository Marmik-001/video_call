import React, { useRef, useState, useCallback } from "react";

export interface SpecularButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  lineColor?: string;
  baseColor?: string;
  glow?: number;
  followMouse?: boolean;
  children: React.ReactNode;
}

export const SpecularButton: React.FC<SpecularButtonProps> = ({
  variant = "primary",
  lineColor = "#ffffff",
  baseColor = "#262626",
  glow = 1,
  followMouse = true,
  children,
  className = "",
  disabled = false,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!followMouse || !buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x, y });
    },
    [followMouse]
  );

  // Variant styling
  const variantStyles = {
    primary: "bg-[#ededed] text-black hover:bg-white font-medium",
    secondary: "bg-[#121212] text-[#ededed] hover:bg-[#171717] font-normal",
    outline: "bg-transparent text-[#ededed] hover:bg-[#121212] font-normal",
  }[variant];

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center gap-2 rounded-[6px] px-4 py-2 text-xs transition-all duration-150 overflow-hidden select-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${variantStyles} ${className}`}
      style={{
        border: `1px solid ${baseColor}`,
      }}
      {...props}
    >
      {/* Dynamic Specular Light Edge */}
      {isHovered && !disabled && (
        <span
          className="pointer-events-none absolute inset-[-1px] rounded-[6px] transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 80px at ${mousePos.x}% ${mousePos.y}%, ${lineColor}40, transparent 70%)`,
            boxShadow:
              glow > 0
                ? `0 0 ${8 * glow}px ${lineColor}25`
                : "none",
          }}
        />
      )}

      {/* Surface light shimmer on primary / secondary */}
      {isHovered && !disabled && variant === "secondary" && (
        <span
          className="pointer-events-none absolute inset-0 rounded-[5px] opacity-20 transition-opacity"
          style={{
            background: `radial-gradient(circle 60px at ${mousePos.x}% ${mousePos.y}%, #ffffff, transparent 80%)`,
          }}
        />
      )}

      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};
