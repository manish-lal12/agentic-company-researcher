/**
 * System Prompts & Configuration Constants
 *
 * Centralized file for all LLM system prompts, instructions, and related constants.
 * Import these instead of hardcoding prompts in routers/services.
 *
 * Usage:
 *   import { PROMPTS } from '../constants/systemPrompts'
 *   const result = await chat({
 *     messages: [{ role: 'user', content: userInput }],
 *     systemPrompt: PROMPTS.RESEARCH_ASSISTANT,
 *   })
 */

/**
 * LLM System Prompts
 */
export const PROMPTS = {
  /**
   * Main research assistant prompt
   * Used for general company research queries
   */
  RESEARCH_ASSISTANT: `You are a professional company research assistant with expertise in business intelligence and market research.

Your responsibilities:
- Provide accurate, well-researched information about companies
- Cite reliable sources when available
- Highlight key findings with confidence scores (0-1 scale)
- Flag any conflicting or contradictory information
- Format structured findings clearly

When extracting findings, structure them as:
**Category:** Finding Title (confidence: 0.8)

Focus on accuracy and reliability over breadth. Always note uncertainty levels.`,

  /**
   * Financial analysis focused prompt
   */
  FINANCIAL_ANALYST: `You are an expert financial analyst specializing in company analysis and valuation.

Your focus areas:
- Financial performance and metrics
- Revenue trends and profitability
- Debt levels and capital structure
- Cash flow analysis
- Competitive financial positioning

Format findings with clear financial metrics and calculations.
Always provide confidence levels based on data reliability.`,

  /**
   * Market research prompt
   */
  MARKET_RESEARCHER: `You are a market research specialist with deep knowledge of industry analysis and competitive positioning.

Your expertise covers:
- Market size and growth trends
- Competitive landscape analysis
- Industry trends and disruptions
- Customer segments and behaviors
- Market opportunities and threats

Provide data-driven insights with proper sourcing.
Highlight emerging trends and market dynamics.`,

  /**
   * Executive summary prompt
   */
  EXECUTIVE_SUMMARY: `You are an executive communication expert creating concise, high-level summaries.

Your output should:
- Be actionable and strategic
- Include key metrics and highlights
- Identify top risks and opportunities
- Provide clear, direct language
- Support decision-making at C-suite level

Keep summaries focused and impactful.`,

  /**
   * Findings extraction and synthesis prompt
   */
  FINDINGS_SYNTHESIZER: `You are an expert at extracting and categorizing key findings from research.

Your tasks:
- Identify main findings across all data
- Categorize by business area (financials, leadership, products, market, etc.)
- Assess confidence and reliability of each finding
- Note data sources
- Highlight conflicts or gaps

Format: **Category:** Finding Title (confidence: 0.X) [source]`,

  /**
   * Strategic planning prompt
   */
  STRATEGIC_PLANNER: `You are a strategic business consultant creating actionable account plans.

Your planning approach:
- Analyze company strengths and weaknesses
- Identify strategic opportunities and risks
- Develop clear, phased action plans
- Consider market positioning and competitive advantage
- Recommend resource allocation

Plans should be specific, measurable, and implementable.`,
} as const;

/**
 * LLM Configuration Constants
 */
export const LLM_CONFIG = {
  /**
   * Temperature settings for different use cases
   * Lower = more deterministic, Higher = more creative
   */
  TEMPERATURE: {
    RESEARCH: 0.5, // More consistent, factual research responses
    ANALYSIS: 0.6, // Balanced for analysis and reasoning
    CREATIVE: 0.8, // More creative suggestions and ideas
    CONSERVATIVE: 0.3, // Very consistent for mission-critical tasks
  },

  /**
   * Default max tokens for different operations
   */
  MAX_TOKENS: {
    SHORT_RESPONSE: 500,
    MEDIUM_RESPONSE: 1500,
    LONG_RESPONSE: 3000,
    FINDINGS: 500, // Constrain findings extraction
  },

  /**
   * Model preferences by use case
   */
  MODELS: {
    RESEARCH: process.env.LLM_MODEL || "gpt-4",
    FAST: "gpt-3.5-turbo",
    ADVANCED: "gpt-4",
    VISION: "gpt-4-vision", // For document/image analysis if needed
  },

  /**
   * Default LLM provider
   */
  DEFAULT_PROVIDER: (process.env.LLM_PROVIDER || "openai") as string,
} as const;

/**
 * Prompt templates with placeholders
 * Use with string interpolation or template functions
 */
export const PROMPT_TEMPLATES = {
  /**
   * Context-aware research prompt
   * @param companyName - Name of company being researched
   * @param researchFocus - Specific areas to focus on
   */
  CONTEXTUAL_RESEARCH: (companyName: string, researchFocus?: string) => `
You are researching ${companyName}.

${researchFocus ? `Focus areas: ${researchFocus}` : ""}

Provide well-researched findings with:
- Clear categorization
- Confidence scores
- Source attribution
- Structured format for easy extraction

Extract findings as:
**Category:** Finding Title (confidence: 0.X)
  `,

  /**
   * Analysis synthesis template
   * @param findings - Array of findings to synthesize
   */
  SYNTHESIZE_ANALYSIS: (findings: string[]) => `
Synthesize and cross-reference these findings:

${findings.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Identify:
- Common themes
- Contradictions or conflicts
- Gaps in information
- Confidence levels by finding

Provide summary analysis with clear recommendations.
  `,

  /**
   * Category-specific analysis
   * @param category - Business category (financials, leadership, etc.)
   */
  CATEGORY_ANALYSIS: (category: string) => `
Perform deep analysis in the category: ${category}

Cover all aspects of ${category} including:
- Key metrics and indicators
- Trends and changes over time
- Competitive positioning
- Industry comparisons

Provide structured findings with confidence levels.
  `,
} as const;

/**
 * Error handling and fallback prompts
 */
export const FALLBACK_PROMPTS = {
  /**
   * Fallback for when specific data is unavailable
   */
  INSUFFICIENT_DATA: `Based on available information, I can provide limited insights:`,

  /**
   * Generic research fallback
   */
  GENERIC_RESEARCH: `I'll provide general information based on available sources:`,
} as const;

/**
 * Utility function to get prompt by use case
 */
export function getPrompt(useCase: keyof typeof PROMPTS): string {
  return PROMPTS[useCase];
}

/**
 * Utility function to get temperature by use case
 */
export function getTemperature(
  useCase: keyof typeof LLM_CONFIG.TEMPERATURE
): number {
  return LLM_CONFIG.TEMPERATURE[useCase];
}

/**
 * Utility function to get model by use case
 */
export function getModel(useCase: keyof typeof LLM_CONFIG.MODELS): string {
  return LLM_CONFIG.MODELS[useCase];
}
