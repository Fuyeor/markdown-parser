// @/playground/composable/useIndexedDb.ts
import { onMounted, ref } from 'vue';
import { countDocumentStats } from '@/playground/composable/useDocumentStats';

export interface HistoryDocument {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  content: string;
  word_count?: number;
}

type SyncMessage =
  | { type: 'SAVE'; document: HistoryDocument }
  | { type: 'DELETE'; id: string }
  | { type: 'CLEAR' };

const DB_NAME = 'ffm-playground';
const STORE_NAME = 'documents';
const UPDATED_AT_INDEX = 'updated_at';
const DB_VERSION = 1;

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
  documents.value.sort((a, b) => b.updated_at - a.updated_at);
};

const removeDocumentState = (id: string) => {
  documents.value = documents.value.filter((item) => item.id !== id);
};

const initBroadcastChannel = () => {
  if (broadcastChannel) return;
  broadcastChannel = new window.BroadcastChannel(DB_NAME);

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
    const transaction = database.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));

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

    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const request = transaction
      .objectStore(STORE_NAME)
      .index(UPDATED_AT_INDEX)
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
        document.word_count === undefined
          ? {
              ...document,
              word_count: countDocumentStats(document.content).words,
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
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () =>
      reject(request.error ?? new Error('Failed to open IndexedDB'));
    request.onupgradeneeded = () => {
      const upgradedDatabase = request.result;
      const upgradeTransaction = request.transaction;
      const store = upgradedDatabase.objectStoreNames.contains(STORE_NAME)
        ? upgradeTransaction?.objectStore(STORE_NAME)
        : upgradedDatabase.createObjectStore(STORE_NAME, { keyPath: 'id' });

      if (store && !store.indexNames.contains(UPDATED_AT_INDEX)) {
        store.createIndex(UPDATED_AT_INDEX, 'updated_at', { unique: false });
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
