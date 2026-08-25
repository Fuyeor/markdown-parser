// packages/html2ffm/src/index.ts
import { parseDocument } from 'htmlparser2';
import { format } from '@fuyeor/markdown-formatter';

type ParsedDocument = ReturnType<typeof parseDocument>;
type ChildNode = ParsedDocument['children'][number];

type ElementNode = ChildNode & {
  name: string;
  attribs: Record<string, string>;
  children: ChildNode[];
};

type TextNode = ChildNode & {
  data: string;
};

type Style = {
  color?: string | null;
  fontSize?: string;
};

type Marks = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  link?: string;
};

type InlinePiece = {
  content: string;
  style: Style;
  marks: Marks;
};

type Rgba = {
  red: number;
  green: number;
  blue: number;
  alpha: number;
};

const BLOCK_TAGS = new Set([
  'article',
  'aside',
  'blockquote',
  'div',
  'footer',
  'header',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'ul',
]);

const DROPPED_TAGS = new Set(['math', 'script', 'style', 'svg', 'template']);
const HEADING_PATTERN = /^h([1-6])$/u;
const CSS_LENGTH_PATTERN =
  /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em|%|pt|pc|in|cm|mm|q|ch|ex|cap|ic|lh|rlh|vw|vh|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|vi|vb)$/iu;
const SAFE_SCHEME_PATTERN = /^(?:https?:|mailto:|tel:|ftp:)/iu;
const DANGEROUS_URL_PATTERN = /^(?:javascript:|data:|vbscript:|file:)/iu;

