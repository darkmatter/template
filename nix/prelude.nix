{self, ...}: {
  prelude = {
    theme = "minted";
    colorProfile = "auto";
    project = "effect-agent-harness";

    commands = {
      install = {
        exec = "bun install";
        description = "Install workspace dependencies";
        key = "i";
        motd = 1;
      };

      dev = {
        exec = "bun run dev";
        description = "Run the Effect/Bun demo server";
        details = "Serves /api/status, /api/metrics, and the static front page.";
        motd = 2;
      };

      cli = {
        exec = "bun run cli";
        description = "Run the deterministic agent harness CLI";
        details = "Try: x cli run --events 'Explain the harness'";
      };

      harnessd = {
        exec = "bun run harnessd";
        description = "Run the typed Effect/Bun harness daemon";
        details = "Serves /health, /status, /runs, and /openapi.json on :4319.";
      };

      check = {
        exec = "bun run check";
        description = "Typecheck with tsgo";
        key = "c";
      };

      test = {
        exec = "bun run test";
        description = "Run deterministic Effect/Vitest tests";
        details = "Always `bun run test` — never `bun test`.";
        key = "t";
        motd = 3;
      };

      "test:rust" = {
        exec = "cargo test --workspace";
        description = "Test the Rust process supervisor";
      };

      lint = {
        exec = "bun run lint";
        description = "Lint with oxlint + tsgolint";
      };

      fmt = {
        exec = "nix fmt";
        description = "Format with treefmt (alejandra, oxfmt)";
      };

      "ops:container-config" = {
        exec = "docker compose -f ops/compose/local.yaml config";
        description = "Validate the local Compose stack";
      };
    };

    motd = {
      enable = true;
      width = "full";
      maxWidth = 90;
      header = {
        tagline = {
          text = "clean Effect architecture + a supervised Rust edge";
        };
        status = {
          ready = {
            label = "devshell";
            status = "ready";
          };
          bun = {
            order = 100;
            label = "bun";
            check = "bun --version >/dev/null";
            async = true;
            ok = "ok";
            fail = "missing";
            failLevel = "warning";
          };
        };
      };
      description = {
        text = ''
          You are inside the nix devshell — Bun, Rust, oxc, tsgo, and project
          commands are on PATH. Run `x` to browse commands, `docs` for notes.
        '';
      };
      env = [
        {
          label = "bun";
          probe = "bun --version 2>/dev/null | head -1";
        }
        {
          label = "typescript";
          value = "7 + tsgo";
        }
        {
          label = "lint";
          value = "oxlint";
        }
      ];
    };

    menu.enable = true;
    prompt.enable = true;

    docs.pages = [
      {text = self + /docs/getting-started.md;}
      {text = self + /docs/architecture.md;}
      {text = self + /README.md;}
      {text = self + /AGENTS.md;}
      {text = self + /ops/README.md;}
    ];

    sort.groups = [
      "develop"
      "ops"
    ];
  };
}
