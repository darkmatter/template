import { recordStatus } from "#runtime.ts";

export const GET = async (): Promise<Response> =>
  Response.json(await recordStatus());
