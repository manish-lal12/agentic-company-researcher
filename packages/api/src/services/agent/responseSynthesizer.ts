import { chat } from "../../services/llm";

// ========== DEBUG LOGGING ==========
const DEBUG_SYNTHESIZER = true;

function logSynthesizer(stage: string, data: any) {
  if (!DEBUG_SYNTHESIZER) return;
  console.log("\n" + "🔀".repeat(30));
  console.log(`🧪 [RESPONSE SYNTHESIZER] ${stage}`);
  console.log("🔀".repeat(30));
  console.log(JSON.stringify(data, null, 2));
  console.log("🔀".repeat(30) + "\n");
}
// ====================================

export interface ModelComparison {
  models: string[];
  responses: string[];
  similarities: number;
  conflicts: string[];
  recommendation: string;
  quality: Record<
    string,
    {
      clarity: number;
      accuracy: number;
      completeness: number;
      relevance: number;
      overallScore: number;
    }
  >;
}

export class ResponseSynthesizer {
  /**
   * Compare responses from multiple models
   */
  async compareResponses(
    question: string,
    responses: string[],
    systemPrompt: string
  ): Promise<ModelComparison> {
    logSynthesizer("COMPARING RESPONSES", {
      question: question.substring(0, 80) + "...",
      responseCount: responses.length,
      responseLengths: responses.map((r, i) => ({
        [`model-${i + 1}`]: r?.length || 0,
      })),
    });

    if (!responses || responses.length === 0) {
      throw new Error("No responses to compare");
    }

    if (responses.length === 1) {
      const firstResponse = responses[0]!;
      return {
        models: ["model-1"],
        responses: [firstResponse],
        similarities: 1,
        conflicts: [],
        recommendation: "Only one response available",
        quality: {
          "model-1": {
            clarity: 0.8,
            accuracy: 0.8,
            completeness: 0.8,
            relevance: 0.9,
            overallScore: 0.84,
          },
        },
      };
    }

    try {
      const comparisonPrompt = `You are comparing responses from different AI models.

        Question: ${question}

        ${responses.map((r, i) => `Model ${i + 1}:\n${r}`).join("\n\n---\n\n")}

        Please analyze:
        1. Which response is clearer?
        2. Which is more accurate based on known facts?
        3. Which is more complete?
        4. Which is most relevant to the question?
        5. Are there conflicts or contradictions?
        6. Which response should be used as primary?

        Respond in JSON format:
        {
          "similarities": 0.8,
          "conflicts": ["list of conflicts"],
          "qualityScores": {
            "model-1": {
              "clarity": 0.8,
              "accuracy": 0.8,
              "completeness": 0.8,
              "relevance": 0.9,
              "overallScore": 0.84
            },
            "model-2": {
              "clarity": 0.7,
              "accuracy": 0.9,
              "completeness": 0.8,
              "relevance": 0.8,
              "overallScore": 0.8
            }
          },
          "recommendation": "Which response to use or how to blend",
          "reasoning": "Why this recommendation"
        }`;

      const result = await chat({
        provider: "gemini",
        model: process.env.LLM_MODEL || "gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: comparisonPrompt,
          },
        ],
        temperature: 0.1,
        maxTokens: 1500,
      });

      try {
        const parsed = JSON.parse(result.text);
        const comparison = {
          models: responses.map((_, i) => `model-${i + 1}`),
          responses: responses,
          similarities: parsed.similarities || 0.5,
          conflicts: parsed.conflicts || [],
          recommendation: parsed.recommendation || "Use combined approach",
          quality: parsed.qualityScores || {},
        };

        logSynthesizer("COMPARISON RESULT", {
          similarities: comparison.similarities,
          conflictsFound: comparison.conflicts.length,
          recommendation: comparison.recommendation,
          qualityScores: comparison.quality,
        });

        return comparison;
      } catch (e) {
        return {
          models: responses.map((_, i) => `model-${i + 1}`),
          responses: responses,
          similarities: 0.5,
          conflicts: [],
          recommendation: "Unable to parse comparison, using first response",
          quality: {},
        };
      }
    } catch (error) {
      console.error("Response comparison failed:", error);
      return {
        models: responses.map((_, i) => `model-${i + 1}`),
        responses: responses,
        similarities: 0.5,
        conflicts: [],
        recommendation: "Error in comparison, using first response",
        quality: {},
      };
    }
  }

  /**
   * Blend responses from multiple models
   */
  async blendResponses(
    question: string,
    responses: string[],
    systemPrompt: string,
    approach: "best" | "blend" | "consensus" = "best"
  ): Promise<string> {
    logSynthesizer("BLENDING RESPONSES", {
      approach: approach,
      approachDescription:
        approach === "best"
          ? "🏆 Select highest quality response"
          : approach === "blend"
          ? "🎨 Synthesize into unified response"
          : "🤝 Find consensus across responses",
      responseCount: responses.length,
    });

    if (!responses || responses.length === 0) {
      throw new Error("No responses to blend");
    }

    if (responses.length === 1) {
      return responses[0]!;
    }

    const comparison = await this.compareResponses(
      question,
      responses,
      systemPrompt
    );

    if (approach === "best") {
      // Find highest scoring response
      let bestScore = 0;
      let bestIndex = 0;

      for (let i = 0; i < responses.length; i++) {
        const modelKey = `model-${i + 1}`;
        const scores = comparison.quality?.[modelKey];
        if (scores && scores.overallScore > bestScore) {
          bestScore = scores.overallScore;
          bestIndex = i;
        }
      }

      return responses[bestIndex]!;
    } else if (approach === "blend") {
      // Create synthesis from multiple responses
      const blendPrompt = `Synthesize these responses into a single comprehensive answer:

        Question: ${question}

        ${responses
          .map((r, i) => `Response ${i + 1}:\n${r}`)
          .join("\n\n---\n\n")}

        Create a unified response that:
        1. Takes the best insights from each
        2. Resolves any conflicts using most reliable source
        3. Maintains clarity and conciseness
        4. Attributes insights where they come from`;

      const result = await chat({
        provider: "gemini",
        model: process.env.LLM_MODEL || "gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: blendPrompt,
          },
        ],
        temperature: 0.7,
      });

      return result.text;
    } else {
      // Consensus - find common ground
      const consensusPrompt = `Find the consensus view across these responses:

        ${responses.map((r, i) => `Model ${i + 1}:\n${r}`).join("\n\n---\n\n")}

        Extract points of agreement and present unified view. Highlight any disagreements.`;

      const result = await chat({
        provider: "gemini",
        model: process.env.LLM_MODEL || "gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: consensusPrompt,
          },
        ],
        temperature: 0.1,
      });

      return result.text;
    }
  }
}
