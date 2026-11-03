import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon: ReactNode;
  message: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  message,
  actionText,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-[8px] border border-[#242424] bg-[#0a0a0a] ${className}`}
    >
      {/* Small icon in a bordered square */}
      <div className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#262626] bg-[#121212] text-[#ededed]">
        {icon}
      </div>

      {/* One muted sentence */}
      <p className="mt-3 text-sm text-[#a1a1a1] max-w-sm">
        {message}
      </p>

      {/* One button */}
      {actionText && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center justify-center rounded-[6px] border border-[#262626] bg-[#171717] px-3.5 py-1.5 text-xs font-medium text-[#ededed] transition-colors hover:border-[#404040] hover:bg-[#1f1f1f]"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
