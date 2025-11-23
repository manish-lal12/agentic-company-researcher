import { router, protectedProcedure } from "../index";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@agentic-company-researcher/db";

export const researchRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    // Fetch research sessions for user from database
    const sessions = await prisma.researchSession.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        messages: true,
        findings: true,
        accountPlan: true,
      },
      orderBy: { startedAt: "desc" },
    });
    return sessions;
  }),

  create: protectedProcedure
    .input(
      z.object({
        companyName: z.string(),
        topic: z.string(),
        mode: z.enum(["chat", "voice"]).default("chat"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create new research session with user association
      const session = await prisma.researchSession.create({
        data: {
          userId: ctx.session.user.id,
          mode: input.mode,
          status: "active",
        },
      });
      return session;
    }),

  get: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify session belongs to user before returning
      const session = await prisma.researchSession.findUnique({
        where: { id: input.sessionId },
        include: {
          messages: { orderBy: { timestamp: "asc" } },
          findings: true,
          accountPlan: { include: { sections: { orderBy: { order: "asc" } } } },
        },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Research session not found",
        });
      }

      if (session.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to access this session",
        });
      }

      return session;
    }),
});
