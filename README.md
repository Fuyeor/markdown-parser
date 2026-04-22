**@fuyeor/markdown-parser**: A lightweight Markdown parser optimized for loading speed and extensibility. It supports CommonMark standards alongside **Fuyeor Flavored Markdown (FFM)** across various frameworks.

> [!IMPORTANT]
> By default, `@fuyeor/markdown-parser` does **not** support bolding with `__`, strikethrough with `~~`, or italics with `_italic_`. Image syntax `![]()` is also disabled by default.

### ✅ Supported Syntax

- **CommonMark**: Full support (excluding Setext, Indented Code Blocks, HTML, and Link Reference Definitions).
- **GitHub Flavored Markdown**: Tables and Autolinks.
- **Fuyeor Flavored Markdown (FFM)**: [Plugin-based] Custom fence blocks (e.g., quotes, slides, chains, and accordions).

### ⛔ Unsupported Syntax (By Design)

- **Indented Code Blocks**: These are error-prone and often triggered accidentally. Standard fenced syntax (`` ` ``) is the modern, preferred alternative.
- **Setext Headings**: Often cause bugs where underlining text unintentionally creates an H2. Since they only support H1 and H2, they are considered redundant.
- **HTML Blocks & Inline HTML**: Currently unsupported to prevent XSS attacks and ensure parsing predictability.
- **GitHub Strikethrough (`~~`)**: Frequently conflicts with tone marks (e.g., `~`) used by CJK (Chinese, Japanese, Korean) users, leading to unexpected formatting.
- **`__bold__` and `_italic_`**: These are Latin-centric conventions that cause significant ambiguity in CJK languages where spaces are not used to separate words.

### ✨ Optional Syntax

- **Image Syntax**: Disabled by default to mitigate XSS risks, privacy leaks (e.g., pixel tracking), and copyright issues. This can be re-enabled via plugins.
- **Fuyeor Flavored Markdown (FFM)**: Core extended syntax including `quote`, `slide`, `chain`, and `accordion`.

| Syntax | Effect | Visual Metaphor |
| :--- | :--- | :--- |
| `**Bold**` | **Bold** | Heavy / Emphasis |
| `*Italic*` | *Italic* | Elegant / Slight Emphasis |
| `__Underline__` | <u>Underline</u> | Bottom line |
| `--Strike--` | <del>Strikethrough</del> | Crossing out |

## ⚙️ Usage

```javascript
import { createMarkdownParser } from '@fuyeor/markdown-parser';

// Initialize and configure your rules
const parse = createMarkdownParser();

const markdown = `## Hello World`;

// Parse Markdown to AST
const ast = parse(markdown);

// Render the AST (Example)
const resultHtml = astToHtml(ast); 
```

## 🚧 Development

### Run Tests:

```bash
pnpm test
```

A `tests.failed.json` file will be generated in the `test` directory. This file lists failed cases to simplify debugging and fixing.

### Run Playground:

```bash
pnpm playground
```

The playground allows you to view the generated Markdown and AST in real-time.

### Run Benchmark:

```bash
# pnpm -F @fuyeor/markdown-parser-benchmark bench:speed
# pnpm -F @fuyeor/markdown-parser-benchmark bench:memory
```