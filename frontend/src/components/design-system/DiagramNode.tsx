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
    idle: "border-[#242424] bg-[#0a0a0a]",
    active:
      "border-cyan-400/80 bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_0_16px_rgba(34,211,238,0.08)]",
    connected:
      "border-emerald-400/80 bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(52,211,153,0.25),0_0_16px_rgba(52,211,153,0.08)]",
    error:
      "border-rose-400/80 bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(244,63,94,0.25),0_0_16px_rgba(244,63,94,0.08)]",
  };

  return (
    <div
      className={`relative min-w-[140px] rounded-[8px] border p-4 transition-all duration-200 sm:min-w-[180px] ${stateStyles[state]} ${className}`}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {icon && <div className="text-[#a1a1a1]">{icon}</div>}
          <div>
            <div className="text-sm font-medium text-[#ededed] sm:text-base">
              {title}
            </div>
            {subtitle && (
              <div className="text-xs font-mono text-[#a1a1a1]">{subtitle}</div>
            )}
          </div>
        </div>
        {badge && <div>{badge}</div>}
      </div>

      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
