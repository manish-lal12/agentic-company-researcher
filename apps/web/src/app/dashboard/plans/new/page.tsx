"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function NewPlanPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreatePlan = async () => {
    if (!title.trim() || !companyName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);

      // Get or create company
      let company: any = null;

      // Try to find existing company by name
      // For now, we'll create a new company entry through the plan creation
      // The backend will handle company creation/retrieval

      // Create the plan with initial sections
      const plan = await trpc.accountPlan.create.mutate({
        companyId: "temp", // We'll handle this in the backend
        sessionId: "standalone", // Mark as standalone plan (not from research session)
        title: title.trim(),
        sections: [
          {
            title: "Executive Summary",
            content: "Brief overview of the account and strategic approach.",
          },
          {
            title: "Company Overview",
            content:
              "Background information about the company and key business metrics.",
          },
          {
            title: "Strategic Objectives",
            content:
              "Key goals and objectives for this account over the next 12 months.",
          },
          {
            title: "Key Challenges",
            content: "Primary challenges and pain points to address.",
          },
          {
            title: "Proposed Solutions",
            content:
              "Recommended approach and solutions to address identified challenges.",
          },
          {
            title: "Success Metrics",
            content: "KPIs and metrics to measure success of the account plan.",
          },
        ],
      });

      toast.success("Plan created successfully");
      router.push(`/dashboard/plans/${plan.id}`);
    } catch (error) {
      console.error("Failed to create plan:", error);
      toast.error("Failed to create plan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg border p-8">
        <h1 className="text-2xl font-bold mb-6">Create New Account Plan</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g., "Apple Inc. Strategic Account Plan"'
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder='e.g., "Apple Inc."'
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <p className="text-sm text-gray-600">
            The plan will be created with standard sections that you can edit
            and customize.
          </p>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCreatePlan}
              disabled={isLoading || !title.trim() || !companyName.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Create Plan"}
            </button>
            <button
              onClick={() => router.back()}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
