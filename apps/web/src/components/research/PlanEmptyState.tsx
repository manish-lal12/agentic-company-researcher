import { ChevronRight } from "lucide-react";
import { useState } from "react";

interface PlanEmptyStateProps {
  onExamplePromptClick?: (prompt: string) => void;
  isLoadingExamples?: boolean;
}

const PLAN_SECTIONS = [
  "Company Overview",
  "Products & Services",
  "Key Stakeholders",
  "Financial Position",
  "Market & Competition",
  "SWOT Analysis",
  "Strategic Opportunities",
  "Risks & Considerations",
  "Recommended Strategy",
  "Research Notes",
];

export function PlanEmptyState({
  onExamplePromptClick,
  isLoadingExamples = false,
}: PlanEmptyStateProps) {
  return (
    <div className="bg-background rounded-lg border h-full flex flex-col overflow-hidden shadow-sm">
      {/* Header */}
      <div className="border-b bg-muted/40 p-3 sticky top-0 z-10">
        <h2 className="font-semibold text-sm text-foreground">
          Account Plan Preview
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Welcome Section */}
        <div className="px-6 py-8 text-center border-b bg-linear-to-b from-blue-50 to-white dark:from-blue-950 dark:to-background">
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900">
              <span className="text-xl">📋</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Account Plan Coming
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Start researching to build a comprehensive profile of this
                company across key business areas.
              </p>
            </div>
          </div>
        </div>

        {/* Plan Sections Preview */}
        <div className="flex-1 px-4 py-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Plan Sections
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {PLAN_SECTIONS.map((section) => (
              <div
                key={section}
                className="p-3 rounded-md border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <p className="text-xs font-medium text-foreground/80 leading-snug">
                  {section}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Pending</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-4 py-4 text-center border-t bg-muted/40">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium">💡 Pro Tip:</span> Ask questions to
            gather insights about the company
          </p>
        </div>
      </div>
    </div>
  );
}
