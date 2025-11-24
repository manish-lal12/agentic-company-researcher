"use client";

import { useState } from "react";
import { Loader2, Send, Clock } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Textarea } from "@/components/ui/textarea";

interface UpdateHistoryItem {
  id: string;
  prompt: string;
  timestamp: Date;
  status: "pending" | "success" | "error";
}

interface PlanMetadataPanelProps {
  planId: string;
  plan: any;
  onContentUpdate: (content: string) => void;
}

export function PlanMetadataPanel({
  planId,
  plan,
  onContentUpdate,
}: PlanMetadataPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateHistory, setUpdateHistory] = useState<UpdateHistoryItem[]>([]);

  const handleUpdateSections = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    const historyItem: UpdateHistoryItem = {
      id: Date.now().toString(),
      prompt: prompt.trim(),
      timestamp: new Date(),
      status: "pending",
    };

    setUpdateHistory((prev) => [historyItem, ...prev]);
    setIsUpdating(true);

    try {
      // Build current plan content as markdown
      const currentContent =
        plan.sections
          ?.map((s: any) => `## ${s.title}\n${s.content}`)
          .join("\n\n") || "";

      const result: any = await trpc.research.updateAccountPlanSections.mutate({
        planId,
        sessionId: undefined,
        prompt: prompt.trim(),
        currentContent,
      });

      setUpdateHistory((prev) =>
        prev.map((item) =>
          item.id === historyItem.id ? { ...item, status: "success" } : item
        )
      );

      // Update the page content with new plan content
      if (result.updatedContent) {
        onContentUpdate(result.updatedContent);
      }

      toast.success("Sections updated successfully");
      setPrompt("");
    } catch (error) {
      setUpdateHistory((prev) =>
        prev.map((item) =>
          item.id === historyItem.id ? { ...item, status: "error" } : item
        )
      );

      toast.error("Failed to update sections");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleUpdateSections();
    }
  };

  return (
    <div className="bg-white rounded-lg border h-full flex flex-col overflow-hidden">
      {/* Metadata Section */}
      <div className="border-b bg-gray-50 p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm text-gray-800">Title</h3>
          <p className="text-xs text-gray-600 break-all mt-1">
            {plan.title || "Untitled"}
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-sm text-gray-800">Created</h3>
          <p className="text-xs text-gray-600 mt-1">
            {new Date(plan.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-sm text-gray-800">Last Updated</h3>
          <p className="text-xs text-gray-600 mt-1">
            {new Date(plan.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Update Panel */}
      <div className="flex-1 overflow-y-auto flex flex-col border-t">
        {/* Prompt Input */}
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-sm text-gray-800 mb-1">
            Update Sections
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Describe changes you'd like to make
          </p>

          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="E.g., “Make financial projections more conservative” or “Add recent market data to competitive analysis”"
            className="
            w-full h-24 p-3 text-sm 
            border border-gray-300 
            rounded-md 
            bg-white 
            resize-none 
            placeholder:text-gray-400 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 text-gray-400 disabled:cursor-not-allowed"
            disabled={isUpdating}
          />

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={handleUpdateSections}
              disabled={isUpdating || !prompt.trim()}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Send size={12} />
                  Update
                </>
              )}
            </button>
          </div>
        </div>

        {/* Update History */}
        <div className="flex-1 overflow-y-auto p-3">
          {updateHistory.length === 0 ? (
            <p className="text-center text-gray-400 text-xs py-6">
              No updates yet. Describe changes to get started.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Recent Updates
              </p>
              {updateHistory.map((item) => (
                <div
                  key={item.id}
                  className={`p-2 rounded border text-xs ${
                    item.status === "success"
                      ? "bg-green-50 border-green-200"
                      : item.status === "error"
                      ? "bg-red-50 border-red-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {item.status === "pending" && (
                      <Loader2
                        size={12}
                        className="animate-spin shrink-0 mt-0.5 text-blue-600"
                      />
                    )}
                    {item.status === "success" && (
                      <div className="w-3 h-3 rounded-full bg-green-600 shrink-0 mt-0.5" />
                    )}
                    {item.status === "error" && (
                      <div className="w-3 h-3 rounded-full bg-red-600 shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p
                        className={`mb-1 ${
                          item.status === "success"
                            ? "text-green-800"
                            : item.status === "error"
                            ? "text-red-800"
                            : "text-blue-800"
                        }`}
                      >
                        {item.prompt}
                      </p>

                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={10} />
                        {item.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
