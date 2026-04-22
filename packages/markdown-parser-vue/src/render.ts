// @fuyeor/markdown-parser-vue/src/renderer.ts
import { h, type VNode } from 'vue';
import type { ASTNode } from '@fuyeor/markdown-parser';

export function renderToVue(nodes: ASTNode[]): (VNode | string)[] {
  return nodes.map((node) => {
    switch (node.type) {
      case 'heading':
        return h(`h${node.level}`, renderToVue(node.children || []));
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
      case 'link':
        return h(
          'a',
          { href: node.url, target: '_blank', rel: 'noopener noreferrer' },
          renderToVue(node.children || []),
        );
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
              node.headers.map((cell: any) =>
                h('th', renderToVue(cell.children || [])),
              ),
            ),
          ),
          node.children && node.children.length > 0
            ? h(
                'tbody',
                null,
                node.children.map((row: any) =>
                  h(
                    'tr',
                    null,
                    row.children.map((cell: any) =>
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
      default:
        return h('span', renderToVue(node.children || []));
    }
  });
}
