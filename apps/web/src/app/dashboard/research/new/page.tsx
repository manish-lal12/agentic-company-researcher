// apps/web/src/app/dashboard/research/new/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

export default function NewResearchPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Call tRPC to create research session
      const session = await trpc.research.create.mutate({
        companyName: "New Research Session",
        topic: "Company Research",
        mode,
      });
      (router as any).push(`/dashboard/research/${session.id}`);
    } catch (err) {
      setError("Failed to create research session");
      setIsLoading(false);
    }
  };
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Start New Research Session</h1>
        <p className="text-gray-600">
          Choose how you'd like to conduct your research
        </p>
      </div>

      <div className="space-y-4">
        {/* Chat Mode */}
        <div
          onClick={() => setMode("chat")}
          className={`p-6 rounded-lg border cursor-pointer transition-all ${
            mode === "chat"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Chat Mode</h3>
              <p className="text-gray-600 text-sm">
                Interactive text-based research with real-time responses from
                the AI assistant
              </p>
            </div>
            <input
              type="radio"
              checked={mode === "chat"}
              onChange={() => setMode("chat")}
              className="mt-1"
            />
          </div>
        </div>

        {/* Voice Mode */}
        <div
          onClick={() => setMode("voice")}
          className={`p-6 rounded-lg border cursor-pointer transition-all ${
            mode === "voice"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Voice Mode</h3>
              <p className="text-gray-600 text-sm">
                Speak your research queries naturally and get spoken responses
                from the AI
              </p>
            </div>
            <input
              type="radio"
              checked={mode === "voice"}
              onChange={() => setMode("voice")}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={handleCreate}
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Creating..." : "Create Session"}
        </button>
        <button
          onClick={() => router.back()}
          className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
