import { generateText as aiGenerateText, streamText as aiStreamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMConfig {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  baseUrl?: string;
}

export interface TextGenerationResult {
  text: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Get language model instance based on provider
 */
function getModel(config: LLMConfig) {
  const provider = (
    config.provider ||
    process.env.LLM_PROVIDER ||
    "openai"
  ).toLowerCase();
  const model = config.model || process.env.LLM_MODEL || "gpt-4";

  switch (provider) {
    case "grok":
    case "xai": {
      // Grok uses OpenAI-compatible API
      const grok = createOpenAI({
        apiKey: config.apiKey || process.env.XAI_API_KEY,
        baseURL: config.baseUrl || "https://api.x.ai/v1",
      });
      return grok(model);
    }

    case "anthropic":
    case "claude": {
      const anthropic = createAnthropic({
        apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
      });
      return anthropic(model);
    }

    case "gemini":
    case "google": {
      const google = createGoogleGenerativeAI({
        apiKey: config.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });
      // Google models need to be passed with correct naming
      // The @ai-sdk/google uses model ID directly without prefix
      const modelId = config.model || process.env.LLM_MODEL || "gemini-pro";
      return google(modelId);
    }

    case "openai":
    case "gpt":
    default: {
      const openai = createOpenAI({
        apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      });
      return openai(model);
    }
  }
}

/**
 * Generate text (non-streaming)
 */
export async function generateText(
  config: LLMConfig & { prompt: string }
): Promise<TextGenerationResult> {
  const { prompt, ...llmConfig } = config;
  const model = getModel(llmConfig);

  const result = await aiGenerateText({
    model,
    prompt,
    temperature: llmConfig.temperature,
    maxTokens: llmConfig.maxTokens,
  } as any);

  return {
    text: result.text,
    model: llmConfig.model || process.env.LLM_MODEL || "gpt-4",
    usage: result.usage
      ? {
          promptTokens: (result.usage as any).inputTokens || 0,
          completionTokens: (result.usage as any).outputTokens || 0,
          totalTokens:
            ((result.usage as any).inputTokens || 0) +
            ((result.usage as any).outputTokens || 0),
        }
      : undefined,
  };
}

/**
 * Stream text (streaming responses)
 */
export async function streamText(config: LLMConfig & { prompt: string }) {
  const { prompt, ...llmConfig } = config;
  const model = getModel(llmConfig);

  return await aiStreamText({
    model,
    prompt,
    temperature: llmConfig.temperature,
    maxTokens: llmConfig.maxTokens,
  } as any);
}

/**
 * Chat with message history
 */
export async function chat(
  config: LLMConfig & { messages: Message[] }
): Promise<TextGenerationResult> {
  const { messages, ...llmConfig } = config;
  const model = getModel(llmConfig);

  const result = await aiGenerateText({
    model,
    messages: messages as any,
    temperature: llmConfig.temperature,
    maxTokens: llmConfig.maxTokens,
  } as any);

  return {
    text: result.text,
    model: llmConfig.model || process.env.LLM_MODEL || "gpt-4",
    usage: result.usage
      ? {
          promptTokens: (result.usage as any).inputTokens || 0,
          completionTokens: (result.usage as any).outputTokens || 0,
          totalTokens:
            ((result.usage as any).inputTokens || 0) +
            ((result.usage as any).outputTokens || 0),
        }
      : undefined,
  };
}

/**
 * Stream chat with message history
 */
export async function streamChat(config: LLMConfig & { messages: Message[] }) {
  const { messages, ...llmConfig } = config;
  const model = getModel(llmConfig);

  return await aiStreamText({
    model,
    messages: messages as any,
    temperature: llmConfig.temperature,
    maxTokens: llmConfig.maxTokens,
  } as any);
}

/**
 * Quick ask function - simple one-shot question
 */
export async function ask(
  question: string,
  config?: Omit<LLMConfig, "prompt">
): Promise<string> {
  const result = await generateText({
    ...config,
    prompt: question,
  });
  return result.text;
}

/**
 * Quick ask with streaming - stream response to a one-shot question
 */
export async function askStream(
  question: string,
  config?: Omit<LLMConfig, "prompt">
) {
  return await streamText({
    ...config,
    prompt: question,
  });
}
