import type { HTMLAttributes, ReactNode } from "react";

export interface KeycapProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export function Keycap({ children, className = "", ...props }: KeycapProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[4px] border border-[#333333] bg-[#121212] px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#a1a1a1] shadow-none select-none ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
