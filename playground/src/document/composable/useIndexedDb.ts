// @/document/composable/useIndexedDb.ts
import { onMounted, ref } from 'vue';
import { statText } from '@fuyeor/util';

export interface HistoryDocument {
  id: string;
  title: string;
  content: string;
  word?: number;
  created: number;
  updated: number;
  pinned?: number;
  deleted?: number;
}

type SyncMessage =
  | { type: 'SAVE'; document: HistoryDocument }
  /** soft deletion */
  | { type: 'DELETE'; idArray: string[]; deletedAt: number }
  /** hard deletion */
  | { type: 'PURGE'; idArray: string[] }
  | { type: 'RESTORE'; idArray: string[]; updated: number }
  /** clear deleted document */
  | { type: 'CLEAR' };

const db = {
  name: 'ffm-playground',
  version: 2,
  table: {
    name: 'document',
    updatedAtIndex: 'updated',
    deletedAtIndex: 'deleted',
  },
};

/** 21 days */
const trashTtl = 21 * 24 * 60 * 60 * 1000;
const broadcastChannel = new window.BroadcastChannel(db.name);
const documents = ref<HistoryDocument[]>([]);
const trashed = ref<HistoryDocument[]>([]);
const isReady = ref(false);
const error = ref<Error | null>(null);

let database: IDBDatabase | null = null;
let initialization: Promise<void> | null = null;

const upsertDocumentState = (document: HistoryDocument) => {
  const index = documents.value.findIndex((item) => item.id === document.id);
  if (index >= 0) documents.value[index] = { ...document };
  else documents.value.push({ ...document });
  documents.value.sort((a, b) => b.updated - a.updated);
};

// Move an active document into the trash state.
const trashDocumentState = (id: string, deleted: number) => {
  const index = documents.value.findIndex((item) => item.id === id);
  if (index < 0) return;
  const [document] = documents.value.splice(index, 1);
  trashed.value = [{ ...document, deleted }, ...trashed.value].sort(
    (a, b) => b.deleted! - a.deleted!,
  );
};

// Restore a trashed document into the active state with a fresh timestamp.
const restoreDocumentState = (id: string, updated: number) => {
  const index = trashed.value.findIndex((item) => item.id === id);
  if (index < 0) return;
  const [document] = trashed.value.splice(index, 1);
  const { deleted, ...rest } = document;
  upsertDocumentState({ ...rest, updated });
};

// Remove a document from both active and trash state.
const purgeDocumentState = (id: string) => {
  documents.value = documents.value.filter((item) => item.id !== id);
  trashed.value = trashed.value.filter((item) => item.id !== id);
};

broadcastChannel.onmessage = (event: MessageEvent<SyncMessage>) => {
  const message = event.data;
  switch (message.type) {
    case 'SAVE': {
      upsertDocumentState(message.document);
      break;
    }
    case 'DELETE': {
      for (const id of message.idArray)
        trashDocumentState(id, message.deletedAt);
      break;
    }
    case 'PURGE': {
      for (const id of message.idArray) purgeDocumentState(id);
      break;
    }
    case 'RESTORE': {
      for (const id of message.idArray)
        restoreDocumentState(id, message.updated);
      break;
    }
    case 'CLEAR': {
      trashed.value = [];
      break;
    }
    default:
  }
};

const executeStore = (
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest | void,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!database) return reject(new Error('IndexedDB is not initialized'));
    const transaction = database.transaction(db.table.name, mode);
    const request = action(transaction.objectStore(db.table.name));

    if (request) {
      request.onerror = () =>
        reject(request.error ?? new Error('IndexedDB request failed'));
    }
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
    transaction.oncomplete = () => resolve();
  });
};

const getAll = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!database) return reject(new Error('IndexedDB is not initialized'));

    const transaction = database.transaction(db.table.name, 'readwrite');
    const request = transaction
      .objectStore(db.table.name)
      .index(db.table.updatedAtIndex)
      .openCursor(null, 'prev');
    const active: HistoryDocument[] = [];
    const trash: HistoryDocument[] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        transaction.oncomplete = () => {
          documents.value = active;
          // sorted by new deleted time
          trashed.value = trash.toSorted((a, b) => b.deleted! - a.deleted!);
          resolve();
        };
        return;
      }

      const document = cursor.value as HistoryDocument;
      const normalizedDocument =
        document.word === undefined
          ? { ...document, word: statText(document.content).word }
          : document;
      if (normalizedDocument !== document) cursor.update(normalizedDocument);

      if (normalizedDocument.deleted === undefined)
        active.push(normalizedDocument);
      else trash.push(normalizedDocument);
      cursor.continue();
    };

    request.onerror = () =>
      reject(request.error ?? new Error('Failed to read documents'));
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Failed to read documents'));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Failed to read documents'));
  });
};

// Purge documents that have been in trash longer than trashTtl.
const purgeExpired = async (): Promise<void> => {
  const threshold = Date.now() - trashTtl;
  const idArray = trashed.value
    .filter((document) => document.deleted! < threshold)
    .map((document) => document.id);
  if (idArray.length === 0) return;

  await executeStore('readwrite', (store) => {
    for (const id of idArray) store.delete(id);
  });
  for (const id of idArray) purgeDocumentState(id);
  broadcastChannel.postMessage({ type: 'PURGE', idArray });
};

