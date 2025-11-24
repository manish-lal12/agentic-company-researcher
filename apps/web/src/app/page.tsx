"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Search,
  MessageSquare,
  BarChart3,
  Zap,
  ArrowRight,
  CheckCircle2,
  Terminal,
} from "lucide-react";

const TITLE_TEXT = `
███████╗ ██████╗  ██████╗ ██╗   ██╗████████╗
██╔════╝██╔════╝ ██╔═══██╗██║   ██║╚══██╔══╝
███████╗██║      ██║   ██║██║   ██║   ██║   
╚════██║██║      ██║   ██║██║   ██║   ██║   
███████║╚██████╗ ╚██████╔╝╚██████╔╝   ██║   
╚══════╝ ╚═════╝  ╚═════╝  ╚═════╝    ╚═╝
`;

export default function Home() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const healthCheck = useQuery({
    queryKey: ["healthCheck"],
    queryFn: () => trpc.healthCheck.query(),
  });

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/10">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]" />
      </div>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto max-w-6xl px-4 pt-24 pb-16">
          <div className="flex flex-col items-center text-center space-y-8">
            {/* ASCII Art - Treated as a design texture */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2">
              <pre className="font-mono text-[12px] leading-2.5 text-foreground/30 dark:text-foreground">
                {TITLE_TEXT}
              </pre>
            </div>

            <div className="max-w-3xl space-y-4 pt-6">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/60">
                Master Your Market.
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
                The intelligent research platform for modern sales teams. Turn
                data into actionable account plans in seconds, not hours.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full justify-center">
              {session ? (
                <Button
                  size="lg"
                  onClick={() => router.push("/dashboard")}
                  className="rounded-full px-8 h-12 text-base shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
                >
                  Launch Console <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => router.push("/login")}
                    className="rounded-full px-8 h-12 text-base shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
                  >
                    Start Researching
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 h-12 text-base border-border/60 hover:bg-muted/50"
                  >
                    View Demo
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Dashboard Preview / Code Section */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <div className="relative rounded-xl border border-border/50 bg-background/50 shadow-2xl backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 flex w-full items-center gap-1.5 border-b border-border/50 bg-muted/30 p-4">
              <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="h-3 w-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
              <div className="ml-4 text-xs text-muted-foreground font-mono">
                agent_workflow.ts
              </div>
            </div>
            <div className="p-8 pt-16 font-mono text-sm overflow-x-auto">
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <span className="text-purple-500">const</span>{" "}
                  <span className="text-blue-500">session</span> ={" "}
                  <span className="text-purple-500">await</span>{" "}
                  scout.create_research_session();
                </div>
                <div>
                  <span className="text-slate-500">
                    // AI agents scan public data sources
                  </span>
                  <br />
                  <span className="text-purple-500">const</span>{" "}
                  <span className="text-blue-500">insights</span> ={" "}
                  <span className="text-purple-500">await</span>{" "}
                  agent.analyze_market(
                  <span className="text-emerald-600">"Target Corp"</span>);
                </div>
                <div className="pl-4 border-l-2 border-primary/20 my-4">
                  <span className="text-slate-500">Output: </span>
                  <span className="text-emerald-600">
                    "Identified 3 key expansion opportunities in Q4..."
                  </span>
                </div>
                <div>
                  <span className="text-purple-500">return</span>{" "}
                  plan.generate(insights);
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section className="container mx-auto max-w-6xl px-4 py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(200px,auto)]">
            {/* Main Feature - Wide */}
            <Card className="md:col-span-2 p-8 flex flex-col justify-between overflow-hidden group border-border/50 hover:border-border transition-colors bg-gradient-to-br from-background to-muted/30">
              <div className="space-y-2 relative z-10">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <Search />
                </div>
                <h3 className="text-2xl font-semibold tracking-tight">
                  Deep Dive Research
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Our autonomous agents scrape, parse, and synthesize millions
                  of data points to give you a comprehensive view of your
                  target.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Search className="w-64 h-64 -mb-12 -mr-12" />
              </div>
            </Card>

            <Card className="md:row-span-2 p-8 border-border/50 hover:border-border transition-colors bg-gradient-to-b from-background to-muted/30">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <BarChart3 />
              </div>
              <h3 className="text-xl font-semibold tracking-tight mb-2">
                Strategic Planning
              </h3>
              <p className="text-muted-foreground mb-8">
                Convert raw data into structured, exportable account plans
                automatically.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Company Overview</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Automated SWOT Analysis</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Market Competitor Analysis</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border/50 hover:border-border transition-colors hover:bg-muted/20">
              <Zap className="w-8 h-8 mb-4 text-amber-500" />
              <h3 className="font-semibold mb-1">Real-time Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Compare response of multiple sources and gives best results
              </p>
            </Card>

            <Card className="p-6 border-border/50 hover:border-border transition-colors hover:bg-muted/20">
              <MessageSquare className="w-8 h-8 mb-4 text-blue-500" />
              <h3 className="font-semibold mb-1">Natural Tone</h3>
              <p className="text-sm text-muted-foreground">
                Talk to your research assistant like a colleague.
              </p>
            </Card>
          </div>
        </section>

        <section className="container mx-auto max-w-4xl px-4 py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-6">
            Ready to modernize your workflow?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join the forward-thinking teams using Scout to drive
            intelligence-led growth.
          </p>
          <Button
            size="lg"
            onClick={() => router.push(session ? "/dashboard" : "/login")}
            className="rounded-full h-12 px-8"
          >
            Get Started for Free
          </Button>
        </section>
      </main>

      <footer className="border-t border-border/40 py-12 bg-muted/10">
        <div className="container mx-auto max-w-6xl px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
            <Terminal className="w-4 h-4" />
            <span>Built by Manish</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="https://www.github.com/manish-lal12"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
