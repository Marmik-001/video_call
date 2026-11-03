import React, { useEffect, useState } from "react";
import { Check, X, Loader2 } from "lucide-react";

export type CallChipState = "idle" | "running" | "success" | "error";

export interface CallChipProps {
  label: string;
  state: CallChipState;
  durationMs?: number;
  className?: string;
}

export const CallChip: React.FC<CallChipProps> = ({
  label,
  state,
  durationMs,
  className = "",
}) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (state !== "running") {
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 50);
    return () => {
      clearInterval(interval);
    };
  }, [state]);

  const displayElapsed = state === "running" ? elapsed : (durationMs ?? elapsed);
  const formattedTime = (displayElapsed / 1000).toFixed(1) + "s";

  const stateStyles = {
    idle: "border-[#242424] bg-[#0a0a0a] text-[#a1a1a1]",
    running:
      "border-cyan-500/40 bg-cyan-950/20 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.15)]",
    success: "border-emerald-500/40 bg-emerald-950/20 text-emerald-300",
    error: "border-rose-500/40 bg-rose-950/20 text-rose-300 animate-shake",
  }[state];

  return (
    <div
      className={`relative inline-flex items-center gap-2 overflow-hidden rounded-full border px-3 py-1 font-mono text-xs transition-all duration-200 select-none ${stateStyles} ${className}`}
    >
      {/* Wiping progress fill when running */}
      {state === "running" && (
        <span
          className="pointer-events-none absolute inset-0 bg-cyan-400/10 animate-pulse"
          style={{ width: "100%" }}
        />
      )}

      {/* State Icon */}
      <span className="relative z-10 flex items-center">
        {state === "running" && (
          <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
        )}
        {state === "success" && (
          <Check className="h-3 w-3 text-emerald-400" />
        )}
        {state === "error" && <X className="h-3 w-3 text-rose-400" />}
        {state === "idle" && (
          <span className="h-1.5 w-1.5 rounded-full bg-[#666666]" />
        )}
      </span>

      {/* Tool Call Label */}
      <span className="relative z-10 font-medium tracking-wide">
        {label}
      </span>

      {/* Elapsed Timer */}
      {(state === "running" || state === "success" || state === "error") && (
        <span className="relative z-10 text-[10px] opacity-75 border-l border-current/20 pl-1.5">
          {formattedTime}
        </span>
      )}
    </div>
  );
};
