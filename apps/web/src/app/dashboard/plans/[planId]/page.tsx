"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;
  const [plan, setPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        // Fetch plan from tRPC
        const data = await trpc.accountPlan.get.query({ planId });
        setPlan(data);
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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Call tRPC to export plan in JSON format
      const exportData = await trpc.accountPlan.export.query({
        planId,
        format: "markdown",
      });

      // Create a blob from the exported data
      const blob = new Blob([exportData.data], {
        type: exportData.contentType,
      });

      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${exportData.filename}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Plan exported successfully");
    } catch (err) {
      console.error("Failed to export plan:", err);
      toast.error("Failed to export plan");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this plan?")) {
      setIsDeleting(true);
      try {
        // Call tRPC to delete plan
        await trpc.accountPlan.delete.mutate({ planId });
        (router as any).push("/dashboard/plans");
      } catch (err) {
        setError("Failed to delete plan");
        setIsDeleting(false);
      }
    }
  };
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3 bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
          <Skeleton className="h-96 bg-gray-200" />
          <Skeleton className="h-96 bg-gray-200" />
        </div>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Account Plan</h1>
        <div className="space-x-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {isExporting ? "Exporting..." : "Export"}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        {/* Main Plan Editor */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-lg mb-4">Plan Sections</h2>
            {plan.sections && plan.sections.length > 0 ? (
              <div className="space-y-4">
                {plan.sections.map((section: any, idx: number) => (
                  <div
                    key={section.id || idx}
                    className="p-4 border rounded bg-gray-50"
                  >
                    <h3 className="font-semibold mb-2">
                      Section {(section.order || idx) + 1}
                    </h3>
                    <p className="text-gray-700">{section.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No sections in this plan</p>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="bg-white rounded-lg border p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-sm mb-1">Plan ID</h3>
            <p className="text-xs text-gray-600 break-all">{planId}</p>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">Sections</h3>
            <p className="text-xs text-gray-600">
              {plan.sections?.length || 0} sections
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">Created</h3>
            <p className="text-xs text-gray-600">
              {new Date(plan.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">Last Updated</h3>
            <p className="text-xs text-gray-600">
              {new Date(plan.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
