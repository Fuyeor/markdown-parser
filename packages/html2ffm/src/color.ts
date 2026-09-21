// @fuyeor/html2ffm/src/color.ts
import { cssNamedColors } from './constants';
import type { Rgba } from './types';

// Convert one clamped color channel to a two-digit lowercase hexadecimal value.
function normalizeHexChannel(channel: number): string {
  return Math.max(0, Math.min(255, Math.round(channel)))
    .toString(16)
    .padStart(2, '0');
}

export function rgbaToHex(color: Rgba, forceAlpha = false): string | null {
  if (color.alpha <= 0) return null;
  const red = normalizeHexChannel(color.red);
  const green = normalizeHexChannel(color.green);
  const blue = normalizeHexChannel(color.blue);
  if (color.alpha >= 1 && !forceAlpha) return `#${red}${green}${blue}`;
  return `#${red}${green}${blue}${normalizeHexChannel(color.alpha * 255)}`;
}

// Parse CSS numeric or percentage channels into a bounded numeric range.
function parsePercentageOrNumber(value: string, scale: number): number | null {
  const trimmed = value.trim();
  if (trimmed.endsWith('%')) {
    const percentage = Number(trimmed.slice(0, -1));
    return Number.isFinite(percentage)
      ? Math.max(0, Math.min(scale, (percentage / 100) * scale))
      : null;
  }
  const number = Number(trimmed);
  return Number.isFinite(number) ? Math.max(0, Math.min(scale, number)) : null;
}

function parseAlpha(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.endsWith('%')) {
    const percentage = Number(trimmed.slice(0, -1));
    return Number.isFinite(percentage)
      ? Math.max(0, Math.min(1, percentage / 100))
      : null;
  }
  const number = Number(trimmed);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : null;
}

// Split modern space-separated and legacy comma-separated CSS color arguments.
function splitFunctionalColorArguments(value: string): string[] | null {
  const body = value.slice(value.indexOf('(') + 1, -1).trim();
  if (!body) return null;
  if (body.includes(',')) return body.split(',').map((part) => part.trim());
  const slashIndex = body.indexOf('/');
  const channels = (slashIndex === -1 ? body : body.slice(0, slashIndex))
    .trim()
    .split(/\s+/u);
  if (slashIndex === -1) return channels;
  return [...channels, body.slice(slashIndex + 1).trim()];
}

export function parseRgbColor(value: string): Rgba | null {
  const argumentsList = splitFunctionalColorArguments(value);
  if (
    !argumentsList ||
    (argumentsList.length !== 3 && argumentsList.length !== 4)
  )
    return null;
  const red = parsePercentageOrNumber(argumentsList[0]!, 255);
  const green = parsePercentageOrNumber(argumentsList[1]!, 255);
  const blue = parsePercentageOrNumber(argumentsList[2]!, 255);
  const alpha = argumentsList.length === 4 ? parseAlpha(argumentsList[3]!) : 1;
  if (red === null || green === null || blue === null || alpha === null)
    return null;
  return { red, green, blue, alpha };
}

function parseHue(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  const match = trimmed.match(
    /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(deg|grad|rad|turn)?$/u,
  );
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  const turns =
    match[2] === 'grad'
      ? amount / 400
      : match[2] === 'rad'
        ? amount / (2 * Math.PI)
        : match[2] === 'turn'
          ? amount
          : amount / 360;
  return ((turns % 1) + 1) % 1;
}

function hueToRgb(p: number, q: number, t: number): number {
  let value = t;
  if (value < 0) value += 1;
  if (value > 1) value -= 1;
  if (value < 1 / 6) return p + (q - p) * 6 * value;
  if (value < 1 / 2) return q;
  if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
  return p;
}

export function parseHslColor(value: string): Rgba | null {
  const argumentsList = splitFunctionalColorArguments(value);
  if (
    !argumentsList ||
    (argumentsList.length !== 3 && argumentsList.length !== 4)
  )
    return null;
  const hue = parseHue(argumentsList[0]!);
  const saturation = argumentsList[1]!.trim();
  const lightness = argumentsList[2]!.trim();
  if (hue === null || !saturation.endsWith('%') || !lightness.endsWith('%'))
    return null;
  const saturationNumber = Number(saturation.slice(0, -1));
  const lightnessNumber = Number(lightness.slice(0, -1));
  const alpha = argumentsList.length === 4 ? parseAlpha(argumentsList[3]!) : 1;
  if (
    !Number.isFinite(saturationNumber) ||
    !Number.isFinite(lightnessNumber) ||
    alpha === null
  )
    return null;
  const s = Math.max(0, Math.min(100, saturationNumber)) / 100;
  const l = Math.max(0, Math.min(100, lightnessNumber)) / 100;
  if (s === 0) {
    const channel = l * 255;
    return { red: channel, green: channel, blue: channel, alpha };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    red: hueToRgb(p, q, hue + 1 / 3) * 255,
    green: hueToRgb(p, q, hue) * 255,
    blue: hueToRgb(p, q, hue - 1 / 3) * 255,
    alpha,
  };
}

// Normalize supported CSS colors into FFM-compatible hexadecimal notation.
export function parseColor(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.includes('var(')) return null;

  const named = cssNamedColors[normalized];
  if (named) return named;
  if (normalized === 'transparent') return null;

  const hexMatch = normalized.match(/^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/u);
  if (hexMatch) {
    const source = hexMatch[1]!;
    const expanded =
      source.length <= 4
        ? [...source].map((character) => `${character}${character}`).join('')
        : source;
    return rgbaToHex(
      {
        red: Number.parseInt(expanded.slice(0, 2), 16),
        green: Number.parseInt(expanded.slice(2, 4), 16),
        blue: Number.parseInt(expanded.slice(4, 6), 16),
        alpha:
          expanded.length === 8
            ? Number.parseInt(expanded.slice(6, 8), 16) / 255
            : 1,
      },
      expanded.length === 8,
    );
  }

  if (/^rgba?\(/u.test(normalized)) {
    const color = parseRgbColor(normalized);
    return color ? rgbaToHex(color, /^rgba\(/u.test(normalized)) : null;
  }
  if (/^hsla?\(/u.test(normalized)) {
    const color = parseHslColor(normalized);
    return color ? rgbaToHex(color, /^hsla\(/u.test(normalized)) : null;
  }
  return null;
}

export function isTransparentColor(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'transparent') return true;
  const hexMatch = normalized.match(/^#([\da-f]{4}|[\da-f]{8})$/u);
  if (hexMatch) {
    const source = hexMatch[1]!;
    const alpha =
      source.length === 4 ? `${source[3]}${source[3]}` : source.slice(6, 8);
    return alpha === '00';
  }
  const color = /^rgba?\(/u.test(normalized)
    ? parseRgbColor(normalized)
    : /^hsla?\(/u.test(normalized)
      ? parseHslColor(normalized)
      : null;
  return color !== null && color.alpha <= 0;
}
