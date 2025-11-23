import { router, protectedProcedure } from "../index";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@agentic-company-researcher/db";

export const findingsRouter = router({
  list: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the session and fetch findings
      const session = await prisma.researchSession.findUnique({
        where: { id: input.sessionId },
        select: { userId: true },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      if (session.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to access this session",
        });
      }

      const findings = await prisma.researchFinding.findMany({
        where: { sessionId: input.sessionId },
        orderBy: { category: "asc" },
      });

      return findings;
    }),

  create: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        companyId: z.string(),
        category: z.string(),
        title: z.string(),
        content: z.string(),
        source: z.string().optional(),
        confidence: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user owns the session before saving finding
      const session = await prisma.researchSession.findUnique({
        where: { id: input.sessionId },
        select: { userId: true },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      if (session.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to access this session",
        });
      }

      const finding = await prisma.researchFinding.create({
        data: {
          sessionId: input.sessionId,
          companyId: input.companyId,
          category: input.category,
          title: input.title,
          content: input.content,
          source: input.source || null,
          confidence: input.confidence ?? 0.8,
        },
      });

      return finding;
    }),

  delete: protectedProcedure
    .input(z.object({ findingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns the finding before deleting
      const finding = await prisma.researchFinding.findUnique({
        where: { id: input.findingId },
        include: { session: { select: { userId: true } } },
      });

      if (!finding) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Finding not found",
        });
      }

      if (finding.session.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this finding",
        });
      }

      await prisma.researchFinding.delete({
        where: { id: input.findingId },
      });

      return { success: true };
    }),
});
