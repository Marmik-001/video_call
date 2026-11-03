import { ChevronLeft, ChevronRight } from "lucide-react";

export interface StepHeaderProps {
  currentStep: number;
  totalSteps: number;
  categoryLabel?: string;
  title: string;
  subtitle?: string;
  onPrev?: () => void;
  onNext?: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
}

export function StepHeader({
  currentStep,
  totalSteps,
  categoryLabel,
  title,
  subtitle,
  onPrev,
  onNext,
  disablePrev = false,
  disableNext = false,
}: StepHeaderProps) {
  const progressPercent = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));

  return (
    <header className="w-full space-y-4">
      {/* Top Bar: Step Indicator & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
            {categoryLabel ? `${categoryLabel} • ` : ""}Step {currentStep} of {totalSteps}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={disablePrev || !onPrev}
            aria-label="Previous step"
            className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-text-main transition-colors hover:border-border-hover hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={disableNext || !onNext}
            aria-label="Next step"
            className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-100 px-3.5 py-1.5 text-xs font-medium text-slate-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-surface-raised border border-border-subtle/50">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Title & Human Question */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-base text-text-muted sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
