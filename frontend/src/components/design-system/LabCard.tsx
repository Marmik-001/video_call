import type { HTMLAttributes, ReactNode } from "react";

export interface LabCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "raised" | "interactive";
  children: ReactNode;
}

export function LabCard({
  variant = "default",
  className = "",
  children,
  ...props
}: LabCardProps) {
  const baseClasses = "rounded-xl border transition-colors";
  const variantClasses = {
    default: "bg-surface border-border-subtle",
    raised: "bg-surface-raised border-border-subtle shadow-md",
    interactive: "bg-surface border-border-subtle hover:border-border-hover cursor-pointer",
  }[variant];

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
