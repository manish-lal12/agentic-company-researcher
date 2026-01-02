import { router, protectedProcedure } from "../index";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@agentic-company-researcher/db";
import { chat } from "../services/llm";
import { PROMPTS, LLM_CONFIG } from "../constants/systemPrompts";
import { ModelSelector } from "../services/agent/modelSelector";
import { ResponseSynthesizer } from "../services/agent/responseSynthesizer";
import { ModelDataSource } from "../services/dataSources/modelDataSource";

/**
 * Generate structured JSON data specifically for the right UI panel
 * This is separate from the conversational response
 * Ensures clean, actionable data consumption for the UI
 * Now includes sources and conflict detection
 */
async function generateStructuredPlanData(
  response: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<
  Record<
    string,
    {
      title: string;
      content: string;
      confidence: number;
      dataPoints: string[];
      sources: string[]; // NEW: Track where info came from
      conflicts?: Array<{
        claim: string;
        sources: string[];
        resolution?: string;
      }>; // NEW: Track conflicting information
    }
  >
> {
  // Build comprehensive conversation context for better extraction
  const fullConversationContext = conversationHistory
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n\n");

  const structuredDataPrompt = `You are extracting structured business intelligence data from research conversations for a UI panel display.

## FULL CONVERSATION HISTORY (Analyze ALL messages to extract company information)
${fullConversationContext}

## LATEST RESEARCH RESPONSE (Primary focus)
${response}

## REQUIRED OUTPUT SECTIONS
The UI panel REQUIRES data for ALL these 10 sections. Extract information from the ENTIRE conversation history above:

1. **Company Overview** - Basic company information, industry, headquarters, founding, mission
2. **Products & Services** - Product lines, service offerings, key solutions, pricing models
3. **Key Stakeholders** - Leadership, board members, key employees, investors, partners
4. **Financial Position** - Revenue, profitability, funding, valuation, financial metrics
5. **Market & Competition** - Market size, competitors, market share, positioning
6. **SWOT Analysis** - Strengths, Weaknesses, Opportunities, Threats
7. **Strategic Opportunities** - Growth areas, partnerships, expansion potential
8. **Risks & Considerations** - Challenges, threats, regulatory issues, market risks
9. **Recommended Strategy** - Strategic recommendations, action items, priorities
10. **Research Notes** - Additional observations, context, methodology notes

## EXTRACTION STRATEGY
- **Scan the ENTIRE conversation** from start to finish for relevant information
- **Aggregate information** across multiple messages (don't just use latest response)
- **Infer intelligently** from context when explicit data isn't available
- **Use conversation context** to fill gaps (e.g., if they're discussing "Tesla's products", infer it's an automotive/energy company)
- **Extract implicit information** (e.g., if discussing "CEO Elon Musk", add to Key Stakeholders)
- **Maintain data quality** - mark lower confidence when inferring

## OUTPUT FORMAT
Return ONLY valid JSON with ALL 10 sections. For each section:
- "content": 2-4 sentence summary with ACTUAL company information (never say "Limited information")
- "dataPoints": Array of specific facts extracted from conversation (minimum 2-3 per section)
- "confidence": 0.0-1.0 based on data availability (0.5+ if you found ANY relevant info)
- "sources": ["Conversation context", "User query", "Research response", etc.]
- "conflicts": Only if you found contradictory information

**CRITICAL**: If the conversation mentions a company name, you MUST populate at least 6-7 sections with confidence 0.6+.

Example structure:
{
  "Company Overview": {
    "content": "Tesla is an American electric vehicle and clean energy company founded in 2003, headquartered in Austin, Texas. The company designs and manufactures electric cars, battery energy storage systems, and solar products.",
    "dataPoints": ["Founded: 2003", "Headquarters: Austin, TX", "Industry: Automotive & Clean Energy", "CEO: Elon Musk"],
    "confidence": 0.9,
    "sources": ["Conversation context", "Research response"],
    "conflicts": []
  },
  ... (continue for ALL 10 sections with REAL data)
}

**NEVER return empty sections if company information exists in the conversation. Extract and populate ALL sections.**`;

  // Define all required sections upfront
  const ALL_SECTIONS = [
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
  ];

  // Initialize all sections with empty state
  const normalized: Record<
    string,
    {
      title: string;
      content: string;
      confidence: number;
      dataPoints: string[];
      sources: string[];
      conflicts?: Array<{
        claim: string;
        sources: string[];
        resolution?: string;
      }>;
    }
  > = {};

  // Pre-populate with empty sections
  ALL_SECTIONS.forEach((sectionTitle) => {
    normalized[sectionTitle] = {
      title: sectionTitle,
      content: "",
      confidence: 0,
      dataPoints: [],
      sources: [],
      conflicts: [],
    };
  });

  try {
    const result = await chat({
      messages: [
        {
          role: "system" as const,
          content:
            "You are a data extraction specialist. Return ONLY valid JSON. Do not include markdown formatting, code blocks, or explanations.",
        },
        {
          role: "user" as const,
          content: structuredDataPrompt,
        },
      ],
      temperature: 0.1, // Extremely low for reliable JSON
    });

    // Extract JSON from response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("No JSON found in structured data response");
      return normalized; // Return all sections even if extraction fails
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and normalize - UPDATE existing sections with LLM data
    for (const [section, data] of Object.entries(parsed)) {
      if (typeof data === "object" && data !== null) {
        const item = data as any;
        // Only update if section exists in our predefined list AND has meaningful content
        if (normalized[section]) {
          // Accept section if it has content OR dataPoints OR both
          const hasContent = item.content && item.content.trim().length > 0;
          const hasDataPoints =
            Array.isArray(item.dataPoints) && item.dataPoints.length > 0;

          if (hasContent || hasDataPoints) {
            normalized[section] = {
              title: section,
              content: String(item.content || "").substring(0, 800), // Increased from 300 to 800
              confidence: Math.min(Math.max(item.confidence ?? 0, 0), 1),
              dataPoints: Array.isArray(item.dataPoints)
                ? item.dataPoints.slice(0, 10).map(String) // Increased from 5 to 10
                : [],
              sources: Array.isArray(item.sources)
                ? item.sources.slice(0, 10).map(String)
                : [],
              conflicts: Array.isArray(item.conflicts)
                ? item.conflicts.slice(0, 5)
                : [],
            };
          }
        }
      }
    }

    return normalized;
  } catch (err) {
    console.error("Failed to generate structured plan data:", err);
    // Return all sections even on error, just empty
    const ALL_SECTIONS = [
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
    ];
    const emptyStructure: Record<string, any> = {};
    ALL_SECTIONS.forEach((section) => {
      emptyStructure[section] = {
        title: section,
        content: "",
        confidence: 0,
        dataPoints: [],
        sources: [],
        conflicts: [],
      };
    });
    return emptyStructure;
  }
}

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

// ========== DEBUG LOGGING ==========
const DEBUG_AGENT = true;

function logAgent(stage: string, data: any) {
  if (!DEBUG_AGENT) return;
  console.log("\n" + "🚀".repeat(30));
  console.log(`🚀 [AGENT ORCHESTRATOR] ${stage}`);
  console.log("🚀".repeat(30));
  console.log(JSON.stringify(data, null, 2));
  console.log("🚀".repeat(30) + "\n");
}
// ====================================

// Initialize multi-model orchestration services
const modelSelector = new ModelSelector();
const responseSynthesizer = new ResponseSynthesizer();

// Initialize model data sources
const grokModel = new ModelDataSource({
  name: "grok",
  provider: "grok",
  model: "grok-4-1-fast",
  priority: 8,
  costPerToken: { input: 0.0002, output: 0.0005 },
  strengths: [
    "Reasoning",
    "Logic problems",
    "Multi-step analysis",
    "Code generation",
  ],
  weaknesses: ["Very recent events", "Some edge cases"],
});

const geminiModel = new ModelDataSource({
  name: "gemini-flash",
  provider: "gemini",
  model: process.env.LLM_MODEL || "gemini-2.5-flash-lite",
  priority: 9,
  costPerToken: { input: 0.000001, output: 0.000004 },
  strengths: [
    "Factual accuracy",
    "Speed",
    "Creative tasks",
    "General knowledge",
  ],
  weaknesses: ["Deep reasoning sometimes", "Complex math"],
});

export const agentRouter = router({
  askQuestion: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        question: z.string(),
        companyId: z.string().optional(),
        priority: z.enum(["speed", "accuracy", "cost", "balanced"]).optional(),
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

      // Fetch conversation history for context
      const conversationHistory = await prisma.conversationMessage.findMany({
        where: { sessionId: input.sessionId },
        select: { role: true, content: true },
        orderBy: { timestamp: "asc" },
        take: -10, // Last 10 messages for context
      });

      // 🔧 TESTING: Changed from "balanced" to "accuracy" to see both models in action
      // Change back to "balanced" for production
      const priority = input.priority || "accuracy";
      let assistantResponse: string = "";
      let modelSelectionMetadata: any = {};

      logAgent("REQUEST RECEIVED", {
        sessionId: input.sessionId,
        question:
          input.question.substring(0, 100) +
          (input.question.length > 100 ? "..." : ""),
        priority: priority,
        conversationHistoryLength: conversationHistory.length,
        timestamp: new Date().toISOString(),
      });

      try {
        // Step 1: Analyze query intent using ModelSelector
        logAgent("STEP 1: INTENT ANALYSIS STARTING", {
          step: "1/5",
          action: "Classifying user query intent",
        });
        const intent = await modelSelector.analyzeIntent(input.question);
        modelSelectionMetadata.intent = intent;

        logAgent("STEP 1: INTENT ANALYSIS COMPLETE", {
          detectedIntent: intent,
          intentMeaning:
            {
              analytical: "Deep reasoning required",
              creative: "Novel ideas/brainstorming",
              factual: "Verifiable facts needed",
              complex: "Multi-step reasoning",
              comparison: "Comparing options",
              synthesis: "Combining perspectives",
              general: "General knowledge",
            }[intent] || "Unknown",
        });

        // Step 2: Select strategy based on intent and priority
        logAgent("STEP 2: STRATEGY SELECTION STARTING", {
          step: "2/5",
          action: "Selecting model execution strategy",
          inputs: { intent, priority },
        });
        const strategy = modelSelector.selectStrategy(intent, priority);
        modelSelectionMetadata.strategy = strategy;

        logAgent("STEP 2: STRATEGY SELECTION COMPLETE", {
          selectedStrategy: strategy.approach,
          models: strategy.models,
          reasoning: strategy.reasoning,
        });

        // Step 3: Execute models based on selected strategy
        let responses: any[] = [];

        logAgent("STEP 3: MODEL EXECUTION STARTING", {
          step: "3/5",
          approach: strategy.approach,
          modelsToExecute: strategy.models,
        });

        if (strategy.approach === "single") {
          // Execute single model
          const model = strategy.models[0] === "grok" ? grokModel : geminiModel;
          logAgent("SINGLE MODEL EXECUTION", {
            selectedModel: strategy.models[0],
            modelDetails: {
              name: model.getName(),
              priority: model.getPriority(),
              costPerToken: model.getCostPerToken(),
            },
          });
          const result = await model.query(
            input.question,
            PROMPTS.RESEARCH_ASSISTANT,
            conversationHistory as any
          );

          if (
            !result.data?.response ||
            result.data.response.trim().length === 0
          ) {
            logAgent("SINGLE MODEL FAILED", {
              model: strategy.models[0],
              error: result.error || "Empty response",
              confidence: result.confidence,
            });
            throw new Error(
              `Model ${strategy.models[0]} returned empty response: ${
                result.error || "No error details"
              }`
            );
          }

          responses.push({
            model: strategy.models[0],
            response: result.data.response,
            confidence: result.confidence,
            executionTime: result.data?.executionTime,
            tokenUsage: result.data?.tokenUsage,
            error: result.error,
          });
          assistantResponse = result.data.response;

          logAgent("SINGLE MODEL COMPLETE", {
            model: strategy.models[0],
            responseLength: assistantResponse.length,
            confidence: result.confidence,
            executionTime: result.data?.executionTime,
          });
        } else if (strategy.approach === "parallel") {
          // Execute both models in parallel
          logAgent("PARALLEL EXECUTION STARTING", {
            models: ["grok", "gemini-flash"],
            note: "Both models executing simultaneously",
          });

          const results = await Promise.all([
            grokModel.query(
              input.question,
              PROMPTS.RESEARCH_ASSISTANT,
              conversationHistory as any
            ),
            geminiModel.query(
              input.question,
              PROMPTS.RESEARCH_ASSISTANT,
              conversationHistory as any
            ),
          ]);

          logAgent("PARALLEL EXECUTION COMPLETE", {
            grokResult: {
              responseLength: results[0].data?.response?.length || 0,
              confidence: results[0].confidence,
              executionTime: results[0].data?.executionTime,
            },
            geminiResult: {
              responseLength: results[1].data?.response?.length || 0,
              confidence: results[1].confidence,
              executionTime: results[1].data?.executionTime,
            },
          });

          responses = [
            {
              model: "grok",
              response: results[0].data?.response || "",
              confidence: results[0].confidence,
              executionTime: results[0].data?.executionTime,
              tokenUsage: results[0].data?.tokenUsage,
              error: results[0].error,
            },
            {
              model: "gemini-flash",
              response: results[1].data?.response || "",
              confidence: results[1].confidence,
              executionTime: results[1].data?.executionTime,
              tokenUsage: results[1].data?.tokenUsage,
              error: results[1].error,
            },
          ];

          // Step 4: Compare responses
          logAgent("STEP 4: RESPONSE COMPARISON", {
            step: "4/5",
            action: "Comparing responses from both models",
            validResponses: [
              results[0].data?.response ? true : false,
              results[1].data?.response ? true : false,
            ],
          });

          // Filter out empty responses for comparison
          const validResponsesForComparison = [
            results[0].data?.response || "",
            results[1].data?.response || "",
          ].filter((r) => r.trim().length > 0);

          if (validResponsesForComparison.length === 0) {
            throw new Error(
              "Both models in parallel execution returned empty responses"
            );
          }

          const comparison = await responseSynthesizer.compareResponses(
            input.question,
            validResponsesForComparison,
            PROMPTS.RESEARCH_ASSISTANT
          );
          modelSelectionMetadata.comparison = comparison;

          // Step 5: Synthesize responses based on blend preference
          logAgent("STEP 5: RESPONSE SYNTHESIS", {
            step: "5/5",
            action: "Blending responses",
          });
          const blendApproach =
            strategy.reasoning.includes("diversity") ||
            strategy.reasoning.includes("diverse")
              ? "consensus"
              : "blend";

          logAgent("BLEND APPROACH SELECTED", {
            approach: blendApproach,
            reasoning: strategy.reasoning,
          });

          if (validResponsesForComparison.length === 1) {
            assistantResponse = validResponsesForComparison[0];
          } else {
            assistantResponse = await responseSynthesizer.blendResponses(
              input.question,
              validResponsesForComparison,
              PROMPTS.RESEARCH_ASSISTANT,
              blendApproach
            );
          }

          logAgent("SYNTHESIS COMPLETE", {
            finalResponseLength: assistantResponse.length,
          });
        } else if (strategy.approach === "sequential") {
          // Try first model, if unsatisfactory try second
          logAgent("SEQUENTIAL EXECUTION STARTING", {
            firstModel: "grok",
            fallbackModel: "gemini-flash",
            confidenceThreshold: 0.7,
          });

          const firstResult = await grokModel.query(
            input.question,
            PROMPTS.RESEARCH_ASSISTANT,
            conversationHistory as any
          );

          logAgent("FIRST MODEL RESULT", {
            model: "grok",
            confidence: firstResult.confidence,
            meetsThreshold: firstResult.confidence >= 0.7,
            executionTime: firstResult.data?.executionTime,
          });

          responses.push({
            model: "grok",
            response: firstResult.data?.response || "",
            confidence: firstResult.confidence,
            executionTime: firstResult.data?.executionTime,
            tokenUsage: firstResult.data?.tokenUsage,
            error: firstResult.error,
          });

          // Check if confidence is acceptable, otherwise try second model
          if (
            firstResult.confidence < 0.7 ||
            !firstResult.data?.response ||
            firstResult.data.response.trim().length === 0
          ) {
            logAgent("FALLBACK TRIGGERED", {
              reason:
                firstResult.confidence < 0.7
                  ? `Confidence ${firstResult.confidence} < 0.7 threshold`
                  : "Empty response from first model",
              action: "Trying gemini-flash as fallback",
            });

            const secondResult = await geminiModel.query(
              input.question,
              PROMPTS.RESEARCH_ASSISTANT,
              conversationHistory as any
            );

            logAgent("FALLBACK MODEL RESULT", {
              model: "gemini-flash",
              confidence: secondResult.confidence,
              executionTime: secondResult.data?.executionTime,
              willUse:
                secondResult.confidence > firstResult.confidence ||
                (secondResult.data?.response &&
                  secondResult.data.response.trim().length > 0)
                  ? "gemini-flash"
                  : "grok",
            });

            responses.push({
              model: "gemini-flash",
              response: secondResult.data?.response || "",
              confidence: secondResult.confidence,
              executionTime: secondResult.data?.executionTime,
              tokenUsage: secondResult.data?.tokenUsage,
              error: secondResult.error,
            });

            // Use second response if it's better or first was empty
            const hasValidSecondResponse =
              secondResult.data?.response &&
              secondResult.data.response.trim().length > 0;
            const hasValidFirstResponse =
              firstResult.data?.response &&
              firstResult.data.response.trim().length > 0;

            if (
              hasValidSecondResponse &&
              (secondResult.confidence > firstResult.confidence ||
                !hasValidFirstResponse)
            ) {
              assistantResponse = secondResult.data.response;
            } else if (hasValidFirstResponse) {
              assistantResponse = firstResult.data.response;
            } else {
              throw new Error(
                "Both sequential models returned empty responses"
              );
            }
          } else {
            logAgent("NO FALLBACK NEEDED", {
              reason: `Confidence ${firstResult.confidence} >= 0.7 threshold`,
              usingModel: "grok",
              responseLength: firstResult.data?.response?.length || 0,
            });
            assistantResponse = firstResult.data.response;
          }
        } else if (strategy.approach === "ensemble") {
          // Execute both, return all responses for user to choose
          logAgent("ENSEMBLE EXECUTION STARTING", {
            models: ["grok", "gemini-flash"],
            note: "Both models executing, will blend with consensus approach",
          });

          const results = await Promise.all([
            grokModel.query(
              input.question,
              PROMPTS.RESEARCH_ASSISTANT,
              conversationHistory as any
            ),
            geminiModel.query(
              input.question,
              PROMPTS.RESEARCH_ASSISTANT,
              conversationHistory as any
            ),
          ]);

          logAgent("ENSEMBLE EXECUTION COMPLETE", {
            grokResult: {
              responseLength: results[0].data?.response?.length || 0,
              confidence: results[0].confidence,
            },
            geminiResult: {
              responseLength: results[1].data?.response?.length || 0,
              confidence: results[1].confidence,
            },
          });

          responses = [
            {
              model: "grok",
              response: results[0].data?.response || "",
              confidence: results[0].confidence,
              executionTime: results[0].data?.executionTime,
              tokenUsage: results[0].data?.tokenUsage,
              error: results[0].error,
            },
            {
              model: "gemini-flash",
              response: results[1].data?.response || "",
              confidence: results[1].confidence,
              executionTime: results[1].data?.executionTime,
              tokenUsage: results[1].data?.tokenUsage,
              error: results[1].error,
            },
          ];

          // Combine both responses with ensemble synthesis
          logAgent("ENSEMBLE SYNTHESIS", {
            approach: "consensus",
            action: "Finding consensus across both model responses",
            validResponses: [
              results[0].data?.response ? true : false,
              results[1].data?.response ? true : false,
            ],
          });

          // Filter out empty responses and use non-empty ones
          const validResponses = [
            results[0].data?.response || "",
            results[1].data?.response || "",
          ].filter((r) => r.trim().length > 0);

          if (validResponses.length === 0) {
            throw new Error("Both models failed to generate valid responses");
          }

          if (validResponses.length === 1) {
            assistantResponse = validResponses[0];
          } else {
            assistantResponse = await responseSynthesizer.blendResponses(
              input.question,
              validResponses,
              PROMPTS.RESEARCH_ASSISTANT,
              "consensus"
            );
          }

          logAgent("ENSEMBLE COMPLETE", {
            finalResponseLength: assistantResponse.length,
          });
        }

        logAgent("MODEL EXECUTION SUMMARY", {
          totalResponses: responses.length,
          models: responses.map((r) => r.model),
          confidences: responses.map((r) => ({
            model: r.model,
            confidence: r.confidence,
          })),
          finalResponseLength: assistantResponse.length,
        });

        modelSelectionMetadata.responses = responses;
        modelSelectionMetadata.priority = priority;
      } catch (modelError) {
        console.warn(
          "Multi-model orchestration failed, falling back to single model:",
          modelError
        );
        // Fallback to single model if orchestration fails
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
        assistantResponse = llmResult.text;
        modelSelectionMetadata.fallback = true;
        modelSelectionMetadata.error = (modelError as Error).message;
      }

      // Validate assistant response before saving
      if (!assistantResponse || assistantResponse.trim().length === 0) {
        console.error("❌ Empty assistant response detected!");
        console.error({
          modelSelectionMetadata,
          conversationHistoryLength: conversationHistory.length,
          priority,
        });
        assistantResponse =
          "I was unable to generate a response. Please try again with a different question.";
      }

      logAgent("RESPONSE GENERATED", {
        responseLength: assistantResponse.length,
        contentPreview: assistantResponse.substring(0, 200),
        timestamp: new Date().toISOString(),
      });

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

      // Generate structured data for right UI panel
      const structuredData = await generateStructuredPlanData(
        assistantResponse,
        conversationHistory.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        }))
      );

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

      // Save structured data to session for persistence, including model selection metadata
      await prisma.researchSession.update({
        where: { id: input.sessionId },
        data: {
          structuredData: structuredData as any, // Store the generated structured data
        },
      });

      return {
        userMessage,
        assistantMessage,
        findings: savedFindings,
        conflicts: [], // No conflicts in simplified version
        followUpSuggestions: [], // No suggestions in simplified version
        structuredData, // <-- New: Structured data for UI panel
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
