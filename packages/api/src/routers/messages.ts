import { router, protectedProcedure } from "../index";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@agentic-company-researcher/db";

export const messagesRouter = router({
  list: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the session and fetch messages
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

      const messages = await prisma.conversationMessage.findMany({
        where: { sessionId: input.sessionId },
        orderBy: { timestamp: "asc" },
      });

      return messages;
    }),

  send: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        content: z.string(),
        role: z.enum(["user", "assistant"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user owns the session before saving
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

      const message = await prisma.conversationMessage.create({
        data: {
          sessionId: input.sessionId,
          content: input.content,
          role: input.role,
          timestamp: new Date(),
        },
      });

      return message;
    }),

  delete: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns the message before deleting
      const message = await prisma.conversationMessage.findUnique({
        where: { id: input.messageId },
        include: { session: { select: { userId: true } } },
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      if (message.session.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this message",
        });
      }

      await prisma.conversationMessage.delete({
        where: { id: input.messageId },
      });

      return { success: true };
    }),
});
