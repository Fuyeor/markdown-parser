// @ffm/parser/src/core/color.ts

const valid =
  /^(?:#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|(?:rgb|hsl)a?\([\d\s,%.]+\))$/;

// Keep code_color values within the supported CSS color grammar.
export function isSafeColorValue(value: string): boolean {
  return valid.test(value);
}
