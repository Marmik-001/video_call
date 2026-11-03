import React from "react";
import { motion } from "motion/react";

export interface StepItem {
  id: number;
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepChange: (step: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepChange,
  className = "",
}) => {
  return (
    <nav
      aria-label="Progress Stepper"
      className={`w-full overflow-x-auto py-1 scrollbar-none ${className}`}
    >
      <div className="flex items-center gap-1.5 min-w-max p-1 rounded-[8px] border border-[#242424] bg-[#0a0a0a]">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepChange(step.id)}
              className={`relative flex items-center gap-2 rounded-[6px] px-3 py-1.5 text-xs font-mono transition-colors z-10 ${
                isActive
                  ? "text-[#ededed] font-medium"
                  : isCompleted
                  ? "text-[#a1a1a1] hover:text-[#ededed]"
                  : "text-[#666666] hover:text-[#a1a1a1]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-stepper-pill"
                  className="absolute inset-0 rounded-[6px] border border-[#404040] bg-[#171717] -z-10 shadow-sm"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold ${
                  isActive
                    ? "bg-[#ededed] text-black"
                    : isCompleted
                    ? "bg-[#262626] text-[#ededed]"
                    : "bg-[#171717] text-[#666666]"
                }`}
              >
                {step.id}
              </span>

              <span className="truncate">{step.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
