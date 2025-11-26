"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, BookOpen, Plus, FolderOpen, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface ResearchSession {
  id: string;
  userId: string;
  mode: string;
  status: string;
  name?: string;
  companyName?: string;
  startedAt: string;
  endedAt?: string;
}

interface AccountPlan {
  id: string;
  userId: string;
  title?: string;
  name?: string;
  companyId: string;
  sessionId?: string;
}

export function DynamicSidebar() {
  const { data: session } = authClient.useSession();
  const params = useParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [researchSessions, setResearchSessions] = useState<ResearchSession[]>(
    []
  );
  const [accountPlans, setAccountPlans] = useState<AccountPlan[]>([]);
  const [loadingResearch, setLoadingResearch] = useState(true); // Start as true since we need to fetch
  const [loadingPlans, setLoadingPlans] = useState(true); // Start as true since we need to fetch
  const [generatingName, setGeneratingName] = useState<string | null>(null);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  const [openResearch, setOpenResearch] = useState(true);
  const [openPlans, setOpenPlans] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Fetch research sessions
  useEffect(() => {
    if (!session) return;

    const load = async () => {
      try {
        setLoadingResearch(true);
        const sessions = await trpc.research.list.query();
        setResearchSessions((sessions as ResearchSession[]) || []);
      } catch (error: any) {
        console.error("Failed to load research sessions:", error);
        if (error?.code === "UNAUTHORIZED") {
          toast.error("Authentication required");
          router.push("/login");
        }
      } finally {
        setLoadingResearch(false);
      }
    };
    load();
  }, [session, router, refetchTrigger]);

  // Fetch account plans
  useEffect(() => {
    if (!session) return; // Don't fetch if session is not available

    const load = async () => {
      try {
        setLoadingPlans(true);
        const plans = await trpc.accountPlan.list.query();
        setAccountPlans((plans as AccountPlan[]) || []);
      } catch (error: any) {
        console.error("Failed to load account plans:", error);
        if (error?.code === "UNAUTHORIZED") {
          toast.error("Authentication required");
          router.push("/login");
        }
      } finally {
        setLoadingPlans(false);
      }
    };
    load();
  }, [session, router, refetchTrigger]);

  // Refetch sessions when active route changes (new session created)
  useEffect(() => {
    const currentSessionId = params?.id as string | undefined;
    if (currentSessionId) {
      // Small delay to ensure new session is persisted in database
      const timer = setTimeout(() => {
        setRefetchTrigger((prev) => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [params?.id]);

  // Generate session name when navigating to session
  const handleSessionClick = async (s: ResearchSession) => {
    // If session has no name, generate one
    if (!s.name && s.id) {
      setGeneratingName(s.id);
      try {
        await trpc.research.generateSessionName.mutate({ sessionId: s.id });
        // Update the session in state with the new name
        setResearchSessions((prev) =>
          prev.map((sess) =>
            sess.id === s.id
              ? { ...sess, name: `${sess.companyName || "Research"}` }
              : sess
          )
        );
      } catch (error) {
        console.error("Failed to generate session name:", error);
        toast.error("Failed to generate session name");
      } finally {
        setGeneratingName(null);
      }
    }

    setNavigatingId(s.id);
    startTransition(() => {
      router.push(`/dashboard/research/${s.id}`);
    });
  };

  const getSessionDisplayName = (s: ResearchSession): string => {
    return s.name || s.companyName || `Session ${s.id.slice(0, 8)}`;
  };

  return (
    <nav
      className="
        border-r 
        bg-background 
        p-4 
        space-y-8 
        overflow-y-auto 
        text-foreground 
        scrollbar-thin 
        scrollbar-thumb-muted 
        scrollbar-track-transparent
      "
    >
      {/* Workspace Header */}
      <div>
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
            {session?.user?.name?.[0] || "A"}
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Workspace
            </p>
            <p className="text-sm font-semibold text-foreground">
              {session?.user?.name || "User"}
            </p>
          </div>
        </div>

        <div className="mt-4 h-px bg-border"></div>
      </div>

      {/* Research Section */}
      <div className="space-y-2">
        <button
          onClick={() => setOpenResearch(!openResearch)}
          className="flex items-center w-full text-left text-sm font-semibold text-foreground/80 hover:text-foreground transition px-1"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Research Sessions
          <ChevronDown
            className={`w-4 h-4 ml-auto transition-transform ${
              openResearch ? "rotate-180" : ""
            }`}
          />
        </button>

        {openResearch && (
          <div className="pl-6 space-y-2">
            {/* Scrollable list */}
            <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent pr-1">
              {loadingResearch ? (
                <div className="space-y-2 py-1">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-5/6" />
                </div>
              ) : researchSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions yet</p>
              ) : (
                <div className="space-y-1">
                  {researchSessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSessionClick(s)}
                      disabled={
                        generatingName === s.id ||
                        (navigatingId === s.id && isPending)
                      }
                      className={`
                        w-full
                        text-left
                        text-xs 
                        text-foreground/70 
                        hover:text-blue-600 
                        hover:bg-muted
                        px-2 
                        py-1 
                        rounded 
                        truncate
                        disabled:opacity-50
                        flex items-center justify-between
                        ${
                          navigatingId === s.id && isPending
                            ? "bg-muted text-blue-600"
                            : ""
                        }
                      `}
                    >
                      <span className="truncate">
                        {generatingName === s.id
                          ? "Generating name..."
                          : getSessionDisplayName(s)}
                      </span>
                      {navigatingId === s.id && isPending && (
                        <Loader2 className="w-3 h-3 animate-spin ml-2 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* New session */}
            <Link
              href="/dashboard"
              className="
                flex items-center gap-2 
                text-xs 
                text-blue-600 
                hover:text-blue-700 
                font-semibold 
                mt-2 
                pt-2 
                border-t 
                border-border"
            >
              <Plus className="w-3 h-3" />
              New Research Session
            </Link>
          </div>
        )}
      </div>

      {/* Account Plans */}
      <div className="space-y-2">
        <button
          onClick={() => setOpenPlans(!openPlans)}
          className="flex items-center w-full text-left text-sm font-semibold text-foreground/80 hover:text-foreground transition px-1"
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          Account Plans
          <ChevronDown
            className={`w-4 h-4 ml-auto transition-transform ${
              openPlans ? "rotate-180" : ""
            }`}
          />
        </button>

        {openPlans && (
          <div className="pl-6 space-y-2">
            <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent pr-1">
              {loadingPlans ? (
                <div className="space-y-2 py-1">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              ) : accountPlans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No plans yet</p>
              ) : (
                <div className="space-y-1">
                  {accountPlans.map((p) => (
                    <Link
                      key={p.id}
                      href={`/dashboard/plans/${p.id}`}
                      className="
                        block 
                        text-xs 
                        text-foreground/70 
                        hover:text-blue-600 
                        hover:bg-muted
                        px-2 
                        py-1 
                        rounded 
                        truncate
                      "
                    >
                      {p.title || p.name || "Untitled Plan"}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
