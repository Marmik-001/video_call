import type { HTMLAttributes, ReactNode } from "react";

export interface LabCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "raised" | "interactive";
  sectionLabel?: string;
  children: ReactNode;
}

export function LabCard({
  variant = "default",
  sectionLabel,
  className = "",
  children,
  ...props
}: LabCardProps) {
  const baseClasses = "rounded-[8px] border transition-colors";
  const variantClasses = {
    default: "bg-[#0a0a0a] border-[#242424]",
    raised: "bg-[#121212] border-[#242424]",
    interactive: "bg-[#0a0a0a] border-[#242424] hover:border-[#404040] cursor-pointer",
  }[variant];

  const cardElement = (
    <div
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );

  if (sectionLabel) {
    return (
      <div className="space-y-2">
        <div className="text-xs font-mono font-medium tracking-wider text-[#a1a1a1] uppercase">
          {sectionLabel}
        </div>
        {cardElement}
      </div>
    );
  }

  return cardElement;
}
