// @/option/util/archive.ts
import { statText } from '@fuyeor/util';
import type { HistoryDocument } from '@/document/composable/useIndexedDb';

const archiveApp = 'ffm-playground';
const archiveVersion = 1;
const maxUncompressedSize = 50 * 1024 * 1024;

export type ArchiveErrorCode = 'invalid' | 'tooLarge' | 'tooNew';

export class ArchiveError extends Error {
  constructor(
    public readonly code: ArchiveErrorCode,
    cause?: unknown,
  ) {
    super(code, { cause });
    this.name = 'ArchiveError';
  }
}

export interface ArchiveDocument {
  id: string;
  title: string;
  content: string;
  created: number;
  updated: number;
  pinned?: number;
}

export interface Archive {
  version: typeof archiveVersion;
  exported: number;
  app: typeof archiveApp;
  document: ArchiveDocument[];
}

// Serialize active documents into an archive payload (trash excluded by design).
export const buildArchive = (documents: HistoryDocument[]): Archive => ({
  version: archiveVersion,
  exported: Date.now(),
  app: archiveApp,
  document: documents.map((document) => ({
    id: document.id,
    title: document.title,
    content: document.content,
    created: document.created,
    updated: document.updated,
    ...(document.pinned !== undefined && { pinned: document.pinned }),
  })),
});

// Compress an archive payload into a gzip blob.
export const compressArchive = (archive: Archive): Promise<Blob> => {
  const stream = new window.Blob([JSON.stringify(archive)])
    .stream()
    .pipeThrough(new window.CompressionStream('gzip'));
  return new window.Response(stream).blob();
};

// Decompress a gzip blob with a hard size cap to prevent gzip bombs.
const decompress = async (blob: Blob): Promise<string> => {
  const stream = blob
    .stream()
    .pipeThrough(new window.DecompressionStream('gzip'));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxUncompressedSize) {
        await reader.cancel();
        throw new ArchiveError('tooLarge');
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof ArchiveError) throw error;
    throw new ArchiveError('invalid', error);
  }

  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new window.TextDecoder().decode(buffer);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

// Validate and normalize one document from an archive payload (field whitelist).
const parseDocument = (raw: unknown): HistoryDocument => {
  if (!isRecord(raw)) throw new ArchiveError('invalid');
  const { id, title, content, created, updated, pinned } = raw;

  if (typeof id !== 'string' || !/^[a-z0-9]+$/.test(id))
    throw new ArchiveError('invalid');
  if (typeof title !== 'string' || typeof content !== 'string')
    throw new ArchiveError('invalid');
  if (!isFiniteNumber(created) || !isFiniteNumber(updated))
    throw new ArchiveError('invalid');
  if (pinned !== undefined && !isFiniteNumber(pinned))
    throw new ArchiveError('invalid');

  return {
    id,
    title,
    content,
    word: statText(content).word,
    created,
    updated,
    pinned: pinned as number | undefined,
  };
};

// Decompress, parse, and validate an archive blob into normalized documents.
export const parseArchive = async (blob: Blob): Promise<HistoryDocument[]> => {
  const text = await decompress(blob);

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (cause) {
    throw new ArchiveError('invalid', cause);
  }

  if (!isRecord(raw)) throw new ArchiveError('invalid');
  if (raw.app !== archiveApp) throw new ArchiveError('invalid');
  if (!isFiniteNumber(raw.version)) throw new ArchiveError('invalid');
  if (raw.version > archiveVersion) throw new ArchiveError('tooNew');
  if (!Array.isArray(raw.document)) throw new ArchiveError('invalid');

  return raw.document.map(parseDocument);
};

export interface MergeResult {
  toCreate: HistoryDocument[];
  conflict: HistoryDocument[];
}

// Split incoming documents into new entries and conflicts against local ones.
// Local set includes trashed documents so deletion intent is respected.
export const mergeArchive = (
  local: HistoryDocument[],
  incoming: HistoryDocument[],
): MergeResult => {
  const localMap = new Map(local.map((document) => [document.id, document]));
  const toCreate: HistoryDocument[] = [];
  const conflict: HistoryDocument[] = [];

  for (const document of incoming) {
    const existing = localMap.get(document.id);

    if (!existing) {
      toCreate.push(document);
      continue;
    }

    // Local is active: conflict only when content differs.
    if (existing.deleted === undefined) {
      if (existing.updated !== document.updated) conflict.push(document);
      continue;
    }

    // Local is trashed: keep deletion unless the archive has newer content.
    if (document.updated > existing.updated) conflict.push(document);
  }

  return { toCreate, conflict };
};
