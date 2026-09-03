import { runAgent } from "./agent.js";

const prompt =
  process.argv.slice(2).join(" ") ||
  "What is the weather in Melbourne, and what is 19 + 23?";

const result = await runAgent(prompt);

console.log("Tool calls:");
for (const call of result.toolCalls) {
  console.log(`- ${call.name}(${JSON.stringify(call.input)}) => ${call.result}`);
}
console.log("\nFinal reply:\n" + result.text);
