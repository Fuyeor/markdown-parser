// @ffm/editor/src/transaction/history.ts
import type { Transaction } from './type';

/** A recorded change is a pair of forward and inverse transactions. */
export type HistoryEntry = {
  forward: Transaction;
  inverse: Transaction;
};

const undoStack: HistoryEntry[] = [];
const redoStack: HistoryEntry[] = [];

/** Record a change that has already been applied. Clears the redo stack. */
export function record(entry: HistoryEntry) {
  undoStack.push(entry);
  redoStack.length = 0;
}

/** Clear the redo stack without touching the undo stack. */
export function clearRedo() {
  redoStack.length = 0;
}

/** Pop the most recent entry for undo. Returns undefined when there is nothing to undo. */
export function popUndo(): Transaction | undefined {
  const entry = undoStack.pop();
  if (entry === undefined) return undefined;
  redoStack.push(entry);
  return entry.inverse;
}

/** Pop the most recent entry for redo. Returns undefined when there is nothing to redo. */
export function popRedo(): Transaction | undefined {
  const entry = redoStack.pop();
  if (entry === undefined) return undefined;
  undoStack.push(entry);
  return entry.forward;
}

/** Drop both stacks. Used by tests and by editor reset. */
export function clearHistory() {
  undoStack.length = 0;
  redoStack.length = 0;
}