// Keep the named-color table local so the browser bundle does not need a color dependency.
const CSS_NAMED_COLORS: Readonly<Record<string, string>> = {
  aliceblue: '#f0f8ff',
  antiquewhite: '#faebd7',
  aqua: '#00ffff',
  aquamarine: '#7fffd4',
  azure: '#f0ffff',
  beige: '#f5f5dc',
  bisque: '#ffe4c4',
  black: '#000000',
  blanchedalmond: '#ffebcd',
  blue: '#0000ff',
  blueviolet: '#8a2be2',
  brown: '#a52a2a',
  burlywood: '#deb887',
  cadetblue: '#5f9ea0',
  chartreuse: '#7fff00',
  chocolate: '#d2691e',
  coral: '#ff7f50',
  cornflowerblue: '#6495ed',
  cornsilk: '#fff8dc',
  crimson: '#dc143c',
  cyan: '#00ffff',
  darkblue: '#00008b',
  darkcyan: '#008b8b',
  darkgoldenrod: '#b8860b',
  darkgray: '#a9a9a9',
  darkgreen: '#006400',
  darkgrey: '#a9a9a9',
  darkkhaki: '#bdb76b',
  darkmagenta: '#8b008b',
  darkolivegreen: '#556b2f',
  darkorange: '#ff8c00',
  darkorchid: '#9932cc',
  darkred: '#8b0000',
  darksalmon: '#e9967a',
  darkseagreen: '#8fbc8f',
  darkslateblue: '#483d8b',
  darkslategray: '#2f4f4f',
  darkslategrey: '#2f4f4f',
  darkturquoise: '#00ced1',
  darkviolet: '#9400d3',
  deeppink: '#ff1493',
  deepskyblue: '#00bfff',
  dimgray: '#696969',
  dimgrey: '#696969',
  dodgerblue: '#1e90ff',
  firebrick: '#b22222',
  floralwhite: '#fffaf0',
  forestgreen: '#228b22',
  fuchsia: '#ff00ff',
  gainsboro: '#dcdcdc',
  ghostwhite: '#f8f8ff',
  gold: '#ffd700',
  goldenrod: '#daa520',
  gray: '#808080',
  green: '#008000',
  greenyellow: '#adff2f',
  grey: '#808080',
  honeydew: '#f0fff0',
  hotpink: '#ff69b4',
  indianred: '#cd5c5c',
  indigo: '#4b0082',
  ivory: '#fffff0',
  khaki: '#f0e68c',
  lavender: '#e6e6fa',
  lavenderblush: '#fff0f5',
  lawngreen: '#7cfc00',
  lemonchiffon: '#fffacd',
  lightblue: '#add8e6',
  lightcoral: '#f08080',
  lightcyan: '#e0ffff',
  lightgoldenrodyellow: '#fafad2',
  lightgray: '#d3d3d3',
  lightgreen: '#90ee90',
  lightgrey: '#d3d3d3',
  lightpink: '#ffb6c1',
  lightsalmon: '#ffa07a',
  lightseagreen: '#20b2aa',
  lightskyblue: '#87cefa',
  lightslategray: '#778899',
  lightslategrey: '#778899',
  lightsteelblue: '#b0c4de',
  lightyellow: '#ffffe0',
  lime: '#00ff00',
  limegreen: '#32cd32',
  linen: '#faf0e6',
  magenta: '#ff00ff',
  maroon: '#800000',
  mediumaquamarine: '#66cdaa',
  mediumblue: '#0000cd',
  mediumorchid: '#ba55d3',
  mediumpurple: '#9370db',
  mediumseagreen: '#3cb371',
  mediumslateblue: '#7b68ee',
  mediumspringgreen: '#00fa9a',
  mediumturquoise: '#48d1cc',
  mediumvioletred: '#c71585',
  midnightblue: '#191970',
  mintcream: '#f5fffa',
  mistyrose: '#ffe4e1',
  moccasin: '#ffe4b5',
  navajowhite: '#ffdead',
  navy: '#000080',
  oldlace: '#fdf5e6',
  olive: '#808000',
  olivedrab: '#6b8e23',
  orange: '#ffa500',
  orangered: '#ff4500',
  orchid: '#da70d6',
  palegoldenrod: '#eee8aa',
  palegreen: '#98fb98',
  paleturquoise: '#afeeee',
  palevioletred: '#db7093',
  papayawhip: '#ffefd5',
  peachpuff: '#ffdab9',
  peru: '#cd853f',
  pink: '#ffc0cb',
  plum: '#dda0dd',
  powderblue: '#b0e0e6',
  purple: '#800080',
  rebeccapurple: '#663399',
  red: '#ff0000',
  rosybrown: '#bc8f8f',
  royalblue: '#4169e1',
  saddlebrown: '#8b4513',
  salmon: '#fa8072',
  sandybrown: '#f4a460',
  seagreen: '#2e8b57',
  seashell: '#fff5ee',
  sienna: '#a0522d',
  silver: '#c0c0c0',
  skyblue: '#87ceeb',
  slateblue: '#6a5acd',
  slategray: '#708090',
  slategrey: '#708090',
  snow: '#fffafa',
  springgreen: '#00ff7f',
  steelblue: '#4682b4',
  tan: '#d2b48c',
  teal: '#008080',
  thistle: '#d8bfd8',
  tomato: '#ff6347',
  turquoise: '#40e0d0',
  violet: '#ee82ee',
  wheat: '#f5deb3',
  white: '#ffffff',
  whitesmoke: '#f5f5f5',
  yellow: '#ffff00',
  yellowgreen: '#9acd32',
};

const EMPTY_MARKS: Marks = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
};

// Narrow a parsed node to an element with attributes and children.
function isElement(node: ChildNode): node is ElementNode {
  return 'name' in node && 'attribs' in node && 'children' in node;
}

// Narrow a parsed node to a text node without depending on parser internals.
function isTextNode(node: ChildNode): node is TextNode {
  return 'data' in node && !('name' in node);
}

function cloneMarks(marks: Marks, patch: Partial<Marks>): Marks {
  return { ...marks, ...patch };
}

function cloneStyle(style: Style): Style {
  return { ...style };
}

