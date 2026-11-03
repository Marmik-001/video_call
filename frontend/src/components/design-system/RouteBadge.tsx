import type { HTMLAttributes, ReactNode } from "react";

export type RouteBadgeVariant =
  | "host"
  | "srflx"
  | "relay"
  | "checking"
  | "error"
  | "simulation"
  | "neutral";

export interface RouteBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: RouteBadgeVariant;
  children: ReactNode;
}

export function RouteBadge({
  variant = "neutral",
  className = "",
  children,
  ...props
}: RouteBadgeProps) {
  const variantStyles: Record<RouteBadgeVariant, string> = {
    host: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
    srflx: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25",
    relay: "bg-purple-500/10 text-purple-400 border border-purple-500/25",
    checking: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
    error: "bg-rose-500/10 text-rose-400 border border-rose-500/25",
    simulation: "bg-[#171717] text-[#a1a1a1] border border-dashed border-[#404040]",
    neutral: "bg-[#121212] text-[#a1a1a1] border border-[#262626]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-mono font-medium tracking-wide ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
