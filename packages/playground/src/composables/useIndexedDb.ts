// @fuyeor/markdown-parser-playground/src/composables/useIndexedDb.ts
import { onMounted, ref } from 'vue';

export interface HistoryDocument {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  content: string;
}

const DB_NAME = 'fuyeor-markdown-playground';
const STORE_NAME = 'documents';
const UPDATED_AT_INDEX = 'updated_at';
const DB_VERSION = 1;

export function useIndexedDb() {
  const documents = ref<HistoryDocument[]>([]);
  const isReady = ref(false);
  const error = ref<Error | null>(null);
  let database: IDBDatabase | null = null;
  let initialization: Promise<void> | null = null;

  const loadAllDocuments = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!database) {
        reject(new Error('IndexedDB is not initialized'));
        return;
      }

      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).index(UPDATED_AT_INDEX).openCursor(null, 'prev');
      const result: HistoryDocument[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          documents.value = result;
          resolve();
          return;
        }

        result.push(cursor.value as HistoryDocument);
        cursor.continue();
      };

      request.onerror = () => reject(request.error ?? new Error('Failed to read documents'));
    });
  };

  const initialize = (): Promise<void> => {
    if (initialization) return initialization;

    initialization = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB is not supported'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
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
        error.value = reason instanceof Error ? reason : new Error(String(reason));
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

  const saveDocument = async (document: HistoryDocument): Promise<void> => {
    const activeDatabase = await requireDatabase();

    await new Promise<void>((resolve, reject) => {
      const transaction = activeDatabase.transaction(STORE_NAME, 'readwrite');
      const request = transaction.objectStore(STORE_NAME).put({ ...document });

      request.onerror = () => reject(request.error ?? new Error('Failed to save document'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Failed to save document'));
      transaction.oncomplete = resolve;
    });

    const index = documents.value.findIndex((item) => item.id === document.id);
    if (index >= 0) documents.value[index] = { ...document };
    else documents.value.push({ ...document });
    documents.value.sort((a, b) => b.updated_at - a.updated_at);
  };

  const deleteDocument = async (id: string): Promise<void> => {
    const activeDatabase = await requireDatabase();

    await new Promise<void>((resolve, reject) => {
      const transaction = activeDatabase.transaction(STORE_NAME, 'readwrite');
      const request = transaction.objectStore(STORE_NAME).delete(id);

      request.onerror = () => reject(request.error ?? new Error('Failed to delete document'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Failed to delete document'));
      transaction.oncomplete = resolve;
    });

    documents.value = documents.value.filter((item) => item.id !== id);
  };

  onMounted(() => {
    void initialize().catch(() => undefined);
  });

  return {
    documents,
    isReady,
    error,
    saveDocument,
    deleteDocument,
    loadAllDocuments,
  };
}
