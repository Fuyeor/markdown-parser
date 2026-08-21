// packages/vscode-extension/src/extension.ts
import * as vscode from 'vscode';
import { format } from '@fuyeor/markdown-formatter';

/** Replace the complete document only when formatting changes its content. */
const formatter: vscode.DocumentFormattingEditProvider = {
  provideDocumentFormattingEdits(
    document,
    _options,
    _token,
  ): vscode.TextEdit[] {
    const source = document.getText();
    const formatted = format(source);
    if (formatted === source) return [];

    const fullDocument = new vscode.Range(
      document.positionAt(0),
      document.positionAt(source.length),
    );
    return [vscode.TextEdit.replace(fullDocument, formatted)];
  },
};

/** Register FFM formatting without adding any persistent runtime state. */
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider('ffm', formatter),
  );
}

export function deactivate(): void {}
