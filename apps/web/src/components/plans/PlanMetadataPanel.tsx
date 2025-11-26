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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUpdateSections();
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border h-full flex flex-col overflow-hidden">
      {/* Metadata Section */}
      <div className="border-b border-border bg-muted/50 p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm text-foreground">Title</h3>
          <p className="text-xs text-muted-foreground break-all mt-1">
            {plan.title || "Untitled"}
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-sm text-foreground">Created</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(plan.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-sm text-foreground">
            Last Updated
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(plan.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Update Panel */}
      <div className="flex-1 overflow-y-auto flex flex-col border-t border-border">
        {/* Prompt Input */}
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-sm text-foreground mb-1">
            Update Sections
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Describe changes you'd like to make
          </p>

          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="E.g., “Make financial projections more conservative” or “Add recent market data to competitive analysis”"
            className="
            w-full h-24 p-3 text-sm 
            border border-input 
            rounded-md 
            bg-background text-foreground
            resize-none 
            placeholder:text-muted-foreground 
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
            disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
            disabled={isUpdating}
          />

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={handleUpdateSections}
              disabled={isUpdating || !prompt.trim()}
              className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
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
            <p className="text-center text-muted-foreground text-xs py-6">
              No updates yet. Describe changes to get started.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Recent Updates
              </p>
              {updateHistory.map((item) => (
                <div
                  key={item.id}
                  className={`p-2 rounded border text-xs ${
                    item.status === "success"
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30"
                      : item.status === "error"
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30"
                      : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {item.status === "pending" && (
                      <Loader2
                        size={12}
                        className="animate-spin shrink-0 mt-0.5 text-blue-600 dark:text-blue-400"
                      />
                    )}
                    {item.status === "success" && (
                      <div className="w-3 h-3 rounded-full bg-green-600 dark:bg-green-500 shrink-0 mt-0.5" />
                    )}
                    {item.status === "error" && (
                      <div className="w-3 h-3 rounded-full bg-red-600 dark:bg-red-500 shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p
                        className={`mb-1 ${
                          item.status === "success"
                            ? "text-green-800 dark:text-green-300"
                            : item.status === "error"
                            ? "text-red-800 dark:text-red-300"
                            : "text-blue-800 dark:text-blue-300"
                        }`}
                      >
                        {item.prompt}
                      </p>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
