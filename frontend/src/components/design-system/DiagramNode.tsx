import type { HTMLAttributes, ReactNode } from "react";

export type DiagramNodeState = "idle" | "active" | "connected" | "error";

export interface DiagramNodeProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  state?: DiagramNodeState;
  icon?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
}

export function DiagramNode({
  title,
  subtitle,
  state = "idle",
  icon,
  badge,
  children,
  className = "",
  ...props
}: DiagramNodeProps) {
  const stateStyles: Record<DiagramNodeState, string> = {
    idle: "border-border-subtle bg-surface",
    active:
      "border-cyan-400/80 bg-surface shadow-[0_0_0_1px_rgba(34,211,238,0.4),0_0_24px_rgba(34,211,238,0.15)]",
    connected:
      "border-emerald-400/80 bg-surface shadow-[0_0_0_1px_rgba(52,211,153,0.4),0_0_24px_rgba(52,211,153,0.15)]",
    error:
      "border-rose-400/80 bg-surface shadow-[0_0_0_1px_rgba(244,63,94,0.4),0_0_24px_rgba(244,63,94,0.15)]",
  };

  return (
    <div
      className={`relative min-w-[140px] rounded-xl border p-4 transition-all duration-300 sm:min-w-[180px] ${stateStyles[state]} ${className}`}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon && <div className="text-text-muted">{icon}</div>}
          <div>
            <div className="text-sm font-semibold text-text-main sm:text-base">
              {title}
            </div>
            {subtitle && (
              <div className="text-xs font-mono text-text-muted">{subtitle}</div>
            )}
          </div>
        </div>
        {badge && <div>{badge}</div>}
      </div>

      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
