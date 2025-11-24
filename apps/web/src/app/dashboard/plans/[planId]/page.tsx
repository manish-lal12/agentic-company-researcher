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
  .content-updating {
    animation: contentUpdate 2s ease-out;
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
      <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-4 h-full">
        <Skeleton className="h-full bg-gray-200 rounded-lg" />
        <Skeleton className="h-full bg-gray-200 rounded-lg" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="bg-red-50 rounded-lg p-6 border border-red-200">
        <p className="text-red-800">{error || "Plan not found"}</p>
        <button
          onClick={() => router.back()}
          className="text-red-600 hover:underline mt-2"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-4 h-full">
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
