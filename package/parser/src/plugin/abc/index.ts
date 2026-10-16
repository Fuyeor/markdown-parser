// @ffm/parser/src/plugin/abc.ts
import { loadScript } from '@fuyeor/util';
import { createCodeBlockTransform } from '#/plugin/ast';
import type { AsyncRenderer, MarkdownPlugin } from '#/type';
import type { Abc, AbcSource } from './type';

// Extend the Window interface to include our highlight property
declare global {
  interface Window {
    // ABCJS 硬编码 `window.ABCJS`
    ABCJS?: Abc;
  }
}

// Build an ABCJS renderer for fenced abc blocks.
export const createAbc = (source: AbcSource): AsyncRenderer<Abc> => ({
  name: 'abc',
  selector: '[data-async="abc"]',
  style: source.style,
  load: () => loadScript<Abc>(source.script, 'ABCJS'),
  render(element, abcjs) {
    const code = element.textContent ?? '';
    if (!code.trim()) return;
    element.textContent = '';
    abcjs.renderAbc(element, code, {
      responsive: 'resize',
      add_classes: true,
      paddingbottom: 0,
      paddingtop: 0,
      paddingleft: 0,
      paddingright: 0,
    });
  },
});

export const abcTransform = createCodeBlockTransform('abc');

export const abcPlugin: MarkdownPlugin = (parser) => {
  parser.addAstTransform(abcTransform);
  parser.requireCapability('abc');
};