// Identify explicit blocks and unknown wrappers that contain block descendants.
function isBlockElement(element: ElementNode): boolean {
  if (BLOCK_TAGS.has(element.name)) return true;
  return element.children.some(
    (child) => isElement(child) && isBlockElement(child),
  );
}

function isDroppedElement(element: ElementNode): boolean {
  return DROPPED_TAGS.has(element.name);
}

// Convert one clamped color channel to a two-digit lowercase hexadecimal value.
function normalizeHexChannel(channel: number): string {
  return Math.max(0, Math.min(255, Math.round(channel)))
    .toString(16)
    .padStart(2, '0');
}

function rgbaToHex(color: Rgba, forceAlpha = false): string | null {
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

function parseRgbColor(value: string): Rgba | null {
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

function parseHslColor(value: string): Rgba | null {
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
function parseColor(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.includes('var(')) return null;

  const named = CSS_NAMED_COLORS[normalized];
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

function parseFontSize(value: string): string | null {
  const normalized = value.trim().replace(/\s*!important\s*$/iu, '');
  return CSS_LENGTH_PATTERN.test(normalized) ? normalized : null;
}

function isTransparentColor(value: string): boolean {
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

// Parse supported inline declarations while preserving CSS last-valid semantics.
function parseInlineStyle(value: string | undefined): Style {
  if (!value) return {};
  const style: Style = {};
  for (const declaration of value.split(';')) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) continue;
    const property = declaration.slice(0, colonIndex).trim().toLowerCase();
    const propertyValue = declaration
      .slice(colonIndex + 1)
      .trim()
      .replace(/\s*!important\s*$/iu, '');
    if (property === 'color') {
      const color = parseColor(propertyValue);
      if (color !== null) style.color = color;
      else if (isTransparentColor(propertyValue)) style.color = null;
    } else if (property === 'font-size') {
      const fontSize = parseFontSize(propertyValue);
      if (fontSize !== null) style.fontSize = fontSize;
    }
  }
  return style;
}

function mergeStyle(parent: Style, own: Style): Style {
  return { ...parent, ...own };
}

function styleKey(style: Style): string {
  return `${style.color ?? ''}|${style.fontSize ?? ''}`;
}

function marksKey(marks: Marks): string {
  return `${marks.bold ? '1' : '0'}${marks.italic ? '1' : '0'}${marks.underline ? '1' : '0'}${marks.strike ? '1' : '0'}|${marks.link ?? ''}`;
}

function samePieceFormatting(left: InlinePiece, right: InlinePiece): boolean {
  return (
    styleKey(left.style) === styleKey(right.style) &&
    marksKey(left.marks) === marksKey(right.marks) &&
    !left.content.includes('\n') &&
    !right.content.includes('\n')
  );
}

function applyTextMarks(content: string, marks: Marks): string {
  let result = content;
  if (marks.bold && marks.italic) result = `***${result}***`;
  else if (marks.bold) result = `**${result}**`;
  else if (marks.italic) result = `*${result}*`;
  if (marks.strike) result = `--${result}--`;
  if (marks.underline) result = `__${result}__`;
  return result;
}

function formatStyle(style: Style): string {
  const attributes: string[] = [];
  if (style.color) attributes.push(`color = ${style.color}`);
  if (style.fontSize) attributes.push(`font = {size = ${style.fontSize}}`);
  return attributes.length > 0 ? `(${attributes.join(', ')})` : '';
}

// Merge adjacent compatible pieces and wrap marks before applying overload styles.
function serializePieces(pieces: readonly InlinePiece[]): string {
  const merged: InlinePiece[] = [];
  for (const piece of pieces) {
    if (!piece.content) continue;
    const previous = merged.at(-1);
    if (previous && samePieceFormatting(previous, piece)) {
      previous.content += piece.content;
    } else {
      merged.push({
        content: piece.content,
        style: cloneStyle(piece.style),
        marks: { ...piece.marks },
      });
    }
  }

  let result = '';
  for (let index = 0; index < merged.length; ) {
    const first = merged[index]!;
    const group = [first];
    index++;
    while (index < merged.length) {
      const next = merged[index]!;
      if (
        styleKey(next.style) !== styleKey(first.style) ||
        next.marks.link !== first.marks.link ||
        next.content.includes('\n') ||
        first.content.includes('\n')
      )
        break;
      group.push(next);
      index++;
    }
    const content = group
      .map((piece) => applyTextMarks(piece.content, piece.marks))
      .join('');
    const marked = first.marks.link
      ? `[${content}](${first.marks.link})`
      : content;
    const style = formatStyle(first.style);
    result += style ? `[${marked}]${style}` : marked;
  }
  return result;
}

// Extract descendant text for inline assets while ignoring dropped elements.
function getTextContent(nodes: readonly ChildNode[]): string {
  let result = '';
  for (const node of nodes) {
    if (isTextNode(node)) result += node.data;
    else if (isElement(node) && !isDroppedElement(node))
      result += getTextContent(node.children);
  }
  return result;
}

// Extract preformatted text without interpreting inline markup or styles.
function getPreTextContent(nodes: readonly ChildNode[]): string {
  let result = '';
  for (const node of nodes) {
    if (isTextNode(node)) result += node.data;
    else if (isElement(node) && !isDroppedElement(node))
      result += node.name === 'br' ? '\n' : getPreTextContent(node.children);
  }
  return result;
}

function longestBacktickRun(content: string): number {
  let longest = 0;
  for (const match of content.matchAll(/`+/gu)) {
    longest = Math.max(longest, match[0].length);
  }
  return longest;
}

// Render one inline node with inherited style and formatting state.
function renderInlineNode(
  node: ChildNode,
  style: Style,
  marks: Marks,
): InlinePiece[] {
  if (isTextNode(node)) {
    if (!node.data) return [];
    return [
      { content: node.data, style: cloneStyle(style), marks: { ...marks } },
    ];
  }
  if (!isElement(node) || isDroppedElement(node)) return [];

  const ownStyle = parseInlineStyle(node.attribs.style);
  const nextStyle = mergeStyle(style, ownStyle);
  const name = node.name;
  if (name === 'br') {
    return [
      { content: '\n', style: cloneStyle(nextStyle), marks: { ...marks } },
    ];
  }
  if (name === 'img') {
    const source = node.attribs.src;
    if (!source) return [];
    const alt = node.attribs.alt ?? '';
    return [
      {
        content: `![${alt}](${source})`,
        style: cloneStyle(nextStyle),
        marks: { ...marks },
      },
    ];
  }
  if (name === 'code') {
    const code = getTextContent(node.children);
    if (!code) return [];
    const fence = '`'.repeat(Math.max(1, longestBacktickRun(code) + 1));
    return [
      {
        content: `${fence}${code}${fence}`,
        style: cloneStyle(nextStyle),
        marks: {
          ...marks,
          bold: false,
          italic: false,
          underline: false,
          strike: false,
        },
      },
    ];
  }

  let nextMarks = marks;
  if (name === 'strong' || name === 'b')
    nextMarks = cloneMarks(nextMarks, { bold: true });
  else if (name === 'em' || name === 'i')
    nextMarks = cloneMarks(nextMarks, { italic: true });
  else if (name === 'u' || name === 'ins')
    nextMarks = cloneMarks(nextMarks, { underline: true });
  else if (name === 's' || name === 'del' || name === 'strike')
    nextMarks = cloneMarks(nextMarks, { strike: true });

  if (name === 'a') {
    const href = node.attribs.href;
    const normalizedHref = href?.trim();
    const hasScheme = normalizedHref
      ? /^[a-z][a-z\d+.-]*:/iu.test(normalizedHref)
      : false;
    const isSafeUrl =
      normalizedHref !== undefined &&
      normalizedHref !== '' &&
      !DANGEROUS_URL_PATTERN.test(normalizedHref) &&
      (!hasScheme || SAFE_SCHEME_PATTERN.test(normalizedHref));
    if (isSafeUrl) nextMarks = cloneMarks(nextMarks, { link: href });
  }

  const pieces: InlinePiece[] = [];
  for (const child of node.children) {
    pieces.push(...renderInlineNode(child, nextStyle, nextMarks));
  }
  return pieces;
}

function stripBoundaryNewlines(content: string): string {
  return content.replace(/^\n+/u, '').replace(/\n+$/u, '');
}

function renderInlineContent(
  nodes: readonly ChildNode[],
  style: Style,
  marks: Marks,
): string {
  const pieces: InlinePiece[] = [];
  for (const node of nodes) {
    if (isTextNode(node)) {
      if (/^\s+$/u.test(node.data) && node.data.includes('\n')) continue;
      pieces.push(...renderInlineNode(node, style, marks));
    } else if (isElement(node) && !isBlockElement(node)) {
      pieces.push(...renderInlineNode(node, style, marks));
    }
  }
  return serializePieces(pieces);
}

// Render mixed inline and block children while preserving document order.
function renderFlow(nodes: readonly ChildNode[], style: Style): string {
  let output = '';
  let inlinePieces: InlinePiece[] = [];
  const flushInline = () => {
    if (inlinePieces.length === 0) return;
    output += serializePieces(inlinePieces);
    inlinePieces = [];
  };

  for (const node of nodes) {
    if (isTextNode(node)) {
      if (/^\s+$/u.test(node.data) && node.data.includes('\n')) continue;
      inlinePieces.push(...renderInlineNode(node, style, EMPTY_MARKS));
      continue;
    }
    if (!isElement(node) || isDroppedElement(node)) continue;
    if (isBlockElement(node)) {
      flushInline();
      output += renderBlockElement(node, style);
    } else {
      inlinePieces.push(...renderInlineNode(node, style, EMPTY_MARKS));
    }
  }
  flushInline();
  return output;
}

// Render ordered and unordered lists with canonical two-space nesting.
function renderList(element: ElementNode, style: Style, depth: number): string {
  const ordered = element.name === 'ol';
  const parsedStart = Number.parseInt(element.attribs.start ?? '', 10);
  let number = Number.isInteger(parsedStart) ? parsedStart : 1;
  const lines: string[] = [];
  for (const child of element.children) {
    if (!isElement(child) || child.name !== 'li') continue;
    const inlineChildren: ChildNode[] = [];
    const nestedLists: ElementNode[] = [];
    for (const itemChild of child.children) {
      if (
        isElement(itemChild) &&
        (itemChild.name === 'ul' || itemChild.name === 'ol')
      )
        nestedLists.push(itemChild);
      else inlineChildren.push(itemChild);
    }
    const itemContent = renderFlow(inlineChildren, style)
      .replace(/\n+/gu, ' ')
      .trim();
    const marker = ordered ? `${number}.` : '-';
    number++;
    lines.push(
      `${'  '.repeat(depth)}${marker}${itemContent ? ` ${itemContent}` : ''}`,
    );
    for (const nestedList of nestedLists) {
      const nested = renderList(nestedList, style, depth + 1).replace(
        /\n+$/u,
        '',
      );
      if (nested) lines.push(nested);
    }
  }
  return lines.length > 0 ? `${lines.join('\n')}\n\n` : '';
}

type TableRow = {
  cells: ElementNode[];
  isHeader: boolean;
};

// Collect table rows and mark header rows from thead or th cells.
function getTableRows(element: ElementNode): TableRow[] {
  const rows: TableRow[] = [];
  const visit = (node: ElementNode, insideHead: boolean) => {
    if (node.name === 'table' && node !== element) return;
    const nextInsideHead = insideHead || node.name === 'thead';
    if (node.name === 'tr') {
      rows.push({
        cells: node.children.filter(
          (child): child is ElementNode =>
            isElement(child) && (child.name === 'th' || child.name === 'td'),
        ),
        isHeader:
          nextInsideHead ||
          node.children.some(
            (child) => isElement(child) && child.name === 'th',
          ),
      });
      return;
    }
    for (const child of node.children) {
      if (isElement(child)) visit(child, nextInsideHead);
    }
  };
  visit(element, false);
  return rows;
}

// Render header and no-header tables using canonical FFM table rows.
function renderTable(element: ElementNode, style: Style): string {
  const rows = getTableRows(element);
  if (rows.length === 0) return '';
  const headerIndex = rows.findIndex((row) => row.isHeader);
  const hasHeader = headerIndex !== -1;
  const header = hasHeader ? rows[headerIndex]!.cells : null;
  const dataRows = hasHeader
    ? rows.filter((_row, index) => index !== headerIndex)
    : rows;
  const columnCount = Math.max(1, ...rows.map((row) => row.cells.length));
  const renderRow = (row: readonly ElementNode[]): string => {
    const cells = Array.from({ length: columnCount }, (_value, index) => {
      const cell = row[index];
      if (!cell) return '';
      return renderFlow(cell.children, style).replace(/\s+/gu, ' ').trim();
    });
    return `| ${cells.join(' | ')} |`;
  };
  const lines: string[] = [];
  if (header) lines.push(renderRow(header));
  lines.push(
    `| ${Array.from({ length: columnCount }, () => '---').join(' | ')} |`,
  );
  lines.push(...dataRows.map((row) => renderRow(row.cells)));
  return `${lines.join('\n')}\n\n`;
}

// Render preformatted content with a fence longer than any embedded backtick run.
function renderPre(element: ElementNode): string {
  const content = getPreTextContent(element.children);
  if (!content) return '';
  const fence = '`'.repeat(Math.max(3, longestBacktickRun(content) + 1));
  const body = content.endsWith('\n') ? content : `${content}\n`;
  return `${fence}\n${body}${fence}\n\n`;
}

// Render a block element and append the required paragraph boundary.
function renderBlockElement(element: ElementNode, style: Style): string {
  if (isDroppedElement(element)) return '';
  const nextStyle = mergeStyle(style, parseInlineStyle(element.attribs.style));
  if (element.name === 'hr') return '\n\n---\n\n';
  if (element.name === 'pre') return renderPre(element);
  if (element.name === 'ul' || element.name === 'ol')
    return renderList(element, nextStyle, 0);
  if (element.name === 'table') return renderTable(element, nextStyle);
  if (element.name === 'blockquote') {
    const content = stripBoundaryNewlines(
      renderFlow(element.children, nextStyle),
    )
      .replace(/\n{2,}/gu, '\n')
      .trim();
    if (!content) return '';
    const quoted = content
      .split('\n')
      .map((line) => (line ? `> ${line}` : '>'))
      .join('\n');
    return `${quoted}\n\n`;
  }

  const headingMatch = element.name.match(HEADING_PATTERN);
  if (headingMatch) {
    const content = renderInlineContent(
      element.children,
      nextStyle,
      EMPTY_MARKS,
    ).trim();
    return content
      ? `${'#'.repeat(Number(headingMatch[1]))} ${content}\n\n`
      : '';
  }

  const content = stripBoundaryNewlines(
    renderFlow(element.children, nextStyle),
  ).trim();
  return content ? `${content}\n\n` : '';
}

/** Convert an HTML fragment into formatted Fuyeor Flavored Markdown. */
export function toFFM(input: string): string {
  if (typeof input !== 'string') throw new TypeError('Input must be a string');

  let document: ParsedDocument;
  try {
    document = parseDocument(input, {
      decodeEntities: true,
      lowerCaseAttributeNames: true,
      lowerCaseTags: true,
    });
  } catch (error) {
    throw new Error('Failed to parse HTML fragment', { cause: error });
  }

  const rendered = renderFlow(document.children, {});
  const formatted = format(rendered);
  return formatted.replace(/^\n+|\n+$/gu, '');
}
