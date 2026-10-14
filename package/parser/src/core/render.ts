// @ffm/parser/src/core/render.ts
import type {
  ASTNode,
  NodeRenderer,
  RenderContext,
  RenderOption,
} from '#/type';

export const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char]!,
  );

// 渲染子节点；缺省时返回空串
const content = (node: ASTNode, ctx: RenderContext): string =>
  ctx.render(node.content ?? []);

// 读取纯文本值；解析器保证 value 为 string
const raw = (node: ASTNode): string => node.value ?? '';

// 读取并转义的纯文本值
const rawText = (node: ASTNode): string => escapeHtml(raw(node));

// 未知或降级节点的统一出口
const passthrough = (node: ASTNode, ctx: RenderContext): string =>
  `<span>${content(node, ctx)}</span>`;

// 表格单元格对齐：与 Vue renderer 的 align 属性保持一致
const alignAttr = (cell: ASTNode): string => {
  const align = cell.align;
  return align === 'left' || align === 'center' || align === 'right'
    ? ` align="${align}"`
    : '';
};

const renderTableCell = (
  tag: 'th' | 'td',
  cell: ASTNode,
  ctx: RenderContext,
): string => `<${tag}${alignAttr(cell)}>${content(cell, ctx)}</${tag}>`;

const renderTableHead = (
  cells: ASTNode[] | undefined,
  ctx: RenderContext,
): string => {
  if (!cells?.length) return '';
  const rows = cells.map((cell) => renderTableCell('th', cell, ctx)).join('');
  return `<thead><tr>${rows}</tr></thead>`;
};

