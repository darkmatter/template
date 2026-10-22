import { Effect } from "effect";
import { expect, it } from "vite-plus/test";
import { add } from "./index.ts";

it("adds two numbers", () => {
  expect(Effect.runSync(add(2, 2))).toBe(4);
});
