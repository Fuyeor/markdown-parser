// packages/vscode-extension/src/ffm-grammar.spec.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageDirectory = resolve(import.meta.dirname, '..');
const readJson = (relativePath: string) =>
  JSON.parse(
    readFileSync(resolve(packageDirectory, relativePath), 'utf8'),
  ) as Record<string, unknown>;

describe('FFM VS Code extension source', () => {
  it('declares a valid FFM language contribution', () => {
    const manifest = readJson('package.json');
    const contributes = manifest.contributes as Record<string, unknown>;
    const languages = contributes.languages as Array<Record<string, unknown>>;
    const language = languages.find((entry) => entry.id === 'ffm');

    expect(language).toBeDefined();
    expect(language?.extensions).toEqual(['.ffm', '.fmd']);
    expect(language?.configuration).toBe('./language-configuration.json');
  });

  it('points the grammar contribution to the FFM TextMate grammar', () => {
    const manifest = readJson('package.json');
    const contributes = manifest.contributes as Record<string, unknown>;
    const grammars = contributes.grammars as Array<Record<string, unknown>>;

    expect(grammars).toContainEqual({
      language: 'ffm',
      scopeName: 'text.html.markdown.ffm',
      path: './syntaxes/ffm.tmLanguage.json',
    });
  });

  it('covers the syntax families defined by the FFM tutorials', () => {
    const grammar = readJson('syntaxes/ffm.tmLanguage.json');
    const repository = grammar.repository as Record<string, unknown>;
    const expectedRules = [
      'heading',
      'bold_italic',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'list_marker',
      'link',
      'image',
      'blockquote',
      'fenced_code_block',
      'special_fenced_blocks',
      'math_block',
      'inline_math',
      'table_row',
    ];

    for (const ruleName of expectedRules)
      expect(repository[ruleName]).toBeDefined();
  });

  it('configures .ffm documents as wrapped natural text without ambiguous-character highlights', () => {
    const manifest = readJson('package.json');
    const configurationDefaults = manifest.configurationDefaults as Record<
      string,
      unknown
    >;
    const ffmDefaults = configurationDefaults['[ffm]'] as Record<
      string,
      unknown
    >;

    expect(ffmDefaults).toEqual({
      'editor.wordWrap': 'on',
      'editor.wrappingStrategy': 'advanced',
      'editor.unicodeHighlight.ambiguousCharacters': false,
    });
  });

  it('recognizes FFM-only fenced block keywords and task titles', () => {
    const grammar = readJson('syntaxes/ffm.tmLanguage.json');
    const repository = grammar.repository as Record<string, unknown>;
    const specialBlocks = repository.special_fenced_blocks as Record<
      string,
      unknown
    >;
    const title = repository.special_block_title as Record<string, unknown>;

    expect(specialBlocks.begin).toContain(
      'quote|slide|chain|accordion|mermaid|smiles|abc',
    );
    expect(title.match).toContain('\\[[ xX]\\]');
  });
});