const renderTableBody = (
  rows: ASTNode[] | undefined,
  ctx: RenderContext,
): string => {
  if (!rows?.length) return '';
  const body = rows
    .map((row) => {
      const cells = (row.content ?? [])
        .map((cell) => renderTableCell('td', cell, ctx))
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  return `<tbody>${body}</tbody>`;
};

// 渲染标题；level 由解析器保证为 1..6
const renderHeading = (node: ASTNode, ctx: RenderContext): string => {
  const level = node.level;
  return `<h${level}>${content(node, ctx)}</h${level}>`;
};

// 渲染代码块：结构与 Vue renderer 输出对齐
const renderCodeBlock = (node: ASTNode): string => {
  const language = node.lang ?? '';
  const value = rawText(node);
  const body = language
    ? `<div class="pre-language">${escapeHtml(language)}</div>` +
      `<pre data-language="${escapeHtml(language)}" data-async="hljs"><code>${value}</code></pre>`
    : `<pre><code>${value}</code></pre>`;
  return `<div class="code-block-wrapper">${body}</div>`;
};

// 渲染颜色代码块；color_code 由 inlineCodeRule 生成，value 已通过颜色语法校验
const renderCodeColor = (node: ASTNode): string => {
  const color = escapeHtml(raw(node));
  const style =
    'display:inline-block;width:0.8em;height:0.8em;border-radius:50%;' +
    `background-color:${color};vertical-align:middle;margin-right:0.3em;` +
    'border:1px solid #00000030;';
  return (
    `<code class="ffm-color-code">` +
    `<span class="ffm-color-swatch" style="${style}"></span>${color}` +
    `</code>`
  );
};

// 渲染链接；linkRule / linkify 已过滤 URL scheme
const renderLink = (node: ASTNode, ctx: RenderContext): string => {
  const url = escapeHtml((node.url ?? '').trim());
  return `<a href="${url}">${content(node, ctx)}</a>`;
};

// 渲染图片；url 由解析器过滤 scheme，alt / caption 为纯文本
const renderImage = (node: ASTNode, ctx: RenderContext): string => {
  const url = escapeHtml((node.url ?? '').trim());
  const alt = escapeHtml(node.alt ?? '');
  const img = `<img src="${url}" alt="${alt}" />`;

  // caption 与 title 等价；缺省时退化为裸 <img>
  const caption = node.caption ?? node.title;
  if (!caption || (Array.isArray(caption) && caption.length === 0)) return img;

  const figcaption =
    typeof caption === 'string' ? escapeHtml(caption) : ctx.render(caption);

  return (
    `<figure class="ffm-image">` +
    img +
    `<figcaption>${figcaption}</figcaption>` +
    `</figure>`
  );
};

// 链节点状态类名；与 Vue renderer 保持一致
const chainStatusClass = (node: ASTNode): string =>
  node.hasCheckbox ? (node.isCompleted ? 'is-completed' : 'is-pending') : '';

// 渲染 AST 为 HTML；custom 渲染器按节点类型覆盖内置分支
export function render(nodeArray?: ASTNode[], option?: RenderOption): string {
  const custom = option?.nodeRenderer;
  const ctx: RenderContext = {
    escapeHtml,
    render: (children) => renderNodes(children, custom, ctx),
  };
  return renderNodes(nodeArray, custom, ctx);
}

function renderNodes(
  nodeArray: ASTNode[] | undefined,
  custom: Record<string, NodeRenderer> | undefined,
  ctx: RenderContext,
): string {
  if (!nodeArray?.length) return '';

  return nodeArray
    .map((node) => {
      const renderer = custom?.[node.type];
      if (renderer) return renderer(node, ctx);

      switch (node.type) {
        // Common Flavored Markdown
        case 'heading':
          return renderHeading(node, ctx);
        case 'paragraph':
          return `<p>${content(node, ctx)}</p>`;
        case 'text':
          return rawText(node);
        case 'bold':
          return `<strong>${content(node, ctx)}</strong>`;
        case 'italic':
          return `<em>${content(node, ctx)}</em>`;
        case 'underline':
          return `<u>${content(node, ctx)}</u>`;
        case 'strike':
          return `<del>${content(node, ctx)}</del>`;
        case 'link':
          return renderLink(node, ctx);
        case 'image':
          return renderImage(node, ctx);
        case 'hr':
          return '<hr/>';
        case 'break':
          return '<br/>';
        case 'blockquote':
          return `<blockquote>${content(node, ctx)}</blockquote>`;

        case 'code':
          return renderCodeBlock(node);
        case 'code_inline':
          return `<code>${rawText(node)}</code>`;
        case 'code_color':
          return renderCodeColor(node);

        case 'list': {
          const tag = node.ordered ? 'ol' : 'ul';
          const start =
            node.ordered && node.start && node.start !== 1
              ? ` start="${node.start}"`
              : '';
          return `<${tag}${start}>${content(node, ctx)}</${tag}>`;
        }
        case 'list_item':
          return `<li>${content(node, ctx)}</li>`;

        case 'table': {
          const head = renderTableHead(node.header, ctx);
          const body = renderTableBody(node.content, ctx);
          return `<table>${head}${body}</table>`;
        }

        // Fuyeor Flavored Markdown
        case 'accordion':
          return `<div class="ffm-accordion">${content(node, ctx)}</div>`;
        case 'accordion_item': {
          const name = node.name ? ` name="${escapeHtml(node.name)}"` : '';
          return (
            `<details${name}>` +
            `<summary>${ctx.render(node.title ?? [])}</summary>` +
            `<div class="accordion-body">${content(node, ctx)}</div>` +
            `</details>`
          );
        }

        case 'chain':
          return `<div class="ffm-chain">${content(node, ctx)}</div>`;
        case 'chain_item': {
          const status = chainStatusClass(node);
          const titleNodes = node.title;
          const title = titleNodes?.length
            ? `<div class="chain-title">${ctx.render(titleNodes)}</div>`
            : '';
          return (
            `<div class="chain-item ${status}">` +
            `<div class="chain-marker"></div>` +
            `<div class="chain-body">${title}` +
            `<div class="chain-content">${content(node, ctx)}</div>` +
            `</div></div>`
          );
        }

        case 'slide':
          return (
            `<div class="ffm-slide">` +
            `<div class="slide-container">${content(node, ctx)}</div>` +
            `</div>`
          );
        case 'slide_item':
          return `<div class="slide-item">${content(node, ctx)}</div>`;

        // 异步节点：属性与 Vue renderer 输出完全对齐，供 hydrate() 扫描
        case 'emoji': {
          const alt = node.value ?? '';
          const src = String(node.src ?? '');
          return (
            `<img class="emoji" draggable="false"` +
            ` alt="${escapeHtml(alt)}" src="${escapeHtml(src)}" />`
          );
        }

        case 'math':
          return `<div class="math-block" data-async="latex">${rawText(node)}</div>`;
        case 'math_inline':
          return `<span class="math-inline" data-async="latex">${rawText(node)}</span>`;

        case 'mermaid':
          return `<div class="language-mermaid" data-async="mermaid">${rawText(node)}</div>`;

        case 'smiles': {
          const lines = raw(node)
            .split('')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
          if (lines.length === 0) return '';
          const blocks = lines
            .map(
              (line) =>
                `<div class="language-smiles smiles-block" data-async="smiles" data-smiles="${escapeHtml(line)}"></div>`,
            )
            .join('');
          return `${blocks}`;
        }
        case 'smiles_inline':
          return `<span class="language-smiles smiles-inline" data-async="smiles" data-smiles="${rawText(node)}"></span>`;

        case 'abc':
          return `<div class="language-abc" data-async="abc">${rawText(node)}</div>`;

        default:
          return passthrough(node, ctx);
      }
    })
    .join('');
}
