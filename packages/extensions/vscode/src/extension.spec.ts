// packages/vscode-extension/src/extension.spec.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { activate } from './extension';

vi.mock('vscode', () => {
  const registerDocumentFormattingEditProvider = vi.fn();
  class Range {
    constructor(
      readonly start: unknown,
      readonly end: unknown,
    ) {}
  }
  const replace = vi.fn((range: unknown, newText: string) => ({
    range,
    newText,
  }));
  return {
    Range,
    TextEdit: { replace },
    languages: { registerDocumentFormattingEditProvider },
  };
});

describe('FFM VS Code formatting provider', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers for ffm and replaces the complete document when needed', () => {
    const disposable = { dispose: vi.fn() };
    vi.mocked(
      vscode.languages.registerDocumentFormattingEditProvider,
    ).mockReturnValue(disposable);
    const subscriptions: unknown[] = [];
    activate({ subscriptions } as unknown as vscode.ExtensionContext);

    expect(
      vscode.languages.registerDocumentFormattingEditProvider,
    ).toHaveBeenCalledWith('ffm', expect.any(Object));
    expect(subscriptions).toContain(disposable);

    const provider = vi.mocked(
      vscode.languages.registerDocumentFormattingEditProvider,
    ).mock.calls[0]![1];
    const source = '这是10个XX';
    const edits = provider.provideDocumentFormattingEdits(
      {
        getText: () => source,
        positionAt: (offset: number) => ({ offset }),
      } as unknown as vscode.TextDocument,
      {} as vscode.FormattingOptions,
      {} as vscode.CancellationToken,
    );

    expect(edits).toEqual([
      {
        range: {
          start: { offset: 0 },
          end: { offset: source.length },
        },
        newText: '这是 10 个 XX',
      },
    ]);
  });

  it('returns no edit for already formatted documents', () => {
    const disposable = { dispose: vi.fn() };
    vi.mocked(
      vscode.languages.registerDocumentFormattingEditProvider,
    ).mockReturnValue(disposable);
    const subscriptions: unknown[] = [];
    activate({ subscriptions } as unknown as vscode.ExtensionContext);

    const provider = vi.mocked(
      vscode.languages.registerDocumentFormattingEditProvider,
    ).mock.calls[0]![1];
    const source = '已经格式化';
    const edits = provider.provideDocumentFormattingEdits(
      {
        getText: () => source,
        positionAt: (offset: number) => ({ offset }),
      } as unknown as vscode.TextDocument,
      {} as vscode.FormattingOptions,
      {} as vscode.CancellationToken,
    );

    expect(edits).toEqual([]);
  });
});
