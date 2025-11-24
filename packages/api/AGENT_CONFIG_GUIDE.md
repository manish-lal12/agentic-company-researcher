# Agent Configuration Guide

This guide explains how to configure and tune the agent's behavior using the centralized `agentConfig.ts` file.

## Overview

The agent configuration system provides fine-grained control over:

- **LLM Parameters**: Temperature, top-p, top-k, penalties
- **Research Behavior**: Point extraction, company detection, response generation
- **Quality Control**: Safety checks, response validation
- **Performance**: Caching, streaming, batch processing

All configuration is centralized in `/packages/api/src/config/agentConfig.ts` and can be controlled via environment variables.

## Quick Start

1. Copy `.env.agent.example` to your `.env.local` file
2. Customize values as needed
3. The agent will automatically load these configurations

```bash
cp packages/api/.env.agent.example packages/api/.env.local
```

Then edit the values you want to change.

## Configuration Categories

### 1. LLM Model Parameters

Control how the language model generates responses.

#### Temperature (0.0 - 1.0)

- **Default**: 0.6
- **Lower (0.0-0.3)**: More deterministic, factual responses
- **Higher (0.7-1.0)**: More creative, varied responses
- **Recommended for Research**: 0.5-0.7

```env
AGENT_TEMPERATURE=0.6
```

#### Top P (0.0 - 1.0)

- **Default**: 0.9
- Controls diversity via nucleus sampling
- Lower = more focused, Higher = more varied
- Typically keep between 0.85-0.95

```env
AGENT_TOP_P=0.9
```

#### Top K (1 - 100)

- **Default**: 40
- Only considers top K most likely tokens
- Lower = more predictable, Higher = more varied
- Typical range: 30-50

```env
AGENT_TOP_K=40
```

#### Frequency Penalty (-2.0 to 2.0)

- **Default**: 0.5
- Positive values reduce repetition
- Higher = less repetition (0.5-1.0 typical)
- 0 = no penalty

```env
AGENT_FREQUENCY_PENALTY=0.5
```

#### Presence Penalty (-2.0 to 2.0)

- **Default**: 0.3
- Positive values encourage new topics
- Higher = more novel topics (0.3-0.8 typical)
- 0 = no penalty

```env
AGENT_PRESENCE_PENALTY=0.3
```

#### Max Tokens by Response Type

Control output length for different scenarios:

```env
# Brief responses (confirmations, quick answers)
AGENT_MAX_TOKENS_BRIEF=300

# Standard responses (typical research queries)
AGENT_MAX_TOKENS_STANDARD=1500

# Comprehensive responses (deep analysis)
AGENT_MAX_TOKENS_COMPREHENSIVE=3500

# Extended responses (full reports)
AGENT_MAX_TOKENS_EXTENDED=5000
```

### 2. Research Session Configuration

Control how research is conducted and findings are extracted.

#### Auto Extract Research Points

Enable automatic extraction of structured findings from responses.

```env
# true = extract points automatically, false = manual only
AGENT_AUTO_EXTRACT_POINTS=true
```

#### Max Research Points

Maximum number of research points to extract per response.

```env
# Default: 5
# Higher = more granular findings, Lower = summarized findings
AGENT_MAX_RESEARCH_POINTS=5
```

#### Point Length Constraints

Control the granularity of extracted findings:

```env
# Minimum paragraph length to consider (characters)
AGENT_MIN_POINT_LENGTH=20

# Maximum length for topic labels
AGENT_MAX_TOPIC_LENGTH=50

# Maximum length for insights
AGENT_MAX_INSIGHT_LENGTH=200
```

#### Confidence Scoring

Set default confidence for extracted findings:

```env
# 0.0-1.0: Higher = more confident
AGENT_DEFAULT_CONFIDENCE=0.85
```

#### Save Findings

Whether to persist findings to the database:

```env
# true = save to DB, false = return but don't save
AGENT_SAVE_FINDINGS=true
```

#### Research Timeout

Maximum time for a research operation (milliseconds):

```env
# 60000 = 60 seconds
AGENT_RESEARCH_TIMEOUT_MS=60000
```

### 3. Company Detection Configuration

Control how companies are extracted and created.

#### Auto Extract Company

Automatically detect company names from user questions:

```env
# true = extract company from question
# false = require explicit company input
AGENT_AUTO_EXTRACT_COMPANY=true
```

#### Auto Create Company

Create companies dynamically if they don't exist:

```env
# true = create automatically, false = only use existing
AGENT_AUTO_CREATE_COMPANY=true
```

#### Default Settings

Defaults for auto-created companies:

```env
# Industry classification
AGENT_DEFAULT_INDUSTRY=Not specified

# Fallback for generic queries
AGENT_FALLBACK_COMPANY_NAME=General Research
```

