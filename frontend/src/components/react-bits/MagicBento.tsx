import React, { useRef, useState, useCallback } from "react";

export interface MagicBentoCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: string;
  enableSpotlight?: boolean;
  sectionLabel?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

export const MagicBentoCard: React.FC<MagicBentoCardProps> = ({
  glowColor = "#ffffff",
  enableSpotlight = true,
  sectionLabel,
  badge,
  children,
  className = "",
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enableSpotlight || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      setCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [enableSpotlight]
  );

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-5 transition-all duration-200 hover:border-[#404040] ${className}`}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Effect */}
      {enableSpotlight && isHovered && (
        <div
          className="pointer-events-none absolute -inset-px rounded-[8px] opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, ${glowColor}15, transparent 60%)`,
          }}
        />
      )}

      {/* Header section label if present */}
      {(sectionLabel || badge) && (
        <div className="relative z-10 flex items-center justify-between border-b border-[#242424]/50 pb-3 mb-4">
          {sectionLabel && (
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#a1a1a1]">
              {sectionLabel}
            </span>
          )}
          {badge && <div>{badge}</div>}
        </div>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
};

export interface MagicBentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const MagicBentoGrid: React.FC<MagicBentoGridProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-12 gap-4 ${className}`}>
      {children}
    </div>
  );
};
