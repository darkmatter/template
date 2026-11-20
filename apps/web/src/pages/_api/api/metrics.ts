import { recordMetrics } from "#runtime.ts";

export const GET = async (): Promise<Response> =>
  new Response(await recordMetrics(), {
    headers: { "content-type": "text/plain; version=0.0.4; charset=utf-8" },
  });
