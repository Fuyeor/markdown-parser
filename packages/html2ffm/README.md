# @fuyeor/html2ffm

Convert HTML fragments into formatted [Fuyeor Flavored Markdown](https://reference.fuyeor.com/zh-hans/ffm/tutorials/syntax/basic) (FFM).

## Installation

```sh
pnpm add @fuyeor/html2ffm
```

The package is source-first and can be consumed by modern Node.js or browser applications through a normal ESM import.

## Usage

```ts
import { toFFM } from '@fuyeor/html2ffm';

const output = toFFM('<h1>Hello</h1><p><strong>World</strong></p>');

console.log(output);
// # Hello
//
// **World**
```

`toFFM` accepts an HTML fragment and returns a formatted string. It does not fetch external resources, execute scripts, or read stylesheets.

## Supported features

The converter supports headings (`h1`–`h6`), paragraphs, semantic block containers, horizontal rules, line breaks, emphasis, strong emphasis, underline, deletion, inline code, fenced code blocks, links, images, ordered and unordered lists, nested lists, blockquotes, and GFM-style tables.

Inline `style` attributes support `color` and `font-size`. CSS named colors, hexadecimal colors, RGB/RGBA colors, and HSL/HSLA colors are normalized to lowercase hexadecimal values. Opaque colors use six-digit hexadecimal output; alpha-bearing colors use eight-digit hexadecimal output. Unsupported or invalid declarations are ignored.

The parser decodes HTML entities. Unknown ordinary element wrappers are removed while their contents are recursively converted. `script`, `style`, `template`, `svg`, and `math` elements, including their contents, are discarded.

## Development

Run the package tests:

```sh
pnpm --filter @fuyeor/html2ffm test
```

Run the package typecheck:

```sh
pnpm --filter @fuyeor/html2ffm typecheck
```

Run the standalone benchmark:

```sh
pnpm --filter @fuyeor/html2ffm bench
```
