"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { PlanEmptyState } from "./PlanEmptyState";
import { WelcomeSection } from "./WelcomeSection";
import { FollowUpSuggestions } from "./FollowUpSuggestions";
import { ResearchProgress } from "./ResearchProgress";
import { trpc } from "@/lib/trpc";
import { BarChart3, FileText, PieChart, Sparkles } from "lucide-react";

// Move constant outside component to prevent recreation on every render
const PANEL_SECTIONS = [
  "Company Overview",
  "Products & Services",
  "Key Stakeholders",
  "Financial Position",
  "Market & Competition",
  "SWOT Analysis",
  "Strategic Opportunities",
  "Risks & Considerations",
  "Recommended Strategy",
  "Research Notes",
] as const;

interface ChatInterfaceProps {
  sessionId: string;
  mode: "chat" | "voice";
  isNewSession?: boolean;
}

export function ChatInterface({
  sessionId: initialSessionId,
  mode,
  isNewSession = false,
}: ChatInterfaceProps) {
  const router = useRouter();

  const [localIsNewSession, setLocalIsNewSession] = useState(isNewSession);

  const [session, setSession] = useState({
    id: initialSessionId,
    companyName: "",
    reportContent: "",
    hasReport: false,
  });

  const [accountPlan, setAccountPlan] = useState<any>(null);

  const [ui, setUI] = useState({
    isLoading: false,
    isInitializing: true,
    isLoadingReport: false,
    progress: "idle" as
      | "idle"
      | "researching"
      | "analyzing"
      | "complete"
      | "error",
  });

  const [data, setData] = useState({
    messages: [] as Array<{ id: string; role: string; content: string }>,
    findings: [] as any[],
    conflicts: [] as any[],
    followUpSuggestions: [] as string[],
  });

  const [structuredData, setStructuredData] = useState<
    Record<
      string,
      {
        title: string;
        content: string;
        confidence: number;
        dataPoints: string[];
        sources?: string[];
        conflicts?: Array<{
          claim: string;
          sources: string[];
          resolution?: string;
        }>;
      }
    >
  >({});

  useEffect(() => {
    if (!localIsNewSession && initialSessionId !== "temp") {
      const fetchSessionData = async () => {
        try {
          const sessionData = await trpc.research.get.query({
            sessionId: initialSessionId,
          });

          if (sessionData) {
            setSession((s) => ({
              ...s,
              id: sessionData.id,
              companyName: sessionData.companyName || "",
            }));

            if (sessionData.accountPlan) {
              setAccountPlan(sessionData.accountPlan);
            }

            if (sessionData.messages?.length > 0) {
              setData((d) => ({
                ...d,
                messages: sessionData.messages.map((msg: any) => ({
                  id: msg.id,
                  role: msg.role,
                  content: msg.content,
                })),
              }));
            }

            if (sessionData.findings?.length > 0) {
              setData((d) => ({
                ...d,
                findings: sessionData.findings,
              }));
            }

            // Load structured data from session on page reload
            const structData = (sessionData as any)?.structuredData;
            if (structData && typeof structData === "object") {
              setStructuredData(structData);
            }
          }
        } catch (err) {
          console.error("Failed to load session data:", err);
        } finally {
          setUI((u) => ({ ...u, isInitializing: false }));
        }
      };

      fetchSessionData();
    } else {
      setUI((u) => ({ ...u, isInitializing: false }));
    }
  }, [initialSessionId, localIsNewSession]);

  const addMessage = useCallback((role: string, content: string) => {
    const msg = { id: String(Date.now()), role, content };
    setData((d) => ({ ...d, messages: [...d.messages, msg] }));
  }, []);

  const setProgress = (progress: typeof ui.progress) => {
    setUI((u) => ({ ...u, progress }));
    if (["complete", "error"].includes(progress)) {
      setTimeout(() => {
        setUI((u) => ({ ...u, progress: "idle" }));
      }, 2000);
    }
  };

  const handleSendMessage = async (content: string) => {
    // Optimistically add message immediately to UI for smooth experience
    addMessage("user", content);
    setUI((u) => ({ ...u, isLoading: true }));
    setProgress("researching");

    let currentId = session.id;

    if (localIsNewSession && session.id === "temp") {
      try {
        const created = await trpc.research.create.mutate({ mode: "chat" });
        currentId = created.id;
        setSession((s) => ({ ...s, id: created.id }));
        setLocalIsNewSession(false);
      } catch (e: any) {
        console.error("Failed to create session:", e);
        if (e?.code === "UNAUTHORIZED") router.push("/login");
        setUI((u) => ({ ...u, isLoading: false }));
        setProgress("error");
        return;
      }
    }

    try {
      const result = await trpc.research.extractCompanyName.mutate({
        text: content,
      });

      if (result.companyName) {
        setSession((s) => ({ ...s, companyName: result.companyName || "" }));
        try {
          await trpc.research.updateSessionCompanyName.mutate({
            sessionId: currentId,
            companyName: result.companyName,
          });
        } catch (e) {
          console.error("Failed to update company name:", e);
        }
      }
    } catch (e) {
      console.error("Failed to extract company name:", e);
    }

    try {
      const response = await trpc.agent.askQuestion.mutate({
        sessionId: currentId,
        question: content,
      });

      setProgress("analyzing");

      // Batch all state updates together to prevent flickering
      // Update data (findings, conflicts, suggestions)
      setData((d) => ({
        ...d,
        findings: [...d.findings, ...(response.findings ?? [])],
        conflicts: [...d.conflicts, ...(response.conflicts ?? [])],
        followUpSuggestions: response.followUpSuggestions ?? [],
      }));

      // Update structured data for right panel (batch update to prevent flickering)
      if (
        response.structuredData &&
        Object.keys(response.structuredData).length > 0
      ) {
        console.log("Received structured data:", response.structuredData);
        // Use functional update to ensure we're working with latest state
        setStructuredData((prev) => {
          // Merge new data with existing, preserving what we have
          const merged = { ...prev };
          Object.entries(response.structuredData).forEach(([key, value]) => {
            if (value && (value as any).content) {
              merged[key] = value as any;
            }
          });
          return merged;
        });
      } else {
        console.warn("No structured data received from agent response");
      }

      // Add assistant message BEFORE sync to show response immediately
      const assistantContent =
        response.assistantMessage?.content || response.assistantMessage || "";

      if (!assistantContent) {
        console.warn("⚠️ Assistant response is empty!", {
          assistantMessage: response.assistantMessage,
          responseKeys: Object.keys(response || {}),
        });
      }

      addMessage("assistant", assistantContent);

      // Sync structured data to plan sections (single call, use result directly)
      try {
        console.log("Syncing structured data to plan for session:", currentId);
        const syncResult = await trpc.research.syncStructuredDataToPlan.mutate({
          sessionId: currentId,
        });
        console.log("Sync result:", syncResult);
        if (syncResult.plan) {
          console.log(
            "Updated plan from sync, sections:",
            syncResult.plan.sections?.length
          );
          // Use sync result directly - no need to re-fetch
          setAccountPlan(syncResult.plan);
        }
      } catch (err) {
        console.error("Failed to sync structured data to plan:", err);
      }

      if (session.companyName) {
        setUI((u) => ({ ...u, isLoadingReport: true }));
        try {
          const report = await trpc.research.getReport.mutate({
            sessionId: currentId,
          });

          setSession((s) => ({
            ...s,
            reportContent: report.content,
            hasReport: true,
          }));
        } catch (err) {
          setSession((s) => ({ ...s, reportContent: "", hasReport: false }));
        } finally {
          setUI((u) => ({ ...u, isLoadingReport: false }));
        }
      }

      setProgress("complete");

      if (!localIsNewSession && session.id !== "temp") {
        window.history.replaceState(
          null,
          "",
          `/dashboard/research/${currentId}`
        );
      }
    } catch (e) {
      addMessage(
        "assistant",
        "Sorry, I encountered an error processing your request. Please try again."
      );
      setProgress("error");
    } finally {
      setUI((u) => ({ ...u, isLoading: false }));
    }
  };

  const handleFollowUpSuggestion = (s: string) => {
    setData((d) => ({ ...d, followUpSuggestions: [] }));
    handleSendMessage(s);
  };

  return (
    <div className="h-full grid gap-4 grid-cols-1 md:grid-cols-[1fr_320px]">
      {/* Left Panel */}
      <div className="flex flex-col bg-background border rounded-lg overflow-hidden min-h-0">
        {ui.progress !== "idle" && (
          <div className="border-b p-3 bg-muted/40 shrink-0">
            <ResearchProgress
              status={ui.progress}
              message={
                ui.progress === "researching"
                  ? "Gathering research…"
                  : ui.progress === "analyzing"
                  ? "Analyzing findings…"
                  : ui.progress === "complete"
                  ? "Done"
                  : ui.progress === "error"
                  ? "An error occurred"
                  : ""
              }
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          {data.messages.length > 0 ? (
            <MessageList
              messages={data.messages}
              isLoading={ui.isLoading}
              isInitializing={ui.isInitializing}
            />
          ) : (
            !ui.isLoading &&
            !ui.isInitializing && (
              <div className="px-4 pb-4 mt-auto mb-8">
                <WelcomeSection
                  onPromptClick={handleSendMessage}
                  isLoading={ui.isLoading}
                />
              </div>
            )
          )}
        </div>

        {data.followUpSuggestions.length > 0 && !ui.isLoading && (
          <div className="px-4 pb-2 shrink-0">
            <FollowUpSuggestions
              suggestions={data.followUpSuggestions}
              onSuggestClick={handleFollowUpSuggestion}
              isLoading={ui.isLoading}
            />
          </div>
        )}

        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={ui.isLoading}
          mode={mode}
          sessionId={session.id}
        />
      </div>

      {/* Right Sidebar */}
      <div className="hidden md:flex flex-col min-h-0">
        <div className="bg-background border rounded-lg flex flex-col overflow-hidden h-full">
          <div className="border-b p-4 bg-muted/40 shrink-0">
            <h2 className="text-sm font-medium">Research Analysis</h2>
            {session.companyName && (
              <p className="text-xs text-muted-foreground mt-1">
                {session.companyName}
              </p>
            )}
          </div>

          {Object.values(structuredData).some(
            (data) => data && (data.confidence > 0 || data.content)
          ) ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              {PANEL_SECTIONS.map((sectionTitle) => {
                const sectionData = structuredData[sectionTitle];
                // Check if section is pending: either missing OR has confidence 0
                const isPending =
                  !sectionData ||
                  sectionData.confidence === 0 ||
                  !sectionData.content;

                return (
                  <div
                    key={sectionTitle}
                    className={`border rounded-md p-3 transition-colors ${
                      isPending
                        ? "bg-muted/20 border-dashed opacity-60"
                        : "bg-background hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium flex-1">
                        {sectionTitle}
                      </h3>
                      {isPending ? (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          Pending
                        </span>
                      ) : (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {Math.round(sectionData.confidence * 100)}%
                        </span>
                      )}
                    </div>

                    {isPending ? (
                      <p className="text-xs text-muted-foreground italic mt-2">
                        Waiting for research data...
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground mt-2">
                          {sectionData.content}
                        </p>

                        {sectionData.dataPoints &&
                          sectionData.dataPoints.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {sectionData.dataPoints.map((point, pidx) => (
                                <div
                                  key={pidx}
                                  className="text-xs text-foreground/80 flex items-start gap-2"
                                >
                                  <span className="text-blue-600 mt-0.5">
                                    •
                                  </span>
                                  <span>{point}</span>
                                </div>
                              ))}
                            </div>
                          )}

                        {/* Show sources */}
                        {sectionData.sources &&
                          sectionData.sources.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-border/30">
                              <p className="text-xs font-medium text-foreground/70 mb-1">
                                Sources:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {sectionData.sources.map(
                                  (source: string, sidx: number) => (
                                    <span
                                      key={sidx}
                                      className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-sm"
                                    >
                                      {source}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {/* Show conflicts if they exist */}
                        {sectionData.conflicts &&
                          sectionData.conflicts.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-amber-200 bg-amber-50/50 rounded p-2">
                              <p className="text-xs font-medium text-amber-800 mb-1">
                                ⚠️ Conflicting Information:
                              </p>
                              {sectionData.conflicts.map(
                                (conflict: any, cidx: number) => (
                                  <div
                                    key={cidx}
                                    className="text-xs text-amber-700 mb-1"
                                  >
                                    <p className="font-medium">
                                      {conflict.claim}
                                    </p>
                                    <p className="text-amber-600">
                                      Sources:{" "}
                                      {conflict.sources?.join(", ") || "N/A"}
                                    </p>
                                    {conflict.resolution && (
                                      <p className="text-amber-700 italic mt-0.5">
                                        Resolution: {conflict.resolution}
                                      </p>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          )}

                        {/* Dig deeper button */}
                        <button
                          onClick={() =>
                            handleSendMessage(
                              `I'd like to dig deeper into "${sectionTitle}". Can you provide more detailed analysis, additional sources, and any conflicting information?`
                            )
                          }
                          className="text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium"
                        >
                          🔍 Dig Deeper
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-muted/5">
              <div className="relative">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center animate-pulse">
                  <BarChart3 className="w-10 h-10 text-blue-500" />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-background rounded-full flex items-center justify-center shadow-sm border">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                </div>
              </div>

              <div className="space-y-2 max-w-[280px]">
                <h3 className="font-semibold text-foreground text-lg">
                  Awaiting Analysis
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  As you research, AI will automatically extract and organize
                  key insights here in real-time.
                </p>
              </div>

              <div className="w-full max-w-60 space-y-3 opacity-40">
                <div className="flex items-center gap-3 p-2 border rounded bg-background">
                  <div className="w-8 h-8 rounded bg-muted"></div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2 bg-muted rounded w-3/4"></div>
                    <div className="h-2 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 border rounded bg-background">
                  <div className="w-8 h-8 rounded bg-muted"></div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2 bg-muted rounded w-2/3"></div>
                    <div className="h-2 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
