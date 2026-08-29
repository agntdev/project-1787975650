import { describe, expect, it } from "vitest";
import { buildBot } from "../src/bot.js";
import { runSpecs } from "../src/toolkit/index.js";

describe("quote requests", () => {
  it("serves more than one hundred repeated quote requests", async () => {
    const suite = await runSpecs(() => buildBot("test-token"), [
      {
        name: "101 quote requests remain available",
        steps: Array.from({ length: 101 }, () => ({
          send: { text: "उद्धरण" },
          expect: [{ method: "sendMessage" as const }],
        })),
      },
    ]);
    expect(suite.failed).toBe(0);
    expect(suite.passed).toBe(1);
  });
});
