// @fuyeor/markdown-parser-vue/src/render.ts
import { h, type VNode } from 'vue';
import {
  isSafeColorValue,
  isSafeLinkUrl,
  type ASTNode,
} from '@fuyeor/markdown-parser';

export function renderToVue(nodes: ASTNode[]): (VNode | string)[] {
  return nodes.map((node) => {
    switch (node.type) {
      case 'heading': {
        const level =
          typeof node.level === 'number' &&
          Number.isInteger(node.level) &&
          node.level >= 1 &&
          node.level <= 6
            ? node.level
            : null;
        return level === null
          ? h('span', renderToVue(node.children || []))
          : h(`h${level}`, renderToVue(node.children || []));
      }
      case 'paragraph':
        return h('p', renderToVue(node.children || []));
      case 'text':
        return node.content || ''; // Vue 天然防 XSS，直接返回字符串
      case 'bold':
        return h('strong', renderToVue(node.children || []));
      case 'italic':
        return h('em', renderToVue(node.children || []));
      case 'underline':
        return h('u', renderToVue(node.children || []));
      case 'strike':
        return h('del', renderToVue(node.children || []));
      case 'inline_code':
        return h('code', node.content || '');
      case 'color_code': {
        const color = String(node.content ?? '');
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
      case 'link': {
        const url = String(node.url ?? '').trim();
        return isSafeLinkUrl(url)
          ? h(
              'a',
              { href: url, target: '_blank', rel: 'noopener noreferrer' },
              renderToVue(node.children || []),
            )
          : h('span', renderToVue(node.children || []));
      }
      case 'code_block':
        return h('div', { class: 'code-block-wrapper' }, [
          node.lang ? h('div', { class: 'code-lang' }, node.lang) : null,
          h(
            'pre',
            null,
            h(
              'code',
              { class: node.lang ? `language-${node.lang}` : '' },
              node.content || '',
            ),
          ),
        ]);
      case 'list':
        return h(
          node.ordered ? 'ol' : 'ul',
          node.ordered && node.start && node.start !== 1
            ? { start: node.start }
            : {},
          renderToVue(node.children || []),
        );
      case 'list_item':
        return h('li', renderToVue(node.children || []));
      case 'table':
        return h('table', null, [
          h(
            'thead',
            null,
            h(
              'tr',
              null,
              (node.headers ?? []).map((cell) =>
                h('th', renderToVue(cell.children || [])),
              ),
            ),
          ),
          node.children && node.children.length > 0
            ? h(
                'tbody',
                null,
                node.children.map((row) =>
                  h(
                    'tr',
                    null,
                    (row.children ?? []).map((cell) =>
                      h('td', renderToVue(cell.children || [])),
                    ),
                  ),
                ),
              )
            : null,
        ]);
      case 'hr':
        return h('hr');
      case 'blockquote':
        return h('blockquote', renderToVue(node.children || []));
      case 'hardbreak':
        return h('br');
      case 'accordion':
        return h(
          'div',
          { class: 'ffm-accordion' },
          renderToVue(node.children || []),
        );
      case 'accordion_item':
        return h('details', { name: node.name }, [
          h('summary', renderToVue(node.title || [])),
          h(
            'div',
            { class: 'accordion-content' },
            renderToVue(node.children || []),
          ),
        ]);
      case 'chain':
        return h(
          'div',
          { class: 'chain-container' },
          renderToVue(node.children || []),
        );
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
            h('div', { class: 'chain-body' }, renderToVue(node.children || [])),
          ]),
        ]);
      }
      case 'slide':
        return h('div', { class: 'slide-container-wrapper' }, [
          h(
            'div',
            { class: 'slide-container' },
            renderToVue(node.children || []),
          ),
        ]);
      case 'slide_item':
        return h(
          'div',
          { class: 'slide-item' },
          renderToVue(node.children || []),
        );
      default:
        return h('span', renderToVue(node.children || []));
    }
  });
}
