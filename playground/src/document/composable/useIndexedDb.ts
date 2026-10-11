// @/document/composable/useIndexedDb.ts
import { onMounted, ref } from 'vue';
import { countDocumentStats } from '@/document/composable/useDocumentStats';

export interface HistoryDocument {
  id: string;
  title: string;
  content: string;
  word?: number;
  created: number;
  updated: number;
}

type SyncMessage =
  | { type: 'SAVE'; document: HistoryDocument }
  | { type: 'DELETE'; id: string }
  | { type: 'CLEAR' };

const db = {
  name: 'ffm-playground',
  version: 1,
  table: {
    name: 'document',
    updatedAtIndex: 'updated',
  },
};

const documents = ref<HistoryDocument[]>([]);
const isReady = ref(false);
const error = ref<Error | null>(null);
let database: IDBDatabase | null = null;
let initialization: Promise<void> | null = null;
let broadcastChannel: BroadcastChannel | null = null;

const upsertDocumentState = (document: HistoryDocument) => {
  const index = documents.value.findIndex((item) => item.id === document.id);
  if (index >= 0) documents.value[index] = { ...document };
  else documents.value.push({ ...document });
  documents.value.sort((a, b) => b.updated - a.updated);
};

const removeDocumentState = (id: string) => {
  documents.value = documents.value.filter((item) => item.id !== id);
};

const initBroadcastChannel = () => {
  if (broadcastChannel) return;
  broadcastChannel = new window.BroadcastChannel(db.name);

  broadcastChannel.onmessage = (event: MessageEvent<SyncMessage>) => {
    const message = event.data;
    if (message.type === 'SAVE') upsertDocumentState(message.document);
    else if (message.type === 'DELETE') removeDocumentState(message.id);
    else if (message.type === 'CLEAR') documents.value = [];
  };
};

const executeStore = (
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!database) return reject(new Error('IndexedDB is not initialized'));
    const transaction = database.transaction(db.table.name, mode);
    const request = action(transaction.objectStore(db.table.name));

    request.onerror = () =>
      reject(request.error ?? new Error('IndexedDB request failed'));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
    transaction.oncomplete = () => resolve();
  });
};

const loadAllDocuments = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!database) return reject(new Error('IndexedDB is not initialized'));

    const transaction = database.transaction(db.table.name, 'readwrite');
    const request = transaction
      .objectStore(db.table.name)
      .index(db.table.updatedAtIndex)
      .openCursor(null, 'prev');
    const result: HistoryDocument[] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        transaction.oncomplete = () => {
          documents.value = result;
          resolve();
        };
        return;
      }

      const document = cursor.value as HistoryDocument;
      const normalizedDocument =
        document.word === undefined
          ? {
              ...document,
              word: countDocumentStats(document.content).words,
            }
          : document;
      result.push(normalizedDocument);
      if (normalizedDocument !== document) cursor.update(normalizedDocument);
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
    };
    request.onsuccess = () => {
      database = request.result;
      database.onversionchange = () => database?.close();
      loadAllDocuments().then(resolve).catch(reject);
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
    await requireDatabase();
    await executeStore('readwrite', (store) => store.put({ ...document }));
    upsertDocumentState(document);
    broadcastChannel?.postMessage({ type: 'SAVE', document });
  };

  const deleteDocument = async (id: string): Promise<void> => {
    await requireDatabase();
    await executeStore('readwrite', (store) => store.delete(id));
    removeDocumentState(id);
    broadcastChannel?.postMessage({ type: 'DELETE', id });
  };

  const clearDocuments = async (): Promise<void> => {
    await requireDatabase();
    await executeStore('readwrite', (store) => store.clear());
    documents.value = [];
    broadcastChannel?.postMessage({ type: 'CLEAR' });
  };

  onMounted(() => {
    initBroadcastChannel();
    initialize().catch(() => undefined);
  });

  return {
    documents,
    isReady,
    error,
    saveDocument,
    deleteDocument,
    clearDocuments,
    loadAllDocuments,
  };
}