### 4. Response Generation Configuration

Control output formatting and structure.

#### Section Headers

Include structured sections in reports:

```env
# true = use "Overview", "Key Facts", etc.
# false = return unformatted response
AGENT_USE_SECTION_HEADERS=true
```

#### Confidence & Sources

Display metadata about findings:

```env
# Show confidence scores (0.0-1.0)
AGENT_SHOW_CONFIDENCE_SCORES=true

# Show source attribution
AGENT_SHOW_SOURCES=true
```

#### Source Attribution

Default source label for findings:

```env
AGENT_DEFAULT_SOURCE=AI Research Assistant
```

#### Timestamps

Include timestamps in responses:

```env
# Options: ISO (ISO 8601), RELATIVE (e.g., "2 hours ago"), NONE
AGENT_TIMESTAMP_FORMAT=ISO
```

### 5. Behavior Configuration

Control agent decision-making and interaction patterns.

#### Clarifications

Ask follow-up questions for ambiguous queries:

```env
# Enable clarifying questions
AGENT_ASK_CLARIFICATIONS=true

# Maximum clarification questions to ask
AGENT_MAX_CLARIFICATIONS=2
```

#### Alternatives

Suggest alternative interpretations:

```env
AGENT_PROVIDE_ALTERNATIVES=true
```

#### Transparency

Acknowledge limitations and uncertainties:

```env
AGENT_ACKNOWLEDGE_LIMITATIONS=true
```

#### Company Matching

Similarity threshold for company name matching:

```env
# 0.0-1.0: Higher = stricter matching
AGENT_COMPANY_MATCH_THRESHOLD=0.7
```

#### Suggestions

Offer follow-up topics and recommendations:

```env
# Suggest related companies or topics
AGENT_SUGGEST_RELATED=true

# Provide next steps in findings
AGENT_PROVIDE_NEXT_STEPS=true
```

### 6. Quality Control Configuration

Ensure response quality and safety.

#### Response Validation

Minimum response length to prevent trivial answers:

```env
# Minimum characters for a valid response
AGENT_MIN_RESPONSE_LENGTH=50
```

#### Safety & Verification

Enable quality checks:

```env
# Check for harmful/false information
AGENT_SAFETY_CHECK_ENABLED=true

# Verify factual accuracy
AGENT_FACT_CHECK_ENABLED=true

# Flag speculation and uncertainty
AGENT_FLAG_SPECULATION=true
```

#### Confidence Threshold

Minimum confidence for extracting findings:

```env
# 0.0-1.0: Lower threshold = more findings
AGENT_MIN_CONFIDENCE_THRESHOLD=0.5
```

### 7. Performance Configuration

Optimize response speed and resource usage.

#### Caching

Enable response caching for repeated queries:

```env
# Enable caching
AGENT_CACHE_ENABLED=true

# Cache expiration time (seconds)
AGENT_CACHE_TTL_SECONDS=3600
```

#### Streaming

Return responses progressively (better UX for long responses):

```env
AGENT_STREAMING_ENABLED=false
```

#### Batch Processing

Process multiple research points in batches:

```env
# Enable batch processing
AGENT_BATCH_PROCESSING=true

# Batch size
AGENT_BATCH_SIZE=5
```

## Use Case Presets

Here are recommended configurations for different scenarios:

### Research Mode (Default - Accurate, Thorough)

```env
AGENT_TEMPERATURE=0.6
AGENT_TOP_P=0.9
AGENT_MAX_RESEARCH_POINTS=5
AGENT_DEFAULT_CONFIDENCE=0.85
AGENT_SHOW_CONFIDENCE_SCORES=true
AGENT_FLAG_SPECULATION=true
```

### Creative Mode (Idea Generation)

```env
AGENT_TEMPERATURE=0.8
AGENT_TOP_P=0.95
AGENT_MAX_RESEARCH_POINTS=8
AGENT_DEFAULT_CONFIDENCE=0.7
AGENT_PROVIDE_ALTERNATIVES=true
AGENT_SUGGEST_RELATED=true
```

### Conservative Mode (Mission-Critical)

```env
AGENT_TEMPERATURE=0.3
AGENT_TOP_P=0.7
AGENT_MAX_RESEARCH_POINTS=3
AGENT_DEFAULT_CONFIDENCE=0.95
AGENT_SAFETY_CHECK_ENABLED=true
AGENT_FACT_CHECK_ENABLED=true
```

### Fast Mode (Quick Responses)

```env
AGENT_MAX_TOKENS_COMPREHENSIVE=800
AGENT_MAX_RESEARCH_POINTS=3
AGENT_CACHE_ENABLED=true
AGENT_BATCH_PROCESSING=false
```

