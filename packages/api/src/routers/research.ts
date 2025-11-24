import { router, protectedProcedure } from "../index";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@agentic-company-researcher/db";
import { chat } from "../services/llm";
import { PROMPTS, LLM_CONFIG } from "../constants/systemPrompts";

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
        companyName: z.string().optional(),
        topic: z.string().optional(),
        mode: z.enum(["chat", "voice"]).default("chat"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Generate a placeholder company name if not provided
        const companyName =
          input.companyName || `Research Session ${Date.now()}`;

        // Create or get company
        let company = await prisma.company.findFirst({
          where: { name: companyName },
        });

        if (!company) {
          company = await prisma.company.create({
            data: {
              name: companyName,
            },
          });
        }

        // Create new research session with user association
        const session = await prisma.researchSession.create({
          data: {
            userId: ctx.session.user.id,
            mode: input.mode,
            status: "active",
            companyName: input.companyName || null, // Keep null if not provided
            name: input.topic ? `Research: ${input.topic}` : `Research Session`, // Initial name, can be updated later
          },
        });

        // Create account plan linked to the company and session
        try {
          // Create account plan WITHOUT nested sections first
          const plan = await prisma.accountPlan.create({
            data: {
              userId: ctx.session.user.id,
              companyId: company.id,
              sessionId: session.id,
              title: `Account Plan - ${companyName}`,
            },
          });
          console.log("✓ Account plan created:", {
            planId: plan.id,
            sessionId: session.id,
          });

          // Now create sections separately
          try {
            const sections = await prisma.planSection.createMany({
              data: [
                {
                  planId: plan.id,
                  title: "Executive Summary",
                  content: "",
                  order: 1,
                },
                {
                  planId: plan.id,
                  title: "Company Overview",
                  content: "",
                  order: 2,
                },
                {
                  planId: plan.id,
                  title: "Key Challenges",
                  content: "",
                  order: 3,
                },
                {
                  planId: plan.id,
                  title: "Proposed Solutions",
                  content: "",
                  order: 4,
                },
                {
                  planId: plan.id,
                  title: "Implementation Timeline",
                  content: "",
                  order: 5,
                },
                {
                  planId: plan.id,
                  title: "Expected Outcomes",
                  content: "",
                  order: 6,
                },
              ],
            });
            console.log("✓ Plan sections created:", sections.count);
          } catch (sectionError) {
            console.error("✗ Failed to create plan sections:", sectionError);
            // Don't throw here - at least the plan was created
          }
        } catch (planError) {
          console.error("✗ Failed to create account plan:", planError);
          console.error("Session details:", {
            sessionId: session.id,
            userId: ctx.session.user.id,
            companyId: company.id,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create account plan for session",
          });
        }

        return session;
      } catch (error) {
        console.error("Error in research.create:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create research session",
        });
      }
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

  getReport: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify session belongs to user
      const session = await prisma.researchSession.findUnique({
        where: { id: input.sessionId },
        select: {
          userId: true,
          messages: true,
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

      // Get company name from messages
      const firstUserMessage = session.messages.find(
        (m: any) => m.role === "user"
      );
      const companyNameMatch = firstUserMessage?.content.match(
        /(?:tell me about|research|find info on|analyze|about)\s+([A-Z][A-Za-z0-9\s&.-]+?)(?:\.|,|$)/i
      );
      const companyName = companyNameMatch?.[1] || "Unknown Company";

      // If account plan exists with populated sections, use those instead of generating new
      if (
        session.accountPlan &&
        session.accountPlan.sections &&
        session.accountPlan.sections.length > 0
      ) {
        console.log("Generating report from existing account plan sections");

        // Build report from account plan sections
        const reportContent = session.accountPlan.sections
          .map((section: any) => {
            const header = `## ${section.title}`;

            // Only show section if it has meaningful content (not just empty/pending)
            const hasContent =
              section.content &&
              section.content.trim().length > 0 &&
              !section.content.includes("Research in progress") &&
              section.confidence > 0;

            if (!hasContent) {
              // Skip empty sections in report (they'll show in UI panel as "Pending")
              return null;
            }

            const content = section.content;
            const confidence = section.confidence
              ? `\n\n*Confidence: ${Math.round(section.confidence * 100)}%*`
              : "";
            const dataPoints =
              section.dataPoints && section.dataPoints.length > 0
                ? `\n\n**Key Data Points:**\n${section.dataPoints
                    .map((dp: string) => `- ${dp}`)
                    .join("\n")}`
                : "";
            const sources =
              section.sources && section.sources.length > 0
                ? `\n\n**Sources:** ${section.sources.join(", ")}`
                : "";

            return `${header}\n${content}${dataPoints}${sources}${confidence}`;
          })
          .filter((s: string | null) => s !== null) // Remove null sections
          .join("\n\n");

        return {
          content: reportContent || "No report could be generated",
          findingCount: session.findings.length,
          companyName,
        };
      }

      // Fallback: Generate structured report using LLM if no plan sections exist
      // Build context from conversation and findings
      const conversationSummary = session.messages
        .slice(-20)
        .map((m: any) => `${m.role}: ${m.content}`)
        .join("\n\n");

      const findingsSummary = session.findings
        .slice(0, 50)
        .map(
          (f: any) =>
            `- **${f.category}**: ${f.title} (${f.content.substring(
              0,
              100
            )}...)`
        )
        .join("\n");

      // Generate structured report using LLM
      const reportPrompt = `Based on the following research about ${companyName}, generate a comprehensive structured report with ONLY these sections:

1. Company Overview
2. Products & Services
3. Key Stakeholders
4. Financial Position
5. Market & Competition
6. SWOT Analysis
7. Strategic Opportunities
8. Risks & Considerations
9. Recommended Strategy
10. Research Notes

## Research Context
### Recent Conversation
${conversationSummary}

### Findings Summary
${findingsSummary}

## Instructions
- Generate content for each section based on the research above
- Use markdown format with ## headers for each section
- Keep each section focused and actionable
- Include specific data and examples from the research
- Do NOT include chat history or conversational elements
- Do NOT create any sections other than the 10 listed above
- Write in professional business tone
- For Research Notes, include confidence levels and data gaps

Output ONLY the structured report with the 10 sections.`;

      try {
        const reportResponse = await chat({
          messages: [
            {
              role: "system" as const,
              content: PROMPTS.ACCOUNT_PLAN_GENERATOR,
            },
            {
              role: "user" as const,
              content: reportPrompt,
            },
          ],
          temperature: LLM_CONFIG.TEMPERATURE.RESEARCH,
        });

        const reportContent = reportResponse.text;

        return {
          content: reportContent || "No report could be generated",
          findingCount: session.findings.length,
          companyName,
        };
      } catch (error) {
        console.error("Failed to generate report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate structured report",
        });
      }
    }),

  generateAccountPlan: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        companyName: z.string(),
        useCase: z.string().optional(), // e.g., "partnership", "investment", "competitor analysis"
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify session belongs to user
      const session = await prisma.researchSession.findUnique({
        where: { id: input.sessionId },
        select: {
          userId: true,
          messages: true,
          findings: true,
          structuredData: true,
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

      // Get or create company
      let company = await prisma.company.findFirst({
        where: { name: input.companyName },
      });

      if (!company) {
        company = await prisma.company.create({
          data: {
            name: input.companyName,
            description: `Researched on ${new Date().toLocaleDateString()}`,
          },
        });
      }

      // Delete existing plan if present (one plan per session)
      const existingPlan = await prisma.accountPlan.findFirst({
        where: { sessionId: input.sessionId },
      });

      if (existingPlan) {
        await prisma.accountPlan.delete({
          where: { id: existingPlan.id },
        });
      }

      // USE STRUCTURED DATA if available, otherwise generate from LLM
      const structuredData =
        (session.structuredData as Record<
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
        >) || {};

      let sections: Array<{
        title: string;
        content: string;
        order: number;
        confidence?: number;
        dataPoints?: string[];
        sources?: string[];
        conflicts?: Array<{
          claim: string;
          sources: string[];
          resolution?: string;
        }>;
      }> = [];

      // If structured data exists, use it directly to create plan sections
      if (Object.keys(structuredData).length > 0) {
        console.log(
          "Creating account plan sections from structured data:",
          Object.keys(structuredData).length,
          "sections"
        );

        // Include ALL sections from structured data (even if empty/pending)
        sections = Object.entries(structuredData).map(([key, data], idx) => ({
          title: key,
          content: data.content || "Research in progress...",
          order: idx,
          confidence: data.confidence || 0,
          dataPoints: data.dataPoints || [],
          sources: data.sources || [],
          conflicts: data.conflicts || [],
        }));
      } else {
        // Fallback: Generate plan from LLM if no structured data
        console.log("No structured data found, generating plan from LLM");

        const { chat } = await import("../services/llm");
        const { PROMPTS, LLM_CONFIG } = await import(
          "../constants/systemPrompts"
        );

        const conversationSummary = session.messages
          .slice(-20)
          .map((m: any) => `${m.role}: ${m.content}`)
          .join("\n\n");

        const findingsSummary = session.findings
          .map(
            (f: any) =>
              `**${f.category}**: ${f.title} - ${f.content.substring(0, 200)}`
          )
          .join("\n");

        const planGenerationPrompt = `${PROMPTS.ACCOUNT_PLAN_GENERATOR}

## Company Information
- Company: ${input.companyName}
- Use Case: ${input.useCase || "General strategic planning"}

## Recent Conversation
${conversationSummary}

## Research Findings Summary
${findingsSummary}

Please generate a comprehensive account plan for this company with all required sections. Make it specific and actionable based on the research findings above.`;

        const planResponse = await chat({
          messages: [
            {
              role: "system" as const,
              content: planGenerationPrompt,
            },
            {
              role: "user" as const,
              content: `Generate a detailed account plan for ${input.companyName}`,
            },
          ],
          temperature: LLM_CONFIG.TEMPERATURE.RESEARCH,
        });

        // Parse plan into sections (simple split by ## headers)
        const planContent = planResponse.text;
        sections = planContent
          .split(/^##\s+/m)
          .filter((s) => s.trim().length > 0)
          .map((section, idx) => {
            const lines = section.split("\n");
            const title = lines[0]?.trim() || `Section ${idx + 1}`;
            const content = lines.slice(1).join("\n").trim();
            return { title, content, order: idx };
          });
      }

      // Create new account plan with sections
      const accountPlan = await prisma.accountPlan.create({
        data: {
          userId: ctx.session.user.id,
          companyId: company.id,
          sessionId: input.sessionId,
          title: `Account Plan: ${input.companyName}`,
          sections: {
            create: sections.map((s) => ({
              title: s.title,
              content: s.content,
              order: s.order,
              editable: true,
              confidence: s.confidence || 0.5,
              dataPoints: s.dataPoints || [],
              sources: s.sources || [], // NEW: Include sources
              conflicts: s.conflicts ? JSON.stringify(s.conflicts) : undefined, // NEW: Include conflicts
            })),
          },
        },
        include: {
          sections: { orderBy: { order: "asc" } },
          company: true,
        },
      });

      return accountPlan;
    }),

  syncStructuredDataToPlan: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify session belongs to user
      const session = await prisma.researchSession.findUnique({
        where: { id: input.sessionId },
        include: {
          accountPlan: {
            include: { sections: { orderBy: { order: "asc" } } },
          },
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

      // If no account plan, return early
      if (!session.accountPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No account plan found for this session",
        });
      }

      // Get structured data from session
      const structuredData =
        (session.structuredData as Record<
          string,
          {
            title: string;
            content: string;
            confidence: number;
            dataPoints: string[];
          }
        >) || {};

      const updatesToApply: Array<{
        id: string;
        content: string;
        confidence: number;
        dataPoints: string[];
      }> = [];

      // Match structured data with existing plan sections
      for (let i = 0; i < session.accountPlan.sections.length; i++) {
        const section = session.accountPlan.sections[i];
        if (!section) continue;

        const sectionTitle = section?.title || "";

        // Look for matching data in structuredData
        // Try exact match first, then fuzzy match
        let matchingData = structuredData[sectionTitle];

        // If no exact match, try to find by similar title
        if (!matchingData) {
          const sectionLower = sectionTitle.toLowerCase().trim();
          for (const [dataKey, dataValue] of Object.entries(structuredData)) {
            if (dataKey.toLowerCase().trim() === sectionLower) {
              matchingData = dataValue;
              break;
            }
          }
        }

        if (matchingData && matchingData.content) {
          updatesToApply.push({
            id: section.id,
            content: matchingData.content,
            confidence: matchingData.confidence || 0.5,
            dataPoints: matchingData.dataPoints || [],
          });
        }
      }

      // Apply all updates in parallel
      if (updatesToApply.length > 0) {
        console.log(
          "Applying",
          updatesToApply.length,
          "updates to plan sections"
        );
        await Promise.all(
          updatesToApply.map((update) =>
            prisma.planSection.update({
              where: { id: update.id },
              data: {
                content: update.content,
              },
            })
          )
        );
      } else {
        console.warn(
          "No matching sections found to update. Structured data keys:",
          Object.keys(structuredData),
          "Section titles:",
          session.accountPlan.sections.map((s) => s.title)
        );
      }

      // Return updated plan
      const updatedPlan = await prisma.accountPlan.findUnique({
        where: { id: session.accountPlan.id },
        include: {
          sections: { orderBy: { order: "asc" } },
          company: true,
        },
      });

      return {
        success: true,
        updatedSections: updatesToApply.length,
        plan: updatedPlan,
      };
    }),

  getProgress: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the session
      const session = await prisma.researchSession.findUnique({
        where: { id: input.sessionId },
        include: {
          messages: true,
          findings: true,
          accountPlan: {
            include: { sections: true },
          },
        },
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

      // Calculate progress metrics
      const uniqueFindings = new Set(
        session.findings.map((f: any) => f.category)
      ).size;

      const accountPlan = session.accountPlan;
      const sectionsIdentified = accountPlan ? accountPlan.sections.length : 0;
      const sectionsComplete = accountPlan
        ? accountPlan.sections.filter((s: any) => s.content.length > 100).length
        : 0;

      const researchComplete = session.findings.length > 0;
      const planGenerated = !!accountPlan;

      return {
        researchActive: session.status === "active",
        messagesExchanged: session.messages.length,
        findingsIdentified: session.findings.length,
        uniqueCategories: uniqueFindings,
        researchComplete,
        planGenerated,
        sectionsIdentified,
        sectionsComplete,
        completionPercentage:
          sectionsIdentified > 0
            ? Math.round((sectionsComplete / sectionsIdentified) * 100)
            : 0,
        estimatedNextStep: getEstimatedNextStep(
          researchComplete,
          planGenerated,
          sectionsComplete,
          sectionsIdentified
        ),
        sessionStartedAt: session.startedAt,
      };
    }),

  getActivitySummary: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the session
      const session = await prisma.researchSession.findUnique({
        where: { id: input.sessionId },
        include: {
          messages: true,
          findings: true,
          accountPlan: true,
        },
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

      const userMessages = session.messages.filter(
        (m: any) => m.role === "user"
      );
      const assistantMessages = session.messages.filter(
        (m: any) => m.role === "assistant"
      );

      const findingsByCategory = session.findings.reduce(
        (acc: Record<string, number>, finding: any) => {
          acc[finding.category] = (acc[finding.category] || 0) + 1;
          return acc;
        },
        {}
      );

      const sessionDuration =
        new Date().getTime() - new Date(session.startedAt).getTime();

      return {
        totalInteractions: userMessages.length + assistantMessages.length,
        userQuestions: userMessages.length,
        assistantResponses: assistantMessages.length,
        findingsIdentified: session.findings.length,
        findingsByCategory,
        planGenerated: !!session.accountPlan,
        sessionDurationMs: sessionDuration,
        sessionDurationMinutes: Math.round(sessionDuration / 60000),
        averageResponseTime:
          assistantMessages.length > 0
            ? sessionDuration / assistantMessages.length
            : 0,
      };
    }),

  extractCompanyName: protectedProcedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ input }) => {
      // Use LLM to extract company name from user input
      const extractionPrompt = `You are an expert at extracting company names from user queries.
      
Analyze the following user input and extract the company name being researched. Return ONLY the company name if found, or an empty string if no clear company name is mentioned.

User input: "${input.text}"

Rules:
- Return only the company name, nothing else
- If multiple companies are mentioned, return the primary one
- Do not include words like "company", "Inc", "Ltd", etc. unless they are part of the official name
- If it's clearly not a company name (e.g., just general questions), return empty string`;

      try {
        const response = await chat({
          messages: [{ role: "user", content: extractionPrompt }],
          temperature: LLM_CONFIG.TEMPERATURE.CONSERVATIVE,
        });

        const companyName = response.text.trim();
        return {
          companyName: companyName.length > 0 ? companyName : null,
        };
      } catch (error) {
        console.error("Failed to extract company name:", error);
        return { companyName: null };
      }
    }),

  updateSessionCompanyName: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        companyName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify session belongs to user
      const session = await prisma.researchSession.findUnique({
        where: { id: input.sessionId },
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

      // Only update if not already set
      if (session.companyName) {
        return session;
      }

      // Create or get company
      let company = await prisma.company.findFirst({
        where: { name: input.companyName },
      });

      if (!company) {
        company = await prisma.company.create({
          data: {
            name: input.companyName,
          },
        });
      }

      // Get the account plan for this session
      let accountPlan = await prisma.accountPlan.findFirst({
        where: {
          sessionId: input.sessionId,
          userId: ctx.session.user.id,
        },
      });

      // If account plan exists with different company, create a new one
      if (accountPlan && accountPlan.companyId !== company.id) {
        // Delete old plan and sections
        await prisma.planSection.deleteMany({
          where: { planId: accountPlan.id },
        });
        await prisma.accountPlan.delete({
          where: { id: accountPlan.id },
        });
      }

      // Create new account plan if needed
      if (!accountPlan || accountPlan.companyId !== company.id) {
        accountPlan = await prisma.accountPlan.create({
          data: {
            userId: ctx.session.user.id,
            companyId: company.id,
            sessionId: input.sessionId,
            title: `Account Plan - ${input.companyName}`,
          },
        });

        // Create sections separately
        try {
          await prisma.planSection.createMany({
            data: [
              {
                planId: accountPlan.id,
                title: "Executive Summary",
                content: "",
                order: 1,
              },
              {
                planId: accountPlan.id,
                title: "Company Overview",
                content: "",
                order: 2,
              },
              {
                planId: accountPlan.id,
                title: "Key Challenges",
                content: "",
                order: 3,
              },
              {
                planId: accountPlan.id,
                title: "Proposed Solutions",
                content: "",
                order: 4,
              },
              {
                planId: accountPlan.id,
                title: "Implementation Timeline",
                content: "",
                order: 5,
              },
              {
                planId: accountPlan.id,
                title: "Expected Outcomes",
                content: "",
                order: 6,
              },
            ],
          });
        } catch (sectionError) {
          console.error("Failed to create plan sections:", sectionError);
        }
      }

      // Update session with company name
      const updatedSession = await prisma.researchSession.update({
        where: { id: input.sessionId },
        data: {
          companyName: input.companyName,
          name: `Research: ${input.companyName}`,
        },
      });

      return updatedSession;
    }),

  listAccountPlans: protectedProcedure
    .input(z.object({ sessionId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      // Fetch account plans for user
      const plans = await prisma.accountPlan.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.sessionId && { sessionId: input.sessionId }),
        },
        include: {
          company: true,
          sections: { orderBy: { order: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      });

      return plans;
    }),

  updateAccountPlanSections: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        sessionId: z.string().optional(),
        prompt: z.string(),
        currentContent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify plan exists and belongs to user
      const plan = await prisma.accountPlan.findUnique({
        where: { id: input.planId },
        include: { sections: true, session: true, company: true },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account plan not found",
        });
      }

      if (plan.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to access this plan",
        });
      }

      // Use provided currentContent or build from plan sections
      let contentToUpdate = input.currentContent;
      if (!contentToUpdate) {
        contentToUpdate = plan.sections
          .map((s: any) => `## ${s.title}\n${s.content}`)
          .join("\n\n");
      }

      // Try to fetch session for additional context if sessionId provided
      let researchContext = "";
      let findingsContext = "";

      if (input.sessionId) {
        try {
          const session = await prisma.researchSession.findUnique({
            where: { id: input.sessionId },
            include: { messages: true, findings: true },
          });

          if (session) {
            researchContext = session.messages
              .slice(-20)
              .map((m: any) => `${m.role}: ${m.content}`)
              .join("\n\n");

            findingsContext = session.findings
              .slice(0, 30)
              .map((f: any) => `- ${f.category}: ${f.title}`)
              .join("\n");
          }
        } catch (error) {
          console.error("Failed to fetch session context:", error);
        }
      }

      // Build update prompt - CHANGED to only update specific sections
      const updatePrompt = `You are an expert account planner. Based on the user's request, update ONLY the relevant sections of an account plan for ${
        plan.company?.name || "the company"
      }.

## Current Account Plan
${contentToUpdate}

${
  researchContext
    ? `## Research Context
