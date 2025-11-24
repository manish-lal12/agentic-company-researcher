/**
 * Agent Configuration
 *
 * Centralized configuration for all agent behavior, LLM parameters, and tuning settings.
 * Modify these values to adjust how the research agent behaves and responds.
 *
 * Usage:
 *   import { AGENT_CONFIG } from '../config/agentConfig'
 *   const response = await chat({
 *     temperature: AGENT_CONFIG.LLM.TEMPERATURE,
 *     maxTokens: AGENT_CONFIG.LLM.MAX_TOKENS,
 *     ...
 *   })
 */

/**
 * LLM Model Parameters
 * These settings control the behavior of the language model
 */
export const AGENT_CONFIG = {
  /**
   * Language Model Settings
   * Fine-tune LLM behavior for research and response quality
   */
  LLM: {
    /**
     * Temperature: Controls randomness/creativity
     * Range: 0.0 - 1.0
     * 0.0 = deterministic, focused responses
     * 1.0 = maximum creativity and variation
     * Research sweet spot: 0.5-0.7
     */
    TEMPERATURE: parseFloat(process.env.AGENT_TEMPERATURE || "0.6"),

    /**
     * Top P (Nucleus Sampling): Diversity of responses
     * Range: 0.0 - 1.0
     * Controls cumulative probability for token selection
     * Lower = more focused, Higher = more diverse
     * Recommended: 0.9
     */
    TOP_P: parseFloat(process.env.AGENT_TOP_P || "0.9"),

    /**
     * Top K: Limits vocabulary selection
     * Range: 1 - 100
     * Only considers top K most likely tokens
     * Lower = more predictable, Higher = more varied
     * Recommended: 40
     */
    TOP_K: parseInt(process.env.AGENT_TOP_K || "40", 10),

    /**
     * Frequency Penalty: Reduces repetition
     * Range: -2.0 to 2.0
     * Positive values penalize repeated tokens
     * Higher = less repetition
     * Recommended: 0.5
     */
    FREQUENCY_PENALTY: parseFloat(process.env.AGENT_FREQUENCY_PENALTY || "0.5"),

    /**
     * Presence Penalty: Encourages new topics
     * Range: -2.0 to 2.0
     * Positive values encourage discussing new topics
     * Higher = more novel topics
     * Recommended: 0.3
     */
    PRESENCE_PENALTY: parseFloat(process.env.AGENT_PRESENCE_PENALTY || "0.3"),

    /**
     * Maximum tokens for different response types
     */
    MAX_TOKENS: {
      /**
       * Quick acknowledgments and confirmations
       */
      BRIEF: parseInt(process.env.AGENT_MAX_TOKENS_BRIEF || "300", 10),

      /**
       * Standard research responses and analysis
       */
      STANDARD: parseInt(process.env.AGENT_MAX_TOKENS_STANDARD || "1500", 10),

      /**
       * Comprehensive research reports and deep analysis
       */
      COMPREHENSIVE: parseInt(
        process.env.AGENT_MAX_TOKENS_COMPREHENSIVE || "3500",
        10
      ),

      /**
       * Detailed multi-section reports
       */
      EXTENDED: parseInt(process.env.AGENT_MAX_TOKENS_EXTENDED || "5000", 10),
    },
  },

  /**
   * Research Session Configuration
   * Controls how research sessions are conducted and analyzed
   */
  RESEARCH_SESSION: {
    /**
     * Whether to automatically extract research points from responses
     */
    AUTO_EXTRACT_POINTS: JSON.parse(
      process.env.AGENT_AUTO_EXTRACT_POINTS ?? "true"
    ),

    /**
     * Maximum number of research points to extract per response
     */
    MAX_RESEARCH_POINTS: parseInt(
      process.env.AGENT_MAX_RESEARCH_POINTS || "5",
      10
    ),

    /**
     * Minimum paragraph length to consider for research points
     * Filters out very short fragments
     */
    MIN_POINT_LENGTH: parseInt(process.env.AGENT_MIN_POINT_LENGTH || "20", 10),

    /**
     * Maximum length for individual research point topics
     */
    MAX_TOPIC_LENGTH: parseInt(process.env.AGENT_MAX_TOPIC_LENGTH || "50", 10),

    /**
     * Maximum length for individual research point insights
     */
    MAX_INSIGHT_LENGTH: parseInt(
      process.env.AGENT_MAX_INSIGHT_LENGTH || "200",
      10
    ),

    /**
     * Default confidence score for AI-extracted findings
     * Range: 0.0 - 1.0
     * Higher = more confident in the research
     */
    DEFAULT_CONFIDENCE: parseFloat(
      process.env.AGENT_DEFAULT_CONFIDENCE || "0.85"
    ),

    /**
     * Whether to save findings to database
     */
    SAVE_FINDINGS: JSON.parse(process.env.AGENT_SAVE_FINDINGS ?? "true"),

    /**
     * Timeout for research operations (in milliseconds)
     */
    TIMEOUT_MS: parseInt(process.env.AGENT_RESEARCH_TIMEOUT_MS || "60000", 10),
  },

  /**
   * Company Detection Configuration
   * Controls how companies are extracted and created from queries
   */
  COMPANY_DETECTION: {
    /**
     * Enable automatic company name extraction from questions
     */
    AUTO_EXTRACT: JSON.parse(process.env.AGENT_AUTO_EXTRACT_COMPANY ?? "true"),

    /**
     * Whether to auto-create companies if they don't exist
     */
    AUTO_CREATE: JSON.parse(process.env.AGENT_AUTO_CREATE_COMPANY ?? "true"),

    /**
     * Default company industry when auto-creating
     */
    DEFAULT_INDUSTRY: process.env.AGENT_DEFAULT_INDUSTRY || "Not specified",

    /**
     * Regex patterns for company name extraction
     * Can be customized for different naming patterns
     */
    EXTRACTION_PATTERNS: [
      /(?:research|about|analyze|tell me about|information on|data on)\s+([a-zA-Z\s&]+?)(?:\s+(?:company|corporation|inc|ltd|llc)|\.|\?|$)/i,
      /^([a-zA-Z\s&]+)\s+(?:company|corporation|inc|ltd|llc|research|analysis)/i,
      /(?:research|about|analyze)\s+([a-zA-Z\s&]+)/i,
    ],

    /**
     * Fallback company name for generic queries without specific company
     */
    FALLBACK_NAME:
      process.env.AGENT_FALLBACK_COMPANY_NAME || "General Research",
  },

  /**
   * Response Generation Configuration
   * Controls output formatting and structure
   */
  RESPONSE_GENERATION: {
    /**
     * Include section headers in research reports
     */
    USE_SECTION_HEADERS: JSON.parse(
      process.env.AGENT_USE_SECTION_HEADERS ?? "true"
    ),

    /**
     * Default sections for research reports
     * Can be customized per research type
     */
    DEFAULT_SECTIONS: [
      "Overview",
      "Key Facts",
      "Recent News",
      "Leadership",
      "Financial Health",
      "Market Position",
      "Key Insights",
    ],

    /**
     * Include confidence scores in research output
     */
    SHOW_CONFIDENCE_SCORES: JSON.parse(
      process.env.AGENT_SHOW_CONFIDENCE_SCORES ?? "true"
    ),

    /**
     * Include source attribution in findings
     */
    SHOW_SOURCES: JSON.parse(process.env.AGENT_SHOW_SOURCES ?? "true"),

    /**
     * Default source attribution for AI-generated content
     */
    DEFAULT_SOURCE: process.env.AGENT_DEFAULT_SOURCE || "AI Research Assistant",

    /**
     * Format for response timestamps
     * 'ISO' = ISO 8601, 'RELATIVE' = relative time, 'NONE' = no timestamp
     */
    TIMESTAMP_FORMAT: (process.env.AGENT_TIMESTAMP_FORMAT || "ISO") as
      | "ISO"
      | "RELATIVE"
      | "NONE",
  },

  /**
   * Prompt Configuration
   * Templates and instruction sets for the LLM
   */
  PROMPTS: {
    /**
     * System prompt for research mode
     * Sets the persona and behavior of the agent
     */
    SYSTEM_RESEARCH: `You are an expert research assistant tasked with compiling comprehensive research reports on companies and topics. 

When answering research questions:
1. Provide factual, well-researched information as if you've just compiled it from multiple sources
2. Structure your response with clear sections (Overview, Key Facts, Recent News, Leadership, Financial Health, etc.)
3. Include specific details, numbers, and facts where relevant
4. Mention reputable sources and information patterns
5. Provide balanced perspective on companies
6. Highlight key insights and trends
7. Be thorough but concise

Format findings clearly and structure data for easy extraction.`,

    /**
     * System prompt for analysis mode
     * Focuses on deeper analysis and synthesis
     */
    SYSTEM_ANALYSIS: `You are an expert business analyst specializing in company analysis and strategic insights.

Your analysis should:
1. Go beyond surface-level information
2. Identify patterns, trends, and relationships
3. Highlight competitive advantages and vulnerabilities
4. Assess financial and operational health
5. Provide actionable insights
6. Support conclusions with specific data
7. Clearly distinguish between facts and inferences`,

    /**
     * System prompt for planning mode
     * Generates actionable plans and recommendations
     */
    SYSTEM_PLANNING: `You are a strategic business consultant creating actionable account and research plans.

Your planning approach:
1. Analyze information systematically
2. Identify key opportunities and risks
3. Develop clear, phased recommendations
4. Consider resource allocation
5. Provide specific, measurable steps
6. Support with relevant data points
7. Be practical and implementable`,
  },

  /**
   * Behavior and Logic Configuration
   * Controls agent decision-making and workflow
   */
  BEHAVIOR: {
    /**
     * Whether to ask clarifying questions for ambiguous queries
     */
    ASK_CLARIFICATIONS: JSON.parse(
      process.env.AGENT_ASK_CLARIFICATIONS ?? "true"
    ),

    /**
     * Maximum number of follow-up clarification questions to ask
     */
    MAX_CLARIFICATIONS: parseInt(
      process.env.AGENT_MAX_CLARIFICATIONS || "2",
      10
    ),

    /**
     * Whether to provide alternative interpretations for ambiguous queries
     */
    PROVIDE_ALTERNATIVES: JSON.parse(
      process.env.AGENT_PROVIDE_ALTERNATIVES ?? "true"
    ),

    /**
     * Whether to acknowledge limitations and uncertainties
     */
    ACKNOWLEDGE_LIMITATIONS: JSON.parse(
      process.env.AGENT_ACKNOWLEDGE_LIMITATIONS ?? "true"
    ),

    /**
     * Minimum similarity score for company name matching
     * Range: 0.0 - 1.0
     * Higher = stricter matching
     */
    COMPANY_MATCH_THRESHOLD: parseFloat(
      process.env.AGENT_COMPANY_MATCH_THRESHOLD || "0.7"
    ),

    /**
     * Whether to suggest related companies or topics
     */
    SUGGEST_RELATED: JSON.parse(process.env.AGENT_SUGGEST_RELATED ?? "true"),

    /**
     * Whether to provide next steps or follow-up recommendations
     */
    PROVIDE_NEXT_STEPS: JSON.parse(
      process.env.AGENT_PROVIDE_NEXT_STEPS ?? "true"
    ),
  },

  /**
   * Validation and Quality Control
   * Ensures response quality and safety
   */
  QUALITY_CONTROL: {
    /**
     * Minimum response length to avoid trivial answers
     */
    MIN_RESPONSE_LENGTH: parseInt(
      process.env.AGENT_MIN_RESPONSE_LENGTH || "50",
      10
    ),

    /**
     * Check for potentially harmful or false information
     */
    SAFETY_CHECK_ENABLED: JSON.parse(
      process.env.AGENT_SAFETY_CHECK_ENABLED ?? "true"
    ),

    /**
     * Verify factual accuracy where possible
     */
    FACT_CHECK_ENABLED: JSON.parse(
      process.env.AGENT_FACT_CHECK_ENABLED ?? "true"
    ),

    /**
     * Flag speculative or uncertain information
     */
    FLAG_SPECULATION: JSON.parse(process.env.AGENT_FLAG_SPECULATION ?? "true"),

    /**
     * Minimum confidence threshold for extracting findings
     * Range: 0.0 - 1.0
     * Lower threshold = more findings extracted
     */
    MIN_CONFIDENCE_THRESHOLD: parseFloat(
      process.env.AGENT_MIN_CONFIDENCE_THRESHOLD || "0.5"
    ),
  },

  /**
   * Caching and Performance
   * Optimization settings
   */
  PERFORMANCE: {
    /**
     * Enable response caching for identical queries
     */
    CACHE_ENABLED: JSON.parse(process.env.AGENT_CACHE_ENABLED ?? "true"),

    /**
     * Cache TTL in seconds
     */
    CACHE_TTL_SECONDS: parseInt(
      process.env.AGENT_CACHE_TTL_SECONDS || "3600",
      10
    ),

    /**
     * Whether to stream responses for better UX
     */
    STREAMING_ENABLED: JSON.parse(
      process.env.AGENT_STREAMING_ENABLED ?? "false"
    ),

    /**
     * Batch processing for multiple research points
     */
    BATCH_PROCESSING: JSON.parse(process.env.AGENT_BATCH_PROCESSING ?? "true"),

    /**
     * Batch size for processing research points
     */
    BATCH_SIZE: parseInt(process.env.AGENT_BATCH_SIZE || "5", 10),
  },
} as const;

