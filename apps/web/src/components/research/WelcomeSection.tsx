import { Lightbulb, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

interface WelcomeSectionProps {
  onPromptClick: (prompt: string) => void;
  isLoading?: boolean;
}

const EXAMPLE_PROMPTS = [
  "What is the Apple's recent financial performance?",
  "Who are the key decision makers at Nvidia?",
  "What are the main competitors and market position of Tesla?",
  "Prepare a detailed business account plan of Meta",
];

const BUTTON_CLASS =
  "group w-full max-w-sm h-24 text-left px-4 py-3 rounded-md border bg-background hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

export function WelcomeSection({
  onPromptClick,
  isLoading = false,
}: WelcomeSectionProps) {
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);

  const handlePromptClick = (prompt: string, index: number) => {
    if (isLoading || clickedIndex !== null) return;
    setClickedIndex(index);
    onPromptClick(prompt);
  };
  return (
    <div className="space-y-2">
      {/* Header Section */}
      <div className="text-center space-y-2 pb-12">
        <h2 className="text-lg font-semibold text-foreground">
          What would you like to know?
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Ask questions about the company to build a comprehensive research
          profile. We'll gather insights and populate your account plan.
        </p>
      </div>

      {/* Quick Start Prompts */}
      <div className="space-y-2 flex flex-col items-center">
        {/* Centered Label */}
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <Lightbulb size={14} />
          <span>Try asking about</span>
        </div>

        {/* Centered Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 place-items-center w-full">
          {EXAMPLE_PROMPTS.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handlePromptClick(prompt, index)}
              disabled={isLoading || clickedIndex !== null}
              className={BUTTON_CLASS}
            >
              <div className="flex flex-col justify-between h-full">
                <p className="text-sm text-foreground/80 group-hover:text-foreground">
                  {prompt}
                </p>

                {clickedIndex === index && isLoading ? (
                  <Loader2
                    size={16}
                    className="text-muted-foreground animate-spin"
                  />
                ) : (
                  <ArrowRight
                    size={16}
                    className="text-muted-foreground group-hover:text-foreground self-end"
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
