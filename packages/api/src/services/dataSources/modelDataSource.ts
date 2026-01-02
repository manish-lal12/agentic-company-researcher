import { chat } from "../llm";
import type { Message } from "../llm";

// ========== DEBUG LOGGING ==========
const DEBUG_MODEL_DATASOURCE = true;

function logModelQuery(stage: string, data: any) {
  if (!DEBUG_MODEL_DATASOURCE) return;
  const emoji =
    data.provider === "grok" ? "🤖" : data.provider === "gemini" ? "💎" : "🔮";
  console.log("\n" + emoji.repeat(30));
  console.log(`${emoji} [MODEL: ${data.model || "unknown"}] ${stage}`);
  console.log(emoji.repeat(30));
  console.log(JSON.stringify(data, null, 2));
  console.log(emoji.repeat(30) + "\n");
}
// ====================================

export interface DataSourceResult {
  source: string;
  data: any;
  confidence: number;
  timestamp: Date;
  url?: string;
  cached?: boolean;
  error?: string;
  metadata?: any;
}

export interface ModelDataSourceConfig {
  name: string;
  provider: "grok" | "gemini" | "openai" | "anthropic";
  model: string;
  priority: number;
  costPerToken: { input: number; output: number };
  strengths: string[];
  weaknesses: string[];
}

export interface ModelResponse {
  text: string;
  model: string;
  provider: string;
  executionTime: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
  };
  cost?: number;
}

export class ModelDataSource {
  private config: ModelDataSourceConfig;

  constructor(config: ModelDataSourceConfig) {
    this.config = config;
  }

  async query(
    question: string,
    systemPrompt: string,
    conversationHistory: Array<{
      role: "user" | "assistant" | "system";
      content: string;
    }>
  ): Promise<DataSourceResult> {
    const startTime = Date.now();

    logModelQuery("QUERY STARTED", {
      model: this.config.model,
      provider: this.config.provider,
      modelName: this.config.name,
      question: question.substring(0, 100) + "...",
      historyLength: conversationHistory.length,
      strengths: this.config.strengths,
      weaknesses: this.config.weaknesses,
    });

    try {
      const messages: Message[] = [
        {
          role: "system",
          content: systemPrompt,
        },
        ...conversationHistory,
        {
          role: "user",
          content: question,
        },
      ];

      const result = await chat({
        provider: this.config.provider,
        model: this.config.model,
        messages,
        temperature: 0.7,
        maxTokens: 2000,
      });

      const executionTime = Date.now() - startTime;

      const cost =
        (result.usage?.promptTokens || 0) * this.config.costPerToken.input +
        (result.usage?.completionTokens || 0) * this.config.costPerToken.output;

      const queryResult = {
        source: `model-${this.config.name}`,
        data: {
          response: result.text,
          model: this.config.model,
          provider: this.config.provider,
          executionTime,
          tokenUsage: result.usage,
          cost,
          strengths: this.config.strengths,
          weaknesses: this.config.weaknesses,
        },
        confidence: this.getConfidenceScore(),
        timestamp: new Date(),
        metadata: {
          model: this.config.model,
          provider: this.config.provider,
          executionTime,
          cost,
        },
      };

      logModelQuery("QUERY COMPLETED", {
        model: this.config.model,
        provider: this.config.provider,
        executionTime: `${executionTime}ms`,
        responseLength: result.text.length,
        tokenUsage: result.usage,
        estimatedCost: `$${cost.toFixed(6)}`,
        confidence: queryResult.confidence,
        responsePreview: result.text.substring(0, 200) + "...",
      });

      return queryResult;
    } catch (error) {
      console.error(`Model ${this.config.name} failed:`, error);
      return {
        source: `model-${this.config.name}`,
        data: null,
        confidence: 0,
        timestamp: new Date(),
        error: String(error),
      };
    }
  }

  private getConfidenceScore(): number {
    const modelScores: Record<string, number> = {
      "grok-4.1-fast": 0.85,
      "gemini-2.0-flash": 0.88,
    };

    return modelScores[this.config.model] || 0.7;
  }

  getName(): string {
    return this.config.name;
  }

  getPriority(): number {
    return this.config.priority;
  }

  getStrengths(): string[] {
    return this.config.strengths;
  }

  getCostPerToken(): { input: number; output: number } {
    return this.config.costPerToken;
  }
}