/**
 * Helper function to get LLM parameters for chat calls
 * Returns all LLM-specific configuration parameters
 */
export function getLLMParams() {
  return {
    temperature: AGENT_CONFIG.LLM.TEMPERATURE,
    topP: AGENT_CONFIG.LLM.TOP_P,
    topK: AGENT_CONFIG.LLM.TOP_K,
    frequencyPenalty: AGENT_CONFIG.LLM.FREQUENCY_PENALTY,
    presencePenalty: AGENT_CONFIG.LLM.PRESENCE_PENALTY,
  };
}

/**
 * Helper function to get max tokens for a response type
 */
export function getMaxTokens(
  type: keyof typeof AGENT_CONFIG.LLM.MAX_TOKENS
): number {
  return AGENT_CONFIG.LLM.MAX_TOKENS[type];
}

/**
 * Helper function to get system prompt for a mode
 */
export function getSystemPrompt(
  mode: "SYSTEM_RESEARCH" | "SYSTEM_ANALYSIS" | "SYSTEM_PLANNING"
): string {
  return AGENT_CONFIG.PROMPTS[mode];
}

/**
 * Helper function to validate configuration
 * Checks for invalid values and throws errors
 */
export function validateConfig(): boolean {
  const temperature = AGENT_CONFIG.LLM.TEMPERATURE;
  if (temperature < 0 || temperature > 1) {
    throw new Error(
      `Invalid temperature: ${temperature}. Must be between 0 and 1.`
    );
  }

  const topP = AGENT_CONFIG.LLM.TOP_P;
  if (topP < 0 || topP > 1) {
    throw new Error(`Invalid topP: ${topP}. Must be between 0 and 1.`);
  }

  const confidence = AGENT_CONFIG.RESEARCH_SESSION.DEFAULT_CONFIDENCE;
  if (confidence < 0 || confidence > 1) {
    throw new Error(
      `Invalid confidence: ${confidence}. Must be between 0 and 1.`
    );
  }

  return true;
}

export default AGENT_CONFIG;