const initialize = (): Promise<void> => {
  if (initialization) return initialization;

  initialization = new Promise<void>((resolve, reject) => {
    const request = window.indexedDB.open(db.name, db.version);

    request.onerror = () =>
      reject(request.error ?? new Error('Failed to open IndexedDB'));
    request.onupgradeneeded = () => {
      const upgradedDatabase = request.result;
      const upgradeTransaction = request.transaction;
      const store = upgradedDatabase.objectStoreNames.contains(db.table.name)
        ? upgradeTransaction?.objectStore(db.table.name)
        : upgradedDatabase.createObjectStore(db.table.name, { keyPath: 'id' });

      if (store && !store.indexNames.contains(db.table.updatedAtIndex)) {
        store.createIndex(db.table.updatedAtIndex, 'updated', {
          unique: false,
        });
      }

      if (store && !store.indexNames.contains(db.table.deletedAtIndex)) {
        store.createIndex(db.table.deletedAtIndex, 'deleted', {
          unique: false,
        });
      }
    };
    request.onsuccess = () => {
      database = request.result;
      database.onversionchange = () => database?.close();
      // purge expired document when loaded
      getAll().then(purgeExpired).then(resolve).catch(reject);
    };
  }).then(
    () => {
      isReady.value = true;
    },
    (reason: unknown) => {
      error.value =
        reason instanceof Error ? reason : new Error(String(reason));
      isReady.value = true;
      throw error.value;
    },
  );

  return initialization;
};

const requireDatabase = async (): Promise<IDBDatabase> => {
  await initialize();
  if (!database) throw new Error('IndexedDB is not available');
  return database;
};

export function useIndexedDb() {
  const saveDocument = async (document: HistoryDocument): Promise<void> => {
    if (document.deleted !== undefined)
      throw new Error('Cannot save a trashed document; use restoreOne instead');

    await requireDatabase();
    await executeStore('readwrite', (store) => store.put({ ...document }));
    upsertDocumentState(document);
    broadcastChannel.postMessage({ type: 'SAVE', document });
  };

  // Toggle the pinned state without refreshing `updated`.
  const favorite = async (id: string): Promise<void> => {
    const document = documents.value.find((item) => item.id === id);
    if (!document) throw new Error(`Document not found: ${id}`);

    const { pinned, ...rest } = document;
    const next: HistoryDocument =
      pinned === undefined ? { ...rest, pinned: Date.now() } : rest;

    await requireDatabase();
    await executeStore('readwrite', (store) => store.put({ ...next }));
    upsertDocumentState(next);
    broadcastChannel.postMessage({ type: 'SAVE', document: next });
  };

  /** soft delete one document */
  const deleteOne = async (id: string): Promise<void> => {
    const document = documents.value.find((item) => item.id === id);
    if (!document) throw new Error(`Document not found: ${id}`);

    const deleted = Date.now();
    await requireDatabase();
    await executeStore('readwrite', (store) =>
      store.put({ ...document, deleted }),
    );
    trashDocumentState(id, deleted);
    broadcastChannel.postMessage({
      type: 'DELETE',
      idArray: [id],
      deletedAt: deleted,
    });
  };

  /** soft delete all document */
  const deleteAll = async (): Promise<void> => {
    const idArray = documents.value.map((document) => document.id);
    if (idArray.length === 0) return;

    const deleted = Date.now();
    const trashedDocuments = documents.value.map((document) => ({
      ...document,
      deleted,
    }));
    await requireDatabase();
    await executeStore('readwrite', (store) => {
      for (const document of trashedDocuments) store.put(document);
    });
    trashed.value = [...trashedDocuments, ...trashed.value].sort(
      (a, b) => b.deleted! - a.deleted!,
    );
    documents.value = [];
    broadcastChannel.postMessage({
      type: 'DELETE',
      idArray,
      deletedAt: deleted,
    });
  };

  /** hard delete one document */
  const purgeOne = async (id: string): Promise<void> => {
    await requireDatabase();
    await executeStore('readwrite', (store) => store.delete(id));
    purgeDocumentState(id);
    broadcastChannel.postMessage({ type: 'PURGE', idArray: [id] });
  };

  /** hard delete all deleted document */
  const purgeAll = async (): Promise<void> => {
    const idArray = trashed.value.map((document) => document.id);
    if (idArray.length === 0) return;

    await requireDatabase();
    await executeStore('readwrite', (store) => {
      for (const id of idArray) store.delete(id);
    });
    trashed.value = [];
    broadcastChannel.postMessage({ type: 'CLEAR' });
  };

  /** hard delete all empty document */
  const purgeEmpty = async (): Promise<string[]> => {
    const idArray = documents.value
      .filter((document) => !document.word)
      .map((document) => document.id);
    if (idArray.length === 0) return [];

    await requireDatabase();
    await executeStore('readwrite', (store) => {
      for (const id of idArray) store.delete(id);
    });
    for (const id of idArray) purgeDocumentState(id);
    broadcastChannel.postMessage({ type: 'PURGE', idArray });
    return idArray;
  };

  /** restore one deleted document */
  const restoreOne = async (id: string): Promise<void> => {
    const document = trashed.value.find((item) => item.id === id);
    if (!document) throw new Error(`Trashed document not found: ${id}`);

    const { deleted, ...rest } = document;
    const updated = Date.now();
    await requireDatabase();
    await executeStore('readwrite', (store) => store.put({ ...rest, updated }));
    restoreDocumentState(id, updated);
    broadcastChannel.postMessage({ type: 'RESTORE', idArray: [id], updated });
  };

  onMounted(() => {
    initialize().catch(() => undefined);
  });

  return {
    documents,
    trashed,
    isReady,
    error,
    saveDocument,
    favorite,
    deleteOne,
    deleteAll,
    purgeOne,
    purgeAll,
    purgeEmpty,
    restoreOne,
  };
}
