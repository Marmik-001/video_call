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
    host: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    srflx: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
    relay: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    checking: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    error: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    simulation: "bg-cyan-950/40 text-cyan-300 border border-dashed border-cyan-500/40",
    neutral: "bg-slate-800/60 text-slate-300 border border-slate-700/50",
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
