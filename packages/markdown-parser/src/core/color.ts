// @fuyeor/markdown-parser/src/core/color.ts

const COLOR_VALUE_REGEX =
  /^(?:#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|(?:rgb|hsl)a?\([\d\s,%.]+\))$/;

// Keep color_code values within the supported CSS color grammar.
export function isSafeColorValue(value: string): boolean {
  return COLOR_VALUE_REGEX.test(value);
}
