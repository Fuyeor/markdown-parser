// packages/vscode-extension/src/vscode.mock.ts
import { vi } from 'vitest';

export class Range {
  constructor(
    readonly start: unknown,
    readonly end: unknown,
  ) {}
}

export const TextEdit = {
  replace: vi.fn((range: unknown, newText: string) => ({
    range,
    newText,
  })),
};

export const languages = {
  registerDocumentFormattingEditProvider: vi.fn(),
};
