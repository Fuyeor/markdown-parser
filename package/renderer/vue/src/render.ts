// @ffm/vue-renderer/src/render.ts
import { Fragment, h, type VNode } from 'vue';
import { isSafeColorValue, isSafeLinkUrl, type ASTNode } from '@ffm/parser';

// 渲染子节点；缺省时返回空数组
const content = (node: ASTNode): (VNode | string)[] =>
  renderToVue(node.content ?? []);

// 读取纯文本值；缺省时返回空串
const raw = (node: ASTNode): string =>
  typeof node.value === 'string' ? node.value : '';

// 未知或降级节点的统一出口
const passthrough = (node: ASTNode): VNode => h('span', content(node));

// 表格单元格对齐：与 HTML renderer 的 align 属性保持一致
const alignAttr = (cell: ASTNode): Record<string, unknown> => {
  const align = cell.align;
  return align === 'left' || align === 'center' || align === 'right'
    ? { align }
    : {};
};

const renderTableHead = (cells?: ASTNode[]) =>
  cells?.length
    ? h(
        'tr',
        null,
        cells.map((cell) => renderTableCell('th', cell)),
      )
    : null;

const renderTableRow = (rows?: ASTNode[]) =>
  rows?.length
    ? h(
        'tbody',
        null,
        rows.map((row) =>
          h(
            'tr',
            null,
            (row.content ?? []).map((cell) => renderTableCell('td', cell)),
          ),
        ),
      )
    : null;

const renderTableCell = (tag: 'th' | 'td', cell: ASTNode): VNode =>
  h(tag, alignAttr(cell), content(cell));

export function renderToVue(nodeArray: ASTNode[]): (VNode | string)[] {
  return nodeArray.map((node) => {
    switch (node.type) {
      // Common Flavored Markdown
      case 'heading':
        return h(`h${node.level ?? 1}`, content(node));
      case 'paragraph':
        return h('p', content(node));
      case 'text':
        return raw(node);
      case 'bold':
        return h('strong', content(node));
      case 'italic':
        return h('em', content(node));
      case 'underline':
        return h('u', content(node));
      case 'strike':
        return h('del', content(node));
      case 'link': {
        const url = raw(node).trim();
        return isSafeLinkUrl(url)
          ? h('a', { href: url }, content(node))
          : passthrough(node);
      }
      case 'hr':
        return h('hr');
      case 'hardbreak':
        return h('br');

      case 'blockquote':
        return h('blockquote', content(node));

      case 'code_color': {
        const color = raw(node);
        if (!isSafeColorValue(color)) return color;
        return h('code', { class: 'ffm-color-code' }, [
          h('span', {
            class: 'ffm-color-swatch',
            style: {
              display: 'inline-block',
              width: '0.8em',
              height: '0.8em',
              borderRadius: '50%',
              backgroundColor: color,
              verticalAlign: 'middle',
              marginRight: '0.3em',
              border: '1px solid #00000030',
            },
          }),
          color,
        ]);
      }
      case 'code_inline':
        return h('code', raw(node));
      case 'code': {
        const language = node.lang;
        const code = raw(node);
        return h('div', { class: 'code-block-wrapper' }, [
          language ? h('div', { class: 'code-lang' }, language) : null,
          h(
            'pre',
            language
              ? { 'data-language': language, 'data-async': 'hljs' }
              : null,
            h(
              'code',
              { class: language ? `language-${language}` : 'hljs' },
              code,
            ),
          ),
        ]);
      }

      case 'list':
        return h(
          node.ordered ? 'ol' : 'ul',
          (node.start ?? 1) !== 1 ? { start: node.start } : null,
          content(node),
        );
      case 'list_item':
        return h('li', content(node));

      case 'table':
        return h('table', null, [
          // @ts-ignore
          node.header ? h('thead', null, renderTableHead(node.header)) : null,
          renderTableRow(node.content),
        ]);

      // Fuyeor Flavored Markdown
      case 'accordion':
        return h('div', { class: 'ffm-accordion' }, content(node));
      case 'accordion_item':
        return h('details', { name: node.name }, [
          h('summary', renderToVue(node.title ?? [])),
          h('div', { class: 'accordion-content' }, content(node)),
        ]);

      case 'chain':
        return h('div', { class: 'chain-container' }, content(node));
      case 'chain_item': {
        const statusClass = node.hasCheckbox
          ? node.isCompleted
            ? 'is-completed'
            : 'is-pending'
          : '';
        return h('div', { class: ['chain-item', statusClass] }, [
          h('div', { class: 'chain-marker' }),
          h('div', { class: 'chain-content-wrapper' }, [
            node.title && node.title.length > 0
              ? h('div', { class: 'chain-title' }, renderToVue(node.title))
              : null,
            h('div', { class: 'chain-body' }, content(node)),
          ]),
        ]);
      }

      case 'slide':
        return h('div', { class: 'slide-container-wrapper' }, [
          h('div', { class: 'slide-container' }, content(node)),
        ]);
      case 'slide_item':
        return h('div', { class: 'slide-item' }, content(node));

      // 异步节点：属性与 HTML renderer 输出完全对齐，供 hydrate() 扫描
      case 'emoji':
        return h('img', {
          class: 'emoji',
          draggable: 'false',
          alt: String(node.alt ?? node.value ?? ''),
          src: String(node.src ?? ''),
        });

      case 'math_inline':
        return h(
          'span',
          { class: 'math-inline', 'data-async': 'latex' },
          raw(node),
        );
      case 'math':
        return h(
          'div',
          { class: 'math-block', 'data-async': 'latex' },
          raw(node),
        );

      case 'mermaid':
        return h(
          'div',
          { class: 'language-mermaid', 'data-async': 'mermaid' },
          raw(node),
        );

      case 'smiles_inline':
        return h('span', {
          class: 'language-smiles smiles-inline',
          'data-async': 'smiles',
          'data-smiles': raw(node),
        });
      case 'smiles':
        return h(
          Fragment,
          null,
          raw(node)
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map((line) =>
              h('div', {
                class: 'language-smiles smiles-block',
                'data-async': 'smiles',
                'data-smiles': line.trim(),
              }),
            ),
        );

      case 'abc':
        return h(
          'div',
          { class: 'language-abc', 'data-async': 'abc' },
          raw(node),
        );

      default:
        return passthrough(node);
    }
  });
}
