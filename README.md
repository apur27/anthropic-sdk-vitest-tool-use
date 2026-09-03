# anthropic-sdk-vitest-tool-use

Minimal TypeScript sample that wires together:

- [`@anthropic-ai/sdk`](https://github.com/anthropics/anthropic-sdk-typescript)
- Claude **tool_use** (function calling) with a manual request loop
- **Vitest** unit tests that mock the SDK (no live API calls)
- GitHub Actions CI

## What it shows

`src/agent.ts` sends `tools` to `client.messages.create()`. When the model returns `stop_reason: "tool_use"`, the agent:

1. Finds each `tool_use` content block
2. Runs the local tool (`get_weather` / `add`)
3. Sends a `tool_result` user message back
4. Repeats until `end_turn`

`src/agent.test.ts` mocks `@anthropic-ai/sdk` with `vi.mock` so the loop is tested offline.

## Setup

```bash
git clone https://github.com/apur27/anthropic-sdk-vitest-tool-use.git
cd anthropic-sdk-vitest-tool-use
npm install
```

## Tests (no API key)

```bash
npm test
```

## Live run (needs a key)

```bash
cp .env.example .env
# put ANTHROPIC_API_KEY in .env, then:
export $(grep -v '^#' .env | xargs)
npm start
# or
npm start -- "What is the weather in Melbourne?"
```

The SDK reads `ANTHROPIC_API_KEY` from the environment.

## Official references

- SDK + tool helpers: https://github.com/anthropics/anthropic-sdk-typescript
- Manual tool loop example: https://github.com/anthropics/anthropic-sdk-typescript/blob/main/examples/tools.ts
- Zod tool runner example: https://github.com/anthropics/anthropic-sdk-typescript/blob/main/examples/tools-helpers-zod.ts
- Tool use docs: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
