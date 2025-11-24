// apps/web/src/app/dashboard/research/[sessionId]/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatInterface } from "@/components/research/ChatInterface";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

export default function ResearchSessionDetail() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        // Fetch session details from tRPC
        const sessionData = await trpc.research.get.query({ sessionId });
        setSession(sessionData);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to load research session");
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="h-full grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
        <div className="flex flex-col bg-white rounded-lg border overflow-hidden">
          <div className="flex-1 p-6">
            <Skeleton className="h-8 w-1/2 mb-4 bg-gray-200" />
            <Skeleton className="h-96 bg-gray-200" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <Skeleton className="h-64 bg-gray-200" />
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="bg-red-50 rounded-lg p-6 border border-red-200">
        <p className="text-red-800">{error || "Research session not found"}</p>
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
    <div className="h-full flex flex-col overflow-hidden">
      <ChatInterface sessionId={sessionId} mode={session.mode || "chat"} />
    </div>
  );
}
