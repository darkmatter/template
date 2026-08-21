import { assert, describe, it } from "@effect/vitest";
import * as Clock from "effect/Clock";
import * as Effect from "effect/Effect";

describe("Effect test contract", () => {
  it.effect("provides TestClock at zero", () =>
    Effect.gen(function* () {
      assert.strictEqual(yield* Clock.currentTimeMillis, 0);
    }),
  );
});