### Recent Research Discussion
${researchContext}

### Key Findings
${findingsContext}`
    : ""
}

## User Request
${input.prompt}

## CRITICAL INSTRUCTIONS - Selective Update
- Identify which specific sections need to be updated based on the user's request
- Return ONLY the sections that need updating (not the entire plan)
- Keep each section's structure with ## header
- Make updates specific and actionable
- DO NOT return sections that don't need updating

## Output Format
Return ONLY the updated sections in this format:
## Section Title
Updated content here...

## Another Section Title (if needed)
More updated content...

Only include sections that need changes based on the user's request.`;

      try {
        const response = await chat({
          messages: [
            {
              role: "system" as const,
              content: PROMPTS.ACCOUNT_PLAN_GENERATOR,
            },
            {
              role: "user" as const,
              content: updatePrompt,
            },
          ],
          temperature: LLM_CONFIG.TEMPERATURE.RESEARCH,
        });

        // Parse updated content into sections
        let updatedContent = response.text;

        // Clean up the response - extract only markdown sections starting with ##
        const markdownMatch = updatedContent.match(/(##\s+[\s\S]*?(?=##|$))/g);
        if (markdownMatch && markdownMatch.length > 0) {
          updatedContent = markdownMatch.join("\n");
        }

        const updatedSections = updatedContent
          .split(/^##\s+/m)
          .filter((s) => s.trim().length > 0)
          .map((section) => {
            const lines = section.split("\n");
            const title = lines[0]?.trim() || "";
            const content = lines.slice(1).join("\n").trim();
            return { title, content };
          })
          .filter((s) => s.title && s.content); // Only include sections with both title and content

        // Update ONLY the sections that were returned by LLM
        // Keep existing sections unchanged
        for (const updatedSection of updatedSections) {
          // Find existing section by title
          const existingSection = plan.sections.find(
            (s: any) =>
              s.title.toLowerCase().trim() ===
              updatedSection.title.toLowerCase().trim()
          );

          if (existingSection) {
            // Update existing section
            await prisma.planSection.update({
              where: { id: existingSection.id },
              data: {
                content: updatedSection.content,
                editable: true,
              },
            });
          } else {
            // Create new section if it doesn't exist
            const maxOrder =
              plan.sections.length > 0
                ? Math.max(...plan.sections.map((s: any) => s.order || 0))
                : -1;

            await prisma.planSection.create({
              data: {
                planId: input.planId,
                title: updatedSection.title,
                content: updatedSection.content,
                order: maxOrder + 1,
                editable: true,
              },
            });
          }
        }

        // Return updated sections
        const updatedPlan = await prisma.accountPlan.findUnique({
          where: { id: input.planId },
          include: { sections: { orderBy: { order: "asc" } } },
        });

        return {
          success: true,
          sections: updatedPlan?.sections || [],
          updatedContent,
        };
      } catch (error) {
        console.error("Failed to update plan sections:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update plan sections",
        });
      }
    }),

  generateSessionName: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify session belongs to user
      const session = await prisma.researchSession.findUnique({
        where: { id: input.sessionId },
        include: { messages: { take: 10 } },
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

      // If session already has a name, return it
      if (session.name) {
        return { success: true, name: session.name };
      }

      // Build context from recent messages
      const messageContext = session.messages
        .slice(-5)
        .map((m: any) => `${m.role}: ${m.content.substring(0, 100)}`)
        .join("\n");

      // Use LLM to generate a name from the conversation context
      const { chat } = await import("../services/llm");

      const response = await chat({
        messages: [
          {
            role: "system" as const,
            content:
              "You are a naming expert. Based on the research conversation, generate a concise, meaningful name for this research session (max 50 characters). Return ONLY the name, nothing else.",
          },
          {
            role: "user" as const,
            content: `Generate a name for this research session based on the conversation:\n${messageContext}`,
          },
        ],
        temperature: 0.5,
      });

      const generatedName = response.text.trim();

      // Update session with generated name
      const updated = await prisma.researchSession.update({
        where: { id: input.sessionId },
        data: { name: generatedName },
      });

      return { success: true, name: updated.name || generatedName };
    }),
});

function getEstimatedNextStep(
  researchComplete: boolean,
  planGenerated: boolean,
  sectionsComplete: number,
  totalSections: number
): string {
  if (!researchComplete) {
    return "Continue asking questions to gather research";
  }

  if (!planGenerated) {
    return "Generate an account plan from the research";
  }

  if (totalSections === 0) {
    return "Waiting for plan sections to load";
  }

  if (sectionsComplete < totalSections) {
    return `Review and update remaining ${
      totalSections - sectionsComplete
    } sections`;
  }

  return "Plan complete! You can export or make final adjustments";
}

export default researchRouter;
