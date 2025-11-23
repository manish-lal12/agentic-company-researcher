# System Prompts & LLM Configuration

Centralized management of all LLM system prompts, instructions, and configuration constants.

## File Location

`packages/api/src/constants/systemPrompts.ts`

## Usage

### Import System Prompts

```typescript
import {
  PROMPTS,
  LLM_CONFIG,
  PROMPT_TEMPLATES,
} from "../constants/systemPrompts";

// Use a predefined prompt
const result = await chat({
  messages: [
    { role: "system", content: PROMPTS.RESEARCH_ASSISTANT },
    { role: "user", content: userQuestion },
  ],
  temperature: LLM_CONFIG.TEMPERATURE.RESEARCH,
});
```

### Available Prompts

#### `PROMPTS`

- **`RESEARCH_ASSISTANT`** - Main company research assistant prompt
- **`FINANCIAL_ANALYST`** - Financial analysis and valuation focused
- **`MARKET_RESEARCHER`** - Market research and competitive analysis
- **`EXECUTIVE_SUMMARY`** - Executive-level summaries
- **`FINDINGS_SYNTHESIZER`** - Findings extraction and categorization
- **`STRATEGIC_PLANNER`** - Strategic planning and account plans

#### `LLM_CONFIG`

**Temperature Settings:**

- `TEMPERATURE.CONSERVATIVE` (0.3) - Mission-critical, deterministic
- `TEMPERATURE.RESEARCH` (0.5) - Factual research responses
- `TEMPERATURE.ANALYSIS` (0.6) - Balanced analysis and reasoning
- `TEMPERATURE.CREATIVE` (0.8) - Creative suggestions and ideas

**Max Tokens:**

- `MAX_TOKENS.SHORT_RESPONSE` (500)
- `MAX_TOKENS.MEDIUM_RESPONSE` (1500)
- `MAX_TOKENS.LONG_RESPONSE` (3000)
- `MAX_TOKENS.FINDINGS` (500)

**Models:**

- `MODELS.RESEARCH` - Default research model (gpt-4)
- `MODELS.FAST` - Fast responses (gpt-3.5-turbo)
- `MODELS.ADVANCED` - Advanced reasoning (gpt-4)
- `MODELS.VISION` - Vision capabilities (gpt-4-vision)

#### `PROMPT_TEMPLATES`

Parameterized templates for dynamic prompts:

```typescript
// Research with company name and focus areas
const prompt = PROMPT_TEMPLATES.CONTEXTUAL_RESEARCH(
  "Microsoft",
  "cloud services, AI capabilities"
);

// Synthesize multiple findings
const synthesis = PROMPT_TEMPLATES.SYNTHESIZE_ANALYSIS([
  "Finding 1",
  "Finding 2",
]);

// Category-specific analysis
const analysis = PROMPT_TEMPLATES.CATEGORY_ANALYSIS("financials");
```

### Utility Functions

```typescript
import {
  getPrompt,
  getTemperature,
  getModel,
} from "../constants/systemPrompts";

// Get prompt by use case
const prompt = getPrompt("RESEARCH_ASSISTANT");

// Get temperature by use case
const temp = getTemperature("RESEARCH");

// Get model by use case
const model = getModel("RESEARCH");
```

## Current Usage

### Agent Router (`packages/api/src/routers/agent.ts`)

The `askQuestion` mutation uses:

- Prompt: `PROMPTS.RESEARCH_ASSISTANT`
- Temperature: `LLM_CONFIG.TEMPERATURE.RESEARCH` (0.5)

### How to Add New Prompts

1. Add new prompt to `PROMPTS` constant:

```typescript
export const PROMPTS = {
  // ... existing prompts
  MY_NEW_PROMPT: `Your system instruction here...`,
} as const;
```

2. Use in your code:

```typescript
import { PROMPTS } from "../constants/systemPrompts";

const result = await chat({
  messages: [
    { role: "system", content: PROMPTS.MY_NEW_PROMPT },
    { role: "user", content: userInput },
  ],
});
```

## Benefits

✅ **Centralized Management** - All prompts in one place
✅ **Consistency** - Reuse prompts across modules
✅ **Maintainability** - Easy to update and version prompts
✅ **Type Safety** - TypeScript constant tracking
✅ **Flexibility** - Template functions for dynamic prompts
✅ **Configuration** - Centralized LLM settings
✅ **Documentation** - Clear prompt purposes and use cases

## Best Practices

1. **Keep prompts focused** - One responsibility per prompt
2. **Document purpose** - Add JSDoc comments explaining use case
3. **Use templates** - For dynamic content, use template functions
4. **Test variations** - Document which temperature/model works best
5. **Version control** - Track prompt changes in git history
6. **Monitor performance** - Track which prompts work best for different tasks

## Environment Variables

Override defaults via `.env`:

```bash
LLM_PROVIDER=openai
LLM_MODEL=gpt-4
OPENAI_API_KEY=sk-...
```

Models are resolved at runtime from environment variables, with JavaScript defaults as fallback.
