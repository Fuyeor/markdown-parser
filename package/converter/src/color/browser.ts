// @ffm/converter/src/color/browser.ts

// [Browser Console Manual Verification Snippet]
// Paste the following into your browser DevTools Console to test:

// (() => {
//   const canvas = document.createElement('canvas');
//   const ctx = canvas.getContext('2d');
//   const testColor = (val) => {
//     ctx.fillStyle = '#000000'; ctx.fillStyle = val; const f = ctx.fillStyle;
//     ctx.fillStyle = '#ffffff'; ctx.fillStyle = val; const s = ctx.fillStyle;
//     if (f === '#000000' && s === '#ffffff') return null;
//     return s;
//   };
//   console.assert(testColor('ABCD') === null, 'Should reject invalid color');
//   console.assert(testColor('red') === '#ff0000', 'Should resolve named color');
//   console.assert(testColor('rgba(255, 0, 0, 0.5)') === 'rgba(255, 0, 0, 0.5)', 'Should resolve rgba');
//   console.log('✅ All browser color tests passed!');
// })();

let canvasContext: CanvasRenderingContext2D | null = null;

/**
 * Normalize any valid CSS color string to canonical hex in browser environments.
 * Uses Dual-Sentinel detection to reject invalid colors.
 */
export function parseColorInBrowser(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (
    !normalized ||
    normalized === 'transparent' ||
    normalized.includes('var(')
  ) {
    return null;
  }

  if (!canvasContext) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    canvasContext = canvas.getContext('2d', { willReadFrequently: true });
  }

  if (!canvasContext) return null;

  canvasContext.fillStyle = '#000000';
  canvasContext.fillStyle = normalized;
  const first = canvasContext.fillStyle;

  canvasContext.fillStyle = '#ffffff';
  canvasContext.fillStyle = normalized;
  const second = canvasContext.fillStyle;

  if (first === '#000000' && second === '#ffffff') return null;

  const resolved = second;
  if (resolved.startsWith('#')) return resolved;

  // resolve rgba / rgb format
  const match = resolved.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/u,
  );
  if (!match) return null;

  const r = Number(match[1]).toString(16).padStart(2, '0');
  const g = Number(match[2]).toString(16).padStart(2, '0');
  const b = Number(match[3]).toString(16).padStart(2, '0');
  const a =
    match[4] !== undefined
      ? Math.round(Number(match[4]) * 255)
          .toString(16)
          .padStart(2, '0')
      : '';

  return a === '00' ? null : `#${r}${g}${b}${a}`;
}

/** Check if a color declaration represents a transparent value in browser. */
export function isTransparentColorInBrowser(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'transparent') return true;
  const resolved = parseColorInBrowser(normalized);
  if (!resolved) return false;
  return resolved.length === 9 && resolved.endsWith('00');
}
