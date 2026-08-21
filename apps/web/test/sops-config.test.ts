import { assert, it } from "@effect/vitest";
import type { SopsCommandRequest } from "alchemy-sops";
import { AppConfig } from "@repo/web-core";
import { ConfigProvider, Effect } from "effect";

import { makeAppConfigLive } from "../src/config.ts";

it.effect("loads the existing app config through the SOPS fallback", () => {
  const requests: SopsCommandRequest[] = [];
  const provider = ConfigProvider.fromUnknown({
    APP_ENV: "test",
    APP_SOPS_FILE: "ops/secrets/demo.sops.yaml",
  });
  const config = makeAppConfigLive({
    provider,
    decrypt: (request) =>
      Effect.sync(() => {
        requests.push(request);
        return "stringData:\n  DEMO_MESSAGE: synthetic-provider-value\n";
      }),
  });

  return Effect.gen(function* () {
    const appConfig = yield* AppConfig;

    assert.strictEqual(appConfig.environment, "test");
    assert.strictEqual(appConfig.demoMessageConfigured, true);
    assert.strictEqual(requests.length, 1);

    const request = requests[0]!;
    assert.match(request.path ?? "", /ops\/secrets\/demo\.sops\.yaml$/);
    assert.strictEqual(request.binary, "sops");
    assert.strictEqual(request.inputType, "yaml");
    assert.strictEqual(request.outputType, "yaml");
  }).pipe(Effect.provide(config));
});

it.effect("keeps environment config primary without decrypting SOPS", () => {
  let decryptions = 0;
  const provider = ConfigProvider.fromUnknown({
    HOST: "127.0.0.1",
    PORT: "3000",
    APP_ENV: "test",
    APP_RELEASE: "test",
    APP_SOPS_FILE: "ops/secrets/demo.sops.yaml",
    DEMO_MESSAGE: "from-environment",
  });
  const config = makeAppConfigLive({
    provider,
    decrypt: () => {
      decryptions += 1;
      return Effect.succeed("stringData:\n  DEMO_MESSAGE: unused\n");
    },
  });

  return Effect.gen(function* () {
    const appConfig = yield* AppConfig;

    assert.strictEqual(appConfig.demoMessageConfigured, true);
    assert.strictEqual(decryptions, 0);
  }).pipe(Effect.provide(config));
});
