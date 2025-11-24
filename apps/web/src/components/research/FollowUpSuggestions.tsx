import { AlertCircle, ChevronRight } from "lucide-react";

interface FollowUpSuggestionsProps {
  suggestions: string[];
  onSuggestClick: (suggestion: string) => void;
  isLoading?: boolean;
}

export function FollowUpSuggestions({
  suggestions,
  onSuggestClick,
  isLoading = false,
}: FollowUpSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Research Suggestions</h3>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestClick(suggestion)}
            disabled={isLoading}
            className="w-full text-left p-3 bg-white border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-between group"
          >
            <span className="text-sm text-gray-700 group-hover:text-blue-700">
              {suggestion}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
          </button>
        ))}
      </div>
    </div>
  );
}
