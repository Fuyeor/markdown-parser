@fuyeor/markdown-formatter — A lightweight, deterministic Markdown and FFM (FuYeor Flavored Markdown) formatter with built-in CJK typographic spacing, table alignment, list indentation normalization, and semantic fence processing.

## Features

- **CJK Typography**: Automatic Pangu spacing between Chinese/Japanese/Korean and Latin/digits without altering protected tokens (inline code/math).
- **Table Normalization**: Canonical pipe table formatting and delimiter cleanup.
- **List Indentation**: Consistent 2-space indentation depth for nested ordered and unordered lists.
- **Semantic Fences**: Recursive formatting inside semantic containers (`quote`, `slide`, `chain`, `accordion`).
- **Configurable Blank Lines**: Fine-grained control over consecutive blank line collapsing.
- **Zero Dependencies**: Blazing fast and minimal bundle size.

## Quick Start

```ts
import { format } from '@fuyeor/markdown-formatter';

const markdown = `
# Title
这是English文本和一个[链接](https://example.com)。
|Name|Age|
|------|-------|
|Alice|20|
`;

const formatted = format(markdown);
console.log(formatted);
```

### Output:

````markdown
# Title

这是 English 文本和一个[链接](https://example.com)。

| Name | Age |
| --- | --- |
| Alice | 20 |
````

## Options

`format(content: string, options?: FormatOptions): string`

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `maxConsecutiveBlankLines` | `number` | `1` | Maximum allowable consecutive blank lines between blocks. Set to `2` to preserve intentional author whitespace. |

### Example with Options

```ts
import { format } from '@fuyeor/markdown-formatter';

const source = 'First paragraph\n\n\n\nSecond paragraph';

// Retains at most 2 blank lines (3 newlines)
const formatted = format(source, {
  maxConsecutiveBlankLines: 2,
});
```
