import Anthropic from "@anthropic-ai/sdk";
import { runTool, tools } from "./tools.js";

export type AgentResult = {
  text: string;
  toolCalls: Array<{ name: string; input: unknown; result: string }>;
};

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

export async function runAgent(
  prompt: string,
  options?: {
    client?: Anthropic;
    model?: string;
    maxTurns?: number;
  },
): Promise<AgentResult> {
  const client = options?.client ?? new Anthropic();
  const model = options?.model ?? DEFAULT_MODEL;
  const maxTurns = options?.maxTurns ?? 8;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: prompt },
  ];

  const toolCalls: AgentResult["toolCalls"] = [];

  for (let turn = 0; turn < maxTurns; turn++) {
    const message = await client.messages.create({
      model,
      max_tokens: 1024,
      tools,
      messages,
    });

    messages.push({ role: "assistant", content: message.content });

    if (message.stop_reason !== "tool_use") {
      const text = message.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");
      return { text, toolCalls };
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of message.content) {
      if (block.type !== "tool_use") continue;

      const result = runTool(block.name, block.input as Record<string, unknown>);
      toolCalls.push({ name: block.name, input: block.input, result });
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  throw new Error(`Agent stopped after ${maxTurns} turns without a final reply`);
}
