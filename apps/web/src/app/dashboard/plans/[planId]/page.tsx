"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { MarkdownEditor } from "@/components/research/MarkdownEditor";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PlanMetadataPanel } from "@/components/plans/PlanMetadataPanel";

// Add styles for update animation
const styles = `
  @keyframes contentUpdate {
    0% {
      background-color: rgba(59, 130, 246, 0.1);
    }
    100% {
      background-color: transparent;
    }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .content-updating {
    animation: contentUpdate 2s ease-out;
  }
  .animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
  }
`;

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;

  const [plan, setPlan] = useState<any>(null);
  const [planContent, setPlanContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isContentUpdating, setIsContentUpdating] = useState(false);

  // Fetch plan details
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setIsLoading(true);
        // Fetch plan from tRPC
        const data = await trpc.accountPlan.get.query({ planId });
        setPlan(data);

        // Convert sections to markdown
        if (data?.sections) {
          const content = data.sections
            .map((s: any) => `## ${s.title}\n${s.content}`)
            .join("\n\n");
          setPlanContent(content);
        }
        setIsLoading(false);
      } catch (err) {
        setError("Failed to load plan");
        setIsLoading(false);
      }
    };

    if (planId) {
      fetchPlan();
    }
  }, [planId]);

  const handleSavePlan = async (content: string) => {
    try {
      // Parse sections from markdown
      const sections = content
        .split(/^##\s+/m)
        .filter((s) => s.trim().length > 0)
        .map((section, idx) => {
          const lines = section.split("\n");
          const title = lines[0]?.trim() || `Section ${idx + 1}`;
          const sectionContent = lines.slice(1).join("\n").trim();
          return { title, content: sectionContent, order: idx };
        });

      // Update plan with all sections at once
      await trpc.accountPlan.update.mutate({
        planId,
        sections,
      });

      setPlanContent(content);
      toast.success("Plan saved successfully");
    } catch (error) {
      console.error("Failed to save plan:", error);
      toast.error("Failed to save plan");
      throw error;
    }
  };

  const handleContentUpdate = (updatedContent: string) => {
    setIsContentUpdating(true);
    setPlanContent(updatedContent);
    // Reset animation after 2 seconds
    setTimeout(() => setIsContentUpdating(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-4 h-full p-4">
        <div className="flex flex-col gap-4 h-full">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-8 w-1/3 rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
          <div className="flex-1 bg-card border border-border rounded-lg p-6 space-y-4">
            <Skeleton className="h-10 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
            <div className="h-8" />
            <Skeleton className="h-10 w-1/2 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
          </div>
        </div>
        <div className="h-full">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="bg-destructive/10 rounded-lg p-6 border border-destructive/20 animate-fade-in">
        <p className="text-destructive">{error || "Plan not found"}</p>
        <button
          onClick={() => router.back()}
          className="text-destructive hover:underline mt-2"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-4 h-full animate-fade-in">
        {/* Markdown Editor */}
        <div
          className={`rounded-lg overflow-hidden transition-colors ${
            isContentUpdating ? "content-updating" : ""
          }`}
        >
          <MarkdownEditor
            key={planContent}
            initialContent={planContent}
            onSave={handleSavePlan}
            planName={plan.title}
          />
        </div>

        {/* Metadata Panel with Update Prompt */}
        <PlanMetadataPanel
          planId={planId}
          plan={plan}
          onContentUpdate={handleContentUpdate}
        />
      </div>
    </>
  );
}
