import type { WebEnv } from "@labs/infra/alchemy.run";

// Infer Cloudflare Worker env from the alchemy 2.x Website resource.
// @see https://alchemy.run/concepts/bindings/#type-safe-bindings

export type CloudflareEnv = WebEnv;

declare global {
  type Env = CloudflareEnv;
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
}
