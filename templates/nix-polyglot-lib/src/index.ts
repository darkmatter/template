import { Effect } from "effect";

export const add = (left: number, right: number) =>
  Effect.succeed(left + right);
