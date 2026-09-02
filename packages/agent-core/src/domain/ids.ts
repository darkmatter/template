import { Schema } from "effect";

import { normalizedBoundedString } from "./strings.ts";

export const RunId = normalizedBoundedString(1, 128).pipe(
  Schema.brand("RunId"),
);
export type RunId = typeof RunId.Type;

export const ToolCallId = normalizedBoundedString(1, 256).pipe(
  Schema.brand("ToolCallId"),
);
export type ToolCallId = typeof ToolCallId.Type;
