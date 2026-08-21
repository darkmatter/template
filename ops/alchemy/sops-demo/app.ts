import * as Output from "alchemy/Output";
import { SopsFile, type SecretStringInput } from "alchemy-sops";
import * as Effect from "effect/Effect";

const secretsPath = new URL("../../secrets/demo.sops.yaml", import.meta.url)
  .pathname;

export const program = (ageKey: SecretStringInput) =>
  Effect.gen(function* () {
    const secrets = yield* SopsFile("DemoSecrets", {
      path: secretsPath,
      format: "yaml",
      backend: "sops-age",
      ageKey,
      secrets: { DEMO_MESSAGE: "stringData.DEMO_MESSAGE" },
    });

    return {
      configured: Output.map(
        secrets.secrets,
        (values) => values.DEMO_MESSAGE !== undefined,
      ),
      sourceHash: secrets.sourceHash,
      topLevelKeys: secrets.topLevelKeys,
    };
  });
