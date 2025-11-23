import { protectedProcedure, publicProcedure, router } from "../index";
import { researchRouter } from "./research";
import { messagesRouter } from "./messages";
import { findingsRouter } from "./findings";
import { companyRouter } from "./company";
import { accountPlanRouter } from "./accountPlan";
import { agentRouter } from "./agent";

export const appRouter = router({
  // Health check
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),

  // Authentication check
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),

  // Feature routers
  research: researchRouter,
  messages: messagesRouter,
  findings: findingsRouter,
  company: companyRouter,
  accountPlan: accountPlanRouter,
  agent: agentRouter,
});

export type AppRouter = typeof appRouter;
