import * as Cloudflare from "alchemy/Cloudflare";

export const RunQueue = Cloudflare.Queues.Queue("RunQueue");