### Verbose Mode (Detailed Reports)

```env
AGENT_MAX_TOKENS_COMPREHENSIVE=5000
AGENT_MAX_RESEARCH_POINTS=10
AGENT_SHOW_CONFIDENCE_SCORES=true
AGENT_SHOW_SOURCES=true
AGENT_PROVIDE_NEXT_STEPS=true
```

## Accessing Configuration in Code

Import and use the configuration in your code:

```typescript
import {
  AGENT_CONFIG,
  getMaxTokens,
  getSystemPrompt,
} from "../config/agentConfig";

// Access configuration values
const temperature = AGENT_CONFIG.LLM.TEMPERATURE;
const maxTokens = getMaxTokens("COMPREHENSIVE");
const systemPrompt = getSystemPrompt("SYSTEM_RESEARCH");

// Access nested configurations
const autoExtract = AGENT_CONFIG.RESEARCH_SESSION.AUTO_EXTRACT_POINTS;
```

## Configuration Validation

The system automatically validates configuration on startup:

```typescript
import { validateConfig } from "../config/agentConfig";

// Throws error if configuration is invalid
validateConfig();
```

Invalid configurations include:

- Temperature outside 0.0-1.0
- Top P outside 0.0-1.0
- Confidence outside 0.0-1.0
- Invalid threshold values

## Best Practices

1. **Start with Defaults**: The default configuration works well for most cases
2. **Tune Gradually**: Change one parameter at a time and observe results
3. **Use Environment Variables**: Never hardcode values in code
4. **Document Changes**: Comment why you changed values from defaults
5. **Test Impact**: Verify changes improve your metrics
6. **Monitor Performance**: Track response quality and latency with your changes

## Common Tuning Scenarios

### Problem: Responses are too similar/repetitive

**Solution**: Increase `AGENT_TEMPERATURE` (0.6 → 0.7) and `AGENT_FREQUENCY_PENALTY` (0.5 → 0.8)

### Problem: Responses are too creative/inaccurate

**Solution**: Decrease `AGENT_TEMPERATURE` (0.6 → 0.4) and decrease `AGENT_TOP_P` (0.9 → 0.7)

### Problem: Too many trivial research points extracted

**Solution**: Increase `AGENT_MIN_POINT_LENGTH` or `AGENT_MIN_CONFIDENCE_THRESHOLD`

### Problem: Missing important findings

**Solution**: Increase `AGENT_MAX_RESEARCH_POINTS` or decrease `AGENT_MIN_CONFIDENCE_THRESHOLD`

### Problem: System is too slow

**Solution**: Enable `AGENT_CACHE_ENABLED`, reduce `AGENT_MAX_TOKENS_COMPREHENSIVE`, enable `AGENT_BATCH_PROCESSING`

### Problem: System is too conservative/cautious

**Solution**: Decrease safety checks or reduce `AGENT_MAX_CLARIFICATIONS`

## Environment Variable Precedence

Configuration is loaded in this order:

1. `.env.local` (local overrides)
2. `.env` (default values in package)
3. Hardcoded defaults in `agentConfig.ts`

Later values override earlier values, so `.env.local` takes highest priority.

## Debugging Configuration

To see the active configuration values:

```typescript
import { AGENT_CONFIG } from "../config/agentConfig";

console.log(AGENT_CONFIG);
// Outputs entire configuration object with resolved values
```

Or access specific categories:

```typescript
console.log(AGENT_CONFIG.LLM);
console.log(AGENT_CONFIG.RESEARCH_SESSION);
console.log(AGENT_CONFIG.BEHAVIOR);
```

## Extending Configuration

To add new configuration options:

1. Add to `AGENT_CONFIG` object in `agentConfig.ts`
2. Add environment variable reading with `process.env`
3. Add helper functions if needed
4. Add documentation above the new option
5. Update `.env.agent.example` with example value

Example:

```typescript
// In agentConfig.ts
export const AGENT_CONFIG = {
  NEW_FEATURE: {
    ENABLED: JSON.parse(process.env.AGENT_NEW_FEATURE_ENABLED ?? "true"),
    VALUE: parseInt(process.env.AGENT_NEW_FEATURE_VALUE || "100", 10),
  },
};
```

Then in `.env.agent.example`:

```env
# Enable new feature
AGENT_NEW_FEATURE_ENABLED=true

# New feature parameter
AGENT_NEW_FEATURE_VALUE=100
```

## Support

For issues or questions about configuration:

1. Check if environment variables are set correctly
2. Run `validateConfig()` to identify invalid values
3. Review the "Common Tuning Scenarios" section
4. Check your LLM provider's documentation for parameter limits
