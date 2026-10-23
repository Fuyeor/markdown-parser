// @/option/util/archive.spec.ts
// pnpm -F @ffm/playground test archive.spec.ts
import { describe, expect, it } from 'vitest';
import { mergeArchive } from './archive';
import type { HistoryDocument } from '@/document/composable/useIndexedDb';

const doc = (over: Partial<HistoryDocument>): HistoryDocument => ({
  id: 'abc123',
  title: 't',
  content: 'c',
  created: 1,
  updated: 1,
  ...over,
});

describe('mergeArchive', () => {
  it('creates documents that do not exist locally', () => {
    const { toCreate, conflict } = mergeArchive([], [doc({})]);
    expect(toCreate).toHaveLength(1);
    expect(conflict).toHaveLength(0);
  });

  it('skips identical active documents', () => {
    const local = doc({ updated: 5 });
    const { toCreate, conflict } = mergeArchive([local], [doc({ updated: 5 })]);
    expect(toCreate).toHaveLength(0);
    expect(conflict).toHaveLength(0);
  });

  it('conflicts when active documents differ in updated', () => {
    const local = doc({ updated: 5 });
    const { conflict } = mergeArchive([local], [doc({ updated: 9 })]);
    expect(conflict).toHaveLength(1);
  });

  it('conflicts when local is trashed and archive has newer content', () => {
    const local = doc({ updated: 5, deleted: 6 });
    const { conflict } = mergeArchive([local], [doc({ updated: 9 })]);
    expect(conflict).toHaveLength(1);
  });

  it('keeps local deletion when archive is older', () => {
    const local = doc({ updated: 9, deleted: 10 });
    const { toCreate, conflict } = mergeArchive([local], [doc({ updated: 5 })]);
    expect(toCreate).toHaveLength(0);
    expect(conflict).toHaveLength(0);
  });

  it('keeps local deletion when updated is equal', () => {
    const local = doc({ updated: 5, deleted: 6 });
    const { conflict } = mergeArchive([local], [doc({ updated: 5 })]);
    expect(conflict).toHaveLength(0);
  });

  it('leaves local-only documents untouched', () => {
    const local = doc({ id: 'local' });
    const { toCreate, conflict } = mergeArchive([local], []);
    expect(toCreate).toHaveLength(0);
    expect(conflict).toHaveLength(0);
  });
});
