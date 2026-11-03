import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Keycap } from "./Keycap";

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

  // Keyboard navigation support: Left / Right arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when focused inside an input/textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && onPrev && !disablePrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowRight" && onNext && !disableNext) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPrev, onNext, disablePrev, disableNext]);

  return (
    <header className="w-full space-y-4">
      {/* Top Bar: Step Indicator & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium tracking-wider text-[#a1a1a1] uppercase">
            {categoryLabel ? `${categoryLabel} • ` : ""}Step {currentStep} of {totalSteps}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={disablePrev || !onPrev}
            aria-label="Previous step"
            className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-[#242424] bg-[#0a0a0a] px-3 text-xs font-medium text-[#ededed] transition-colors hover:border-[#404040] hover:bg-[#121212] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-[#a1a1a1]" />
            <span>Back</span>
            <Keycap>←</Keycap>
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={disableNext || !onNext}
            aria-label="Next step"
            className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-[#242424] bg-[#121212] px-3.5 text-xs font-medium text-[#ededed] transition-colors hover:border-[#404040] hover:bg-[#171717] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>Next</span>
            <Keycap>→</Keycap>
            <ChevronRight className="h-3.5 w-3.5 text-[#a1a1a1]" />
          </button>
        </div>
      </div>

      {/* Progress Track: 1px hairline */}
      <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-[#171717]">
        <div
          className="h-full bg-[#ededed] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Title & Human Question */}
      <div className="pt-2">
        <h1 className="text-2xl font-medium tracking-tight text-[#ededed] sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-base text-[#a1a1a1] sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
