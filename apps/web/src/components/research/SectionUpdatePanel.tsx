"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

interface SectionUpdatePanelProps {
  planId: string;
  sessionId: string;
  onUpdate?: (updatedContent: string) => void;
}

export function SectionUpdatePanel({
  planId,
  sessionId,
  onUpdate,
}: SectionUpdatePanelProps) {
  const [prompt, setPrompt] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateHistory, setUpdateHistory] = useState<
    Array<{ id: string; prompt: string; timestamp: string }>
  >([]);

  const handleUpdateSections = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      setIsUpdating(true);

      // Call LLM to update specific sections based on user prompt
      const response = await trpc.research.updateAccountPlanSections.mutate({
        planId,
        sessionId,
        prompt: prompt.trim(),
      });

      if (response.updatedContent) {
        onUpdate?.(response.updatedContent);
        toast.success("Sections updated successfully");

        // Add to update history
        setUpdateHistory((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            prompt: prompt.trim(),
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);

        setPrompt("");
      }
    } catch (error) {
      console.error("Failed to update sections:", error);
      toast.error("Failed to update sections");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleUpdateSections();
    }
  };

  return (
    <div className="bg-white rounded-lg border h-full flex flex-col overflow-hidden shadow-sm">
      {/* Header */}
      <div className="border-b bg-gray-50 p-4 sticky top-0 z-10">
        <h3 className="font-semibold text-sm text-gray-800">Update Sections</h3>
        <p className="text-xs text-gray-500 mt-1">
          Describe what you'd like to update or add
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Update History */}
        {updateHistory.length > 0 && (
          <div className="flex-1 p-4 border-b space-y-2 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Recent Updates
            </p>
            <div className="space-y-2">
              {updateHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-2 bg-blue-50 border border-blue-200 rounded text-xs"
                >
                  <p className="text-gray-700">{item.prompt}</p>
                  <p className="text-gray-500 text-xs mt-1">{item.timestamp}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {updateHistory.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-center p-4">
            <div>
              <p className="text-sm text-gray-500">No updates yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Use prompts to update specific sections
              </p>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t bg-gray-50 space-y-3">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='e.g., "Update the market analysis section with 2024 data" or "Add information about their recent funding round"'
            className="w-full p-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
          />

          <Button
            onClick={handleUpdateSections}
            disabled={isUpdating || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Send size={16} />
                Update Sections
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Tip: Use Ctrl+Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}
