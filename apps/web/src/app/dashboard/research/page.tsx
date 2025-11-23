// apps/web/src/app/dashboard/research/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

export default function ResearchSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // Fetch research sessions from tRPC
        const data = await trpc.research.list.query();
        setSessions(data || []);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to load research sessions");
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Research Sessions</h1>
        <button
          onClick={() => (router as any).push("/dashboard/research/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + New Research Session
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
        ) : sessions && sessions.length > 0 ? (
          sessions.map((session: any) => (
            <button
              key={session.id}
              onClick={() =>
                (router as any).push(`/dashboard/research/${session.id}`)
              }
              className="bg-white rounded-lg p-6 border hover:shadow-md transition-shadow text-left"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">Research Session</h3>
                  <p className="text-sm text-gray-500">
                    Started {new Date(session.startedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {session.status}
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="bg-white rounded-lg p-6 border text-center text-gray-500">
            <p>No research sessions yet. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
