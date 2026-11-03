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
      <h3 className="text-sm font-mono font-medium uppercase tracking-wider text-[#a1a1a1]">
        Guiding Question: <span className="text-[#ededed] font-sans normal-case text-base font-normal">{question}</span>
      </h3>

      {/* Analogy Callout Box */}
      <div className="rounded-[6px] border-l-2 border-[#404040] bg-[#121212] px-4 py-3.5 text-[#ededed]">
        <p className="text-sm sm:text-base leading-relaxed text-[#a1a1a1]">
          <span className="font-medium text-[#ededed]">Analogy: </span>
          {analogy}
        </p>
      </div>
    </div>
  );
}
