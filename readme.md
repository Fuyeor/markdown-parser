# Fuyeor Flavored Markdown

A lightweight, streamlined markup language from the Markdown family, designed specifically for modern writing. [Try the playground](https://flavored.fuyeor.com/document) or [view the documentation](https://reference.fuyeor.com/ffm/overview).

> - In this text, CFM stands for Common Flavored Markdown, a common Markdown flavor. It currently refers to CommonMark.
> - GFM stands for GitHub Flavored Markdown, and FFM stands for Fuyeor Flavored Markdown.
> - Markdown is a general term for a class of markup languages, and FFM is a separate language within that class. This is similar to how C and C# are both C-family languages: they share similarities, but neither is a subset of the other.

## ✨ Features

- **Free writing**: Ordered lists are uniformly indented by two spaces, regardless of marker width. Key-value tables work without a header row
- **Free layout**: FFM layout syntax for quotes, slides, chains, and accordions
- **Free expression**: Extensions for code highlighting, LaTeX, Mermaid, SMILES, ABC notation, and Twemoji

## ✅ Basic Syntax

| Syntax | Effect | Visual metaphor |
| :--- | :--- | :--- |
| `*Italic*` | *Italic* | Subtle emphasis |
| `**Bold**` | **Bold** | Strong emphasis |
| `__Underline__` | <ins>Underline</ins> | Underline |
| `--Strike--` | <del>Strikethrough</del> | Strikethrough |

## ⛔ Not Part of FFM

The following legacy syntax constructs are excluded. Each item explains why.

- **Raw HTML & Entities**: Inline and block HTML input is unsupported to prevent XSS attacks and ensure independent parsing. HTML is used only as an output format by renderers.
- **Indented Code Blocks**: These are error-prone and often triggered accidentally. Standard fenced code blocks (`` ``` ``) are the modern, preferred alternative.
- **Setext Headings**: They often cause bugs where underlining text unintentionally creates an H2. Since they support only H1 and H2, they are considered redundant.
- **`__bold__` and `_italic_`**: These are Latin-script-centric conventions that cause significant ambiguity in CJK languages, where spaces are not used to separate words.
- **Line Breaks**: FFM does not support hard breaks created by trailing spaces or backslashes (`\`). Simply use a newline character to create a line break.
- **Loose vs. Tight Lists**: FFM does not distinguish between loose and tight lists, so accidental line breaks do not change rendering.
- **Non-HTTP Autolinks**: Only `http://` and `https://` URLs are auto-linked. Other schemes such as `ftp://` and `mailto:` are not.
- **Emoji shortcodes**: In most modern contexts, it is sufficient to use the Unicode character directly.
- **GitHub Strikethrough (`~~`)**: It conflicts with repeated tildes commonly used for tone and expression in CJK writing, which can cause unintended formatting.

## ⚙️ Usage

### Use the core renderer

**1. Add the FPM registry to `.npmrc`:**

```ini
@ffm:registry=https://fpm.fuyeor.com/v1/
```

**2. Install `@ffm/parser`:**

```bash
pnpm add @ffm/parser
```

**3. Parse Markdown:**

```javascript
import { createMarkdownParser, render } from '@ffm/parser';

// Initialize the parser
const parse = createMarkdownParser();

const md = `## Hello World`;

// Parse Markdown to AST
const ast = parse(md);

// Render the AST (Example)
const html = render(ast);
```

### Use extensions

You provide the CDN URLs. You can use a public CDN such as cdnjs, jsDelivr, or esm.sh, or your own CDN. Twemoji is enabled by default and requires no configuration.

```js
import {
  hydrate,
  createHighlight,
  createLatex,
  createMermaid,
  createSmiles,
  createAbc,
} from '@ffm/parser/plugin';

function getCdnLibraryUrl(path) {
  return `https://cdnjs.cloudflare.com/ajax/libs/${path}`;
}

const asyncRenderer = [
  createHighlight({
    script: getCdnLibraryUrl('highlight.js/11.11.1/es/core.min.js'),
    language: (lang) =>
      getCdnLibraryUrl(`highlight.js/11.11.1/languages/${lang}.min.js`),
    style: ['https://deliver.fuyeor.net/@fu/styles/highlight.min.css'],
  }),
  createLatex({
    script: getCdnLibraryUrl('KaTeX/0.16.9/katex.min.js'),
    style: [getCdnLibraryUrl('KaTeX/0.16.9/katex.min.css')],
  }),
  createMermaid({
    script: getCdnLibraryUrl('mermaid/10.9.0/mermaid.min.js'),
  }),
  createSmiles({
    endpoint: 'https://chemistry.fuyeor.net/v1/depict',
  }),
  createAbc({
    script: getCdnLibraryUrl('abcjs/6.5.2/abcjs-basic-min.js'),
  }),
];

// containerElement is the DOM container where the output is rendered
await hydrate(containerElement, asyncRenderer);
```

## 🚧 Development

### Build Linkify Bitmap

```bash
pnpm --filter @ffm/linkify build:tld
```

### Run Tests

```bash
pnpm test
```

### Run Playground

The playground provides a real-time view of both rendered Markdown and the AST. Run it locally:

```bash
pnpm playground
```

You can also explore it online in the [playground](https://flavored.fuyeor.com/document).

### Run Benchmark

```bash
# test parsing speed
pnpm -F @ffm/benchmark bench:speed

# test memory usage
pnpm -F @ffm/benchmark bench:memory

# test linkify speed
pnpm -F @ffm/benchmark bench:linkify
```