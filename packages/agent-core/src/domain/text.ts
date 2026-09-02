import { normalizedBoundedString } from "./strings.ts";

export const Goal = normalizedBoundedString(1, 4_096);
export type Goal = typeof Goal.Type;
