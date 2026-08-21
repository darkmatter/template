import { expect } from "@effect/vitest";
import * as Test from "alchemy/Test/Vitest";
import { SopsFileProvider, type SopsCommandRequest } from "alchemy-sops";
import * as Effect from "effect/Effect";
import * as Redacted from "effect/Redacted";

import { program } from "./app.ts";

// oxlint-disable effecttsgo/any-unknown-in-error-context -- Alchemy's provider test stack exposes an `any` error channel.

const requests: SopsCommandRequest[] = [];
const { test } = Test.make({
  providers: SopsFileProvider({
    decrypt: (request) =>
      Effect.sync(() => {
        requests.push(request);
        return [
          "apiVersion: v1",
          "kind: Secret",
          "metadata:",
          "  name: provider-test",
          "stringData:",
          "  DEMO_MESSAGE: synthetic-provider-value",
        ].join("\n");
      }),
  }),
});

test.provider(
  "reads the template SOPS source with normalized options",
  (stack) =>
    Effect.gen(function* () {
      requests.length = 0;

      const deployed = yield* stack.deploy(
        program(Redacted.make("synthetic-test-identity")),
      );

      expect(deployed.configured).toBe(true);
      expect(deployed.topLevelKeys).toEqual([
        "apiVersion",
        "kind",
        "metadata",
        "stringData",
      ]);
      expect(requests).toHaveLength(1);

      const request = requests[0]!;
      expect(request.path).toMatch(/ops\/secrets\/demo\.sops\.yaml$/);
      expect(request.binary).toBe("sops");
      expect(request.inputType).toBeUndefined();
      expect(request.outputType).toBe("yaml");
      expect(request.content).toContain("ENC[");
      expect(Redacted.isRedacted(request.env?.SOPS_AGE_KEY)).toBe(true);

      yield* stack.destroy();
    }).pipe(Effect.orDie),
);
