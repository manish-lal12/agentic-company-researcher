import { chat } from "../../services/llm";

export type QueryIntent =
  | "analytical"
  | "creative"
  | "factual"
  | "complex"
  | "comparison"
  | "synthesis"
  | "general";

export interface ModelSelectionStrategy {
  intent: QueryIntent;
  models: string[];
  approach: "single" | "parallel" | "sequential" | "ensemble";
  reasoning: string;
  priority: "speed" | "accuracy" | "cost" | "balanced";
}

export class ModelSelector {
  async analyzeIntent(question: string): Promise<QueryIntent> {
    try {
      const result = await chat({
        provider: "gemini",
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "system",
            content: `Classify the user's query intent into ONE of these categories:
- analytical: Requires deep reasoning, logic, step-by-step thinking
- creative: Asks for novel ideas, brainstorming, creative solutions
- factual: Asking for verifiable facts, data, definitions
- complex: Multi-step reasoning, synthesis of multiple concepts
- comparison: Comparing options, trade-offs, alternatives
- synthesis: Combining multiple perspectives into unified view
- general: General knowledge, small talk, or ambiguous intent

Respond with ONLY the category name, nothing else.`,
          },
          {
            role: "user",
            content: question,
          },
        ],
        temperature: 0.1,
        maxTokens: 50,
      });

