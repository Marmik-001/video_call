import { Sparkles } from "lucide-react";

export interface ConceptDefinitionProps {
  question: string;
  analogy: string;
  className?: string;
}

export function ConceptDefinition({
  question,
  analogy,
  className = "",
}: ConceptDefinitionProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Guiding Question */}
      <h3 className="text-sm font-mono font-medium uppercase tracking-wider text-cyan-400">
        Question: {question}
      </h3>

      {/* Analogy Callout Box */}
      <div className="relative rounded-r-lg border-l-2 border-cyan-400 bg-cyan-950/20 px-4 py-3.5 text-text-main shadow-sm">
        <div className="flex items-start gap-2.5">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
          <p className="text-sm sm:text-base leading-relaxed text-slate-200">
            <span className="font-semibold text-white">Analogy: </span>
            {analogy}
          </p>
        </div>
      </div>
    </div>
  );
}
