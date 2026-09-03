import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  const MockAnthropic = vi.fn().mockImplementation(function (this: {
    messages: { create: typeof mockCreate };
  }) {
    this.messages = { create: mockCreate };
  });
  return { default: MockAnthropic };
});

import { runAgent } from "./agent.js";

describe("runAgent tool_use loop", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("executes tool_use then returns the final text", async () => {
    mockCreate
      .mockResolvedValueOnce({
        stop_reason: "tool_use",
        content: [
          {
            type: "tool_use",
            id: "toolu_weather",
            name: "get_weather",
            input: { location: "Melbourne, VIC" },
          },
        ],
      })
      .mockResolvedValueOnce({
        stop_reason: "end_turn",
        content: [
          {
            type: "text",
            text: "It is 18C and partly cloudy in Melbourne.",
          },
        ],
      });

    const result = await runAgent("Weather in Melbourne?");

    expect(result.toolCalls).toEqual([
      {
        name: "get_weather",
        input: { location: "Melbourne, VIC" },
        result: JSON.stringify({
          location: "Melbourne, VIC",
          temp_c: 18,
          conditions: "partly cloudy",
        }),
      },
    ]);
    expect(result.text).toContain("18C");
    expect(mockCreate).toHaveBeenCalledTimes(2);

    const secondCall = mockCreate.mock.calls[1][0];
    const lastMessage = secondCall.messages.at(-1);
    expect(lastMessage.role).toBe("user");
    expect(lastMessage.content[0]).toMatchObject({
      type: "tool_result",
      tool_use_id: "toolu_weather",
    });
  });

  it("runs parallel tool_use blocks in one turn", async () => {
    mockCreate
      .mockResolvedValueOnce({
        stop_reason: "tool_use",
        content: [
          {
            type: "tool_use",
            id: "toolu_add",
            name: "add",
            input: { a: 19, b: 23 },
          },
          {
            type: "tool_use",
            id: "toolu_weather",
            name: "get_weather",
            input: { location: "Melbourne" },
          },
        ],
      })
      .mockResolvedValueOnce({
        stop_reason: "end_turn",
        content: [{ type: "text", text: "42, and Melbourne is 18C." }],
      });

    const result = await runAgent("Add 19+23 and check Melbourne weather");

    expect(result.toolCalls.map((c) => c.name)).toEqual(["add", "get_weather"]);
    expect(result.toolCalls[0]?.result).toBe("42");
    expect(result.text).toContain("42");
  });

  it("returns immediately when the model does not call a tool", async () => {
    mockCreate.mockResolvedValueOnce({
      stop_reason: "end_turn",
      content: [{ type: "text", text: "Hello." }],
    });

    const result = await runAgent("Say hello");

    expect(result.toolCalls).toEqual([]);
    expect(result.text).toBe("Hello.");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});
