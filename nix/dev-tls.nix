# Dev TLS certificates, shared through SOPS.
#
# A flake-parts module. Enable it and the devshell gains two commands:
#
#   dev-tls              materialise the shared certificate onto this machine
#   dev-tls issue        mint a fresh one from the internal step-ca
#   dev-tls issue --save ...and re-encrypt it so everyone gets the same one
#   sops-init            fetch the default .sops.yaml from gist.dm.sh
#
# Why share the certificate instead of committing it, or having every machine
# issue its own:
#
#   The certificate is public — committing the .crt would be harmless. The
#   private key is the credential, and because every developer's machine trusts
#   the internal CA, whoever holds that key can present a valid-looking
#   <hostname> to anyone whose name resolution they can influence. The trust
#   that makes the certificate useful is exactly what makes a leaked key
#   dangerous, and git history is permanent — a committed key needs a history
#   rewrite plus CA revocation rather than a re-issue.
#
#   So it lives in SOPS: encrypted at rest, and scoped by a creation_rule to the
#   people who need it. Add a rule for the file to .sops.yaml that omits CI and
#   production keys; neither has any use for a MITM-capable dev credential.
#
# Serving TLS in dev is not cosmetic when passkeys are involved: a WebAuthn
# credential is bound to one relying party, derived from the origin, so reaching
# a dev server by a name other than `hostname` is rejected by the browser before
# any prompt appears — with nothing in the UI to explain it.
{ flake-parts-lib, ... }:
{
  options.perSystem = flake-parts-lib.mkPerSystemOption (
    {
      config,
      pkgs,
      lib,
      ...
    }:
    let
      cfg = config.devTls;
      sans = lib.unique ([ cfg.hostname ] ++ cfg.extraSans);
      sanArgs = lib.concatMapStringsSep " " (san: "--san ${lib.escapeShellArg san}") sans;
    in
    {
      options.devTls = {
        enable = lib.mkEnableOption "the dev TLS certificate helper";

        hostname = lib.mkOption {
          type = lib.types.str;
          example = "iridium.lan";
          description = ''
            The name the dev server is reached by. Also the certificate's common
            name and the file stem under `stateDir`.

            With MagicDNS, `*.lan` resolves to 127.0.0.1, so this is loopback
            only: it always means the machine the browser runs on.
          '';
        };

        extraSans = lib.mkOption {
          type = lib.types.listOf lib.types.str;
          default = [
            "localhost"
            "127.0.0.1"
          ];
          description = ''
            Additional names the certificate must cover. Keep this in step with
            the origins the app's auth layer trusts — every entry is a distinct
            browser origin.
          '';
        };

        stateDir = lib.mkOption {
          type = lib.types.str;
          default = "$HOME/.config/dev-tls";
          description = ''
            Where the certificate and key are written, deliberately outside the
            repository so the key cannot be committed. Expanded by the shell, so
            `$HOME` is fine. Created 0700; files written 0600.
          '';
        };

        sopsFile = lib.mkOption {
          type = lib.types.str;
          default = "ops/secrets/dev-tls.sops.yaml";
          description = "Repo-relative path to the SOPS-encrypted certificate.";
        };

        caUrl = lib.mkOption {
          type = lib.types.str;
          default = "https://ca.drkmttr.dev";
          description = "step-ca URL, used only when issuing.";
        };

        sopsBootstrapUrl = lib.mkOption {
          type = lib.types.str;
          default = "https://gist.dm.sh/.sops.yaml";
          description = ''
            Where `sops-init` fetches the default recipient set from. Serves the
            shared KMS dev key plus the tailnet key service, so a new project
            starts with recipients that cannot lock anyone out.
          '';
        };
      };

      config = lib.mkIf cfg.enable {
        packages.dev-tls = pkgs.writeShellApplication {
          name = "dev-tls";
          runtimeInputs = [
            pkgs.sops
            pkgs.step-cli
            pkgs.coreutils
          ];
          text = ''
            set -euo pipefail

            state_dir="${cfg.stateDir}"
            crt="$state_dir/${cfg.hostname}.crt"
            key="$state_dir/${cfg.hostname}.key"
            sops_file="${cfg.sopsFile}"

            # 0700: the private key lives here. chmod separately from mkdir -p,
            # whose -m only applies to the deepest directory (SC2174).
            mkdir -p "$state_dir"
            chmod 700 "$state_dir"

            materialise() {
              if [ ! -f "$sops_file" ]; then
                echo "$sops_file not found. Mint one instead:" >&2
                echo "  dev-tls issue --save" >&2
                exit 1
              fi
              # --extract avoids holding the decrypted document as a whole.
              for field in cert key; do
                case "$field" in
                  cert) dest="$crt" ;;
                  key)  dest="$key" ;;
                esac
                umask 077
                if ! sops -d --extract "[\"$field\"]" "$sops_file" > "$dest"; then
                  echo "Could not decrypt $field from $sops_file." >&2
                  echo "Is your SOPS key available? See sops-init." >&2
                  rm -f "$dest"
                  exit 1
                fi
              done
              echo "materialised ${cfg.hostname} certificate from $sops_file"
            }

            issue() {
              local provisioner=()
              # Without this step prompts to choose one, which is fine interactively.
              if [ -n "''${STEP_PROVISIONER:-}" ]; then
                provisioner=(--provisioner "$STEP_PROVISIONER")
              fi
              umask 077
              step ca certificate ${lib.escapeShellArg cfg.hostname} "$crt" "$key" \
                --ca-url ${lib.escapeShellArg cfg.caUrl} \
                ${sanArgs} "''${provisioner[@]}" --force
              echo "issued ${cfg.hostname} for: ${lib.concatStringsSep ", " sans}"
            }

            save() {
              # Piped through stdin so the plaintext never touches disk.
              {
                echo "# Dev TLS certificate for ${cfg.hostname}, from the internal step-ca."
                echo "# Materialise with \`dev-tls\`. Scope recipients in .sops.yaml."
                echo "cert: |"
                sed 's/^/  /' "$crt"
                echo "key: |"
                sed 's/^/  /' "$key"
              } | sops -e --filename-override "$sops_file" /dev/stdin > "$sops_file.tmp"
              mv "$sops_file.tmp" "$sops_file"
              echo "wrote $sops_file — commit it to share this certificate"
            }

            case "''${1:-materialise}" in
              materialise) materialise ;;
              issue)
                issue
                # shellcheck disable=SC2199
                if [[ " ''${*} " == *" --save "* ]]; then save; fi
                ;;
              *)
                echo "usage: dev-tls [issue [--save]]" >&2
                exit 2
                ;;
            esac

            echo "$crt"
            echo "$key"
          '';
        };

        packages.sops-init = pkgs.writeShellApplication {
          name = "sops-init";
          runtimeInputs = [ pkgs.curl ];
          text = ''
            set -euo pipefail

            if [ -f .sops.yaml ]; then
              echo ".sops.yaml already exists; leaving it alone."
              echo "Refresh the defaults deliberately with:"
              echo "  curl -sfL ${cfg.sopsBootstrapUrl} > .sops.yaml"
              exit 0
            fi

            curl -sfL ${lib.escapeShellArg cfg.sopsBootstrapUrl} > .sops.yaml
            echo "wrote .sops.yaml from ${cfg.sopsBootstrapUrl}"
            echo
            echo "It grants the shared KMS dev key and the tailnet key service."
            echo "Before storing dev TLS material, add a creation_rule for"
            echo "${cfg.sopsFile} scoped to people — not CI, not production."
          '';
        };
      };
    }
  );
}
