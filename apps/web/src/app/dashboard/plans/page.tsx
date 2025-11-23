// apps/web/src/app/dashboard/plans/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

export default function AccountPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Fetch account plans from tRPC
        const data = await trpc.accountPlan.list.query();
        setPlans(data || []);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to load account plans");
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Account Plans</h1>
        <button
          onClick={() => (router as any).push("/dashboard/research/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Generate Plan from Research
        </button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-24 bg-gray-200" />
            <Skeleton className="h-24 bg-gray-200" />
          </>
        ) : error ? (
          <div className="bg-red-50 rounded-lg p-6 border border-red-200">
            <p className="text-red-800">{error}</p>
          </div>
        ) : plans && plans.length > 0 ? (
          plans.map((plan: any) => (
            <button
              key={plan.id}
              onClick={() =>
                (router as any).push(`/dashboard/plans/${plan.id}`)
              }
              className="bg-white rounded-lg p-6 border hover:shadow-md transition-shadow text-left"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">Account Plan</h3>
                  <p className="text-sm text-gray-500">
                    {plan.sections?.length || 0} sections
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Created {new Date(plan.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {(plan.sections?.length || 0) > 0 ? "Ready" : "Empty"}
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="bg-white rounded-lg p-6 border text-center text-gray-500">
            <p>No account plans yet. Create one from a research session.</p>
          </div>
        )}
      </div>
    </div>
  );
}
