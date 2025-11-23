import { router, protectedProcedure } from "../index";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@agentic-company-researcher/db";
import { chat } from "../services/llm";
import { PROMPTS, LLM_CONFIG } from "../constants/systemPrompts";

// Simple regex to extract findings from LLM response
function extractFindings(content: string): Array<{
  category: string;
  title: string;
  confidence: number;
}> {
  const findings: Array<{
    category: string;
    title: string;
    confidence: number;
  }> = [];

  // Match patterns like "**Category:** Title (confidence: 0.8)"
  const pattern = /\*\*([^*]+)\*\*:\s*([^(]+)\s*\(confidence:\s*([\d.]+)\)/gi;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    if (match[1] && match[2] && match[3]) {
      findings.push({
        category: match[1].trim(),
        title: match[2].trim(),
        confidence: parseFloat(match[3]) || 0.8,
      });
    }
  }

  // If no structured findings found, extract mentions of key words
  if (findings.length === 0) {
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 10);
    sentences.slice(0, 3).forEach((sentence) => {
      findings.push({
        category: "General",
        title: sentence.trim().substring(0, 100),
        confidence: 0.6,
      });
    });
  }

  return findings;
}

export const agentRouter = router({
  askQuestion: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        question: z.string(),
        companyId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user owns the session
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

      // Get or verify company exists
      let companyId = input.companyId;
      if (!companyId) {
        // Try to find the first company (or use a default if available)
        const company = await prisma.company.findFirst();
        if (!company) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "No company found for research. Please create or select a company first.",
          });
        }
        companyId = company.id;
      }

      // Save user message
      const userMessage = await prisma.conversationMessage.create({
        data: {
          sessionId: input.sessionId,
          content: input.question,
          role: "user",
          timestamp: new Date(),
        },
      });

      // Call LLM service to generate response
      const llmResult = await chat({
        messages: [
          {
            role: "system",
            content: PROMPTS.RESEARCH_ASSISTANT,
          },
          {
            role: "user",
            content: input.question,
          },
        ],
        temperature: LLM_CONFIG.TEMPERATURE.RESEARCH,
      });

      const assistantResponse = llmResult.text;

      // Save assistant message
      const assistantMessage = await prisma.conversationMessage.create({
        data: {
          sessionId: input.sessionId,
          content: assistantResponse,
          role: "assistant",
          timestamp: new Date(),
        },
      });

      // Extract findings from response
      const extractedFindings = extractFindings(assistantResponse);

      // Save findings to database
      const savedFindings = await Promise.all(
        extractedFindings.map((finding) =>
          prisma.researchFinding.create({
            data: {
              sessionId: input.sessionId,
              companyId,
              category: finding.category,
              title: finding.title,
              content: assistantResponse.substring(0, 500),
              confidence: finding.confidence,
            },
          })
        )
      );

      return {
        userMessage,
        assistantMessage,
        findings: savedFindings,
      };
    }),

  getStatus: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the session
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

      // Get session status from database
      const sessionData = await prisma.researchSession.findUnique({
        where: { id: input.sessionId },
        select: {
          status: true,
          _count: { select: { messages: true, findings: true } },
        },
      });

      return {
        status: sessionData?.status || "active",
        messageCount: sessionData?._count.messages || 0,
        findingCount: sessionData?._count.findings || 0,
      };
    }),

  cancel: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns the session
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

      // Cancel ongoing agent task by updating session status
      const updated = await prisma.researchSession.update({
        where: { id: input.sessionId },
        data: { status: "cancelled" },
      });

      return { cancelled: true, status: updated.status };
    }),

  transcribeAudio: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        audioBase64: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user owns the session
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

      try {
        // Convert base64 audio to buffer
        const audioBuffer = Buffer.from(input.audioBase64, "base64");

        // Call LLM service with audio transcription
        // Using the chat function with a system prompt for transcription
        const transcriptionResult = await chat({
          messages: [
            {
              role: "system",
              content:
                "You are a transcription assistant. Transcribe the audio accurately.",
            },
            {
              role: "user",
              content: `[Audio data: ${audioBuffer.length} bytes] Please transcribe this audio.`,
            },
          ],
          temperature: 0.3,
        });

        // For a real implementation, you would use a speech-to-text service like:
        // - OpenAI Whisper API
        // - Google Cloud Speech-to-Text
        // - Azure Speech Services
        // For now, return a placeholder
        const transcribedText =
          transcriptionResult.text ||
          "Audio transcription service not fully configured";

        return {
          transcribedText,
          audioLength: audioBuffer.length,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to transcribe audio",
        });
      }
    }),
});
