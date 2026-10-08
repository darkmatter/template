import { Schema, SchemaGetter } from "effect";

export const normalizedBoundedString = (minimum: number, maximum: number) =>
  Schema.String.check(Schema.isBetweenLength(minimum, maximum)).pipe(
    Schema.decode({
      decode: SchemaGetter.transform((value) => value.trim()),
      encode: SchemaGetter.transform((value) => value.trim()),
    }),
  );
