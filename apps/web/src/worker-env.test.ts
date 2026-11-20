import { assert, it } from "@effect/vitest";
import type { SopsCommandRequest } from "alchemy-sops";
import { ConfigProvider, Effect, Redacted } from "effect";

import { workerEnv } from "#worker-env.ts";

it.effect(
  "reads DEMO_MESSAGE from the SOPS file behind the environment",
  () => {
    const requests: SopsCommandRequest[] = [];
    const provider = ConfigProvider.fromUnknown({
      APP_SOPS_FILE: "ops/secrets/demo.sops.yaml",
    });

    return Effect.gen(function* () {
      const env = yield* workerEnv("staging", {
        decrypt: (request) =>
          Effect.sync(() => {
            requests.push(request);
            return "stringData:\n  DEMO_MESSAGE: synthetic-provider-value\n";
          }),
      });

      assert.strictEqual(env.APP_ENV, "staging");
      assert.strictEqual(env.APP_RELEASE, "staging");
      assert.isDefined(env.DEMO_MESSAGE);
      assert.strictEqual(
        Redacted.value(env.DEMO_MESSAGE!),
        "synthetic-provider-value",
      );
      assert.strictEqual(requests.length, 1);
      assert.match(requests[0]!.path ?? "", /ops\/secrets\/demo\.sops\.yaml$/);
    }).pipe(Effect.provide(ConfigProvider.layer(provider)));
  },
);

it.effect("keeps the environment primary without decrypting SOPS", () => {
  let decryptions = 0;
  const provider = ConfigProvider.fromUnknown({
    APP_RELEASE: "sha-test",
    APP_SOPS_FILE: "ops/secrets/demo.sops.yaml",
    DEMO_MESSAGE: "from-environment",
  });

  return Effect.gen(function* () {
    const env = yield* workerEnv("pr-12", {
      decrypt: () => {
        decryptions += 1;
        return Effect.succeed("stringData:\n  DEMO_MESSAGE: unused\n");
      },
    });

    assert.strictEqual(env.APP_ENV, "development");
    assert.strictEqual(env.APP_RELEASE, "sha-test");
    assert.strictEqual(Redacted.value(env.DEMO_MESSAGE!), "from-environment");
    assert.strictEqual(decryptions, 0);
  }).pipe(Effect.provide(ConfigProvider.layer(provider)));
});
