import type { Anthropic } from "@anthropic-ai/sdk";

export const tools: Anthropic.Tool[] = [
  {
    name: "get_weather",
    description: "Get the current weather for a city",
    input_schema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City and region, e.g. Melbourne, VIC",
        },
      },
      required: ["location"],
    },
  },
  {
    name: "add",
    description: "Add two numbers",
    input_schema: {
      type: "object",
      properties: {
        a: { type: "number" },
        b: { type: "number" },
      },
      required: ["a", "b"],
    },
  },
];

export function runTool(name: string, input: Record<string, unknown>): string {
  if (name === "get_weather") {
    const location = String(input.location ?? "unknown");
    return JSON.stringify({
      location,
      temp_c: 18,
      conditions: "partly cloudy",
    });
  }

  if (name === "add") {
    const a = Number(input.a);
    const b = Number(input.b);
    return String(a + b);
  }

  throw new Error(`Unknown tool: ${name}`);
}