      const intent = result.text.toLowerCase().trim() as QueryIntent;
      return intent;
    } catch (error) {
      console.error("Intent analysis failed:", error);
      return "general";
    }
  }

  selectStrategy(
    intent: QueryIntent,
    priority: "speed" | "accuracy" | "cost" | "balanced" = "balanced"
  ): ModelSelectionStrategy {
    const strategies: Record<
      QueryIntent,
      Record<string, ModelSelectionStrategy>
    > = {
      analytical: {
        speed: {
          intent: "analytical",
          models: ["grok-4.1-fast"],
          approach: "single",
          reasoning: "Grok excels at reasoning, fast execution",
          priority: "speed",
        },
        accuracy: {
          intent: "analytical",
          models: ["grok-4.1-fast", "gemini-2.0-flash"],
          approach: "parallel",
          reasoning: "Compare reasoning from both models for robustness",
          priority: "accuracy",
        },
        cost: {
          intent: "analytical",
          models: ["grok-4.1-fast"],
          approach: "single",
          reasoning: "Grok is faster and lower cost",
          priority: "cost",
        },
        balanced: {
          intent: "analytical",
          models: ["grok-4.1-fast"],
          approach: "single",
          reasoning: "Grok handles reasoning well, good cost-performance",
          priority: "balanced",
        },
      },

      factual: {
        speed: {
          intent: "factual",
          models: ["gemini-2.0-flash"],
          approach: "single",
          reasoning: "Gemini Flash is optimized for factual accuracy",
          priority: "speed",
        },
        accuracy: {
          intent: "factual",
          models: ["gemini-2.0-flash", "grok-4.1-fast"],
          approach: "parallel",
          reasoning: "Parallel queries to verify facts across models",
          priority: "accuracy",
        },
        cost: {
          intent: "factual",
          models: ["gemini-2.0-flash"],
          approach: "single",
          reasoning: "Gemini Flash is cost-effective for factual queries",
          priority: "cost",
        },
        balanced: {
          intent: "factual",
          models: ["gemini-2.0-flash"],
          approach: "single",
          reasoning: "Gemini Flash strong on factual accuracy",
          priority: "balanced",
        },
      },

      complex: {
        speed: {
          intent: "complex",
          models: ["grok-4.1-fast"],
          approach: "single",
          reasoning: "Grok good for multi-step reasoning",
          priority: "speed",
        },
        accuracy: {
          intent: "complex",
          models: ["grok-4.1-fast", "gemini-2.0-flash"],
          approach: "parallel",
          reasoning: "Both models verify complex reasoning",
          priority: "accuracy",
        },
        cost: {
          intent: "complex",
          models: ["grok-4.1-fast"],
          approach: "single",
          reasoning: "Grok fast and reasonable cost",
          priority: "cost",
        },
        balanced: {
          intent: "complex",
          models: ["grok-4.1-fast"],
          approach: "single",
          reasoning: "Grok excels at complex multi-step reasoning",
          priority: "balanced",
        },
      },

      creative: {
        speed: {
          intent: "creative",
          models: ["gemini-2.0-flash"],
          approach: "single",
          reasoning: "Gemini Flash good at creative tasks",
          priority: "speed",
        },
        accuracy: {
          intent: "creative",
          models: ["gemini-2.0-flash", "grok-4.1-fast"],
          approach: "ensemble",
          reasoning: "Blend creative outputs from both models",
          priority: "accuracy",
        },
        cost: {
          intent: "creative",
          models: ["gemini-2.0-flash"],
          approach: "single",
          reasoning: "Gemini Flash cost-effective for creative work",
          priority: "cost",
        },
        balanced: {
          intent: "creative",
          models: ["gemini-2.0-flash"],
          approach: "single",
          reasoning: "Gemini Flash good creative balance",
          priority: "balanced",
        },
      },

      comparison: {
        speed: {
          intent: "comparison",
          models: ["grok-4.1-fast"],
          approach: "single",
          reasoning: "Single model can handle comparisons quickly",
          priority: "speed",
        },
        accuracy: {
          intent: "comparison",
          models: ["grok-4.1-fast", "gemini-2.0-flash"],
          approach: "parallel",
          reasoning: "Compare different model perspectives on comparison",
          priority: "accuracy",
        },
        cost: {
          intent: "comparison",
          models: ["grok-4.1-fast"],
          approach: "single",
          reasoning: "Grok handles comparisons efficiently",
          priority: "cost",
        },
        balanced: {
          intent: "comparison",
          models: ["grok-4.1-fast"],
          approach: "single",
          reasoning: "Grok good at analytical comparisons",
          priority: "balanced",
        },
      },

      synthesis: {
        speed: {
          intent: "synthesis",
          models: ["grok-4.1-fast"],
          approach: "single",
          reasoning: "Grok fast at synthesis",
          priority: "speed",
        },
        accuracy: {
          intent: "synthesis",
          models: ["grok-4.1-fast", "gemini-2.0-flash"],
          approach: "parallel",
          reasoning: "Synthesize from multiple model perspectives",
          priority: "accuracy",
        },
        cost: {
          intent: "synthesis",
          models: ["grok-4.1-fast"],
          approach: "single",
          reasoning: "Grok cost-effective",
          priority: "cost",
        },
        balanced: {
          intent: "synthesis",
          models: ["grok-4.1-fast"],
          approach: "single",
          reasoning: "Grok good synthesis capabilities",
          priority: "balanced",
        },
      },

      general: {
        speed: {
          intent: "general",
          models: ["gemini-2.0-flash"],
          approach: "single",
          reasoning: "Gemini Flash fast and general-purpose",
          priority: "speed",
        },
        accuracy: {
          intent: "general",
          models: ["gemini-2.0-flash", "grok-4.1-fast"],
          approach: "sequential",
          reasoning: "First use Gemini, fallback to Grok if needed",
          priority: "accuracy",
        },
        cost: {
          intent: "general",
          models: ["gemini-2.0-flash"],
          approach: "single",
          reasoning: "Gemini Flash cost-effective",
          priority: "cost",
        },
        balanced: {
          intent: "general",
          models: ["gemini-2.0-flash"],
          approach: "single",
          reasoning: "Gemini Flash good general-purpose choice",
          priority: "balanced",
        },
      },
    };

    return (
      strategies[intent]?.[priority] ||
      strategies.general?.balanced ||
      ({
        intent: "general",
        models: ["gemini-2.0-flash"],
        approach: "single",
        reasoning: "Default fallback strategy",
        priority: "balanced",
      } as ModelSelectionStrategy)
    );
  }
}
