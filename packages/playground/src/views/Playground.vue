<!-- @/views/Playground.vue -->
<template>
  <section class="playground-layout">
    <PlaygroundEditor ref="editorComponent" />
    <PlaygroundPreview />
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { useRoute, useRouter } from '@fuyeor/vue-router';
import { fetchExample } from '@/api/examples';
import { decodeSnippet } from '@/composables/useCompression';
import { usePlaygroundSource } from '@/composables/usePlaygroundSource';
import { useIndexedDb, type HistoryDocument } from '@/composables/useIndexedDb';
import PlaygroundEditor from '@/components/Playground/PlaygroundEditor.vue';
import PlaygroundPreview from '@/components/Playground/PlaygroundPreview.vue';

const route = useRoute();
const router = useRouter();
const { t, locale } = useLocale();
const { source } = usePlaygroundSource();
const {
  documents,
  saveDocument,
  isReady,
  error: storageError,
} = useIndexedDb();
const editorComponent = ref<InstanceType<typeof PlaygroundEditor> | null>(null);
const isRouteLoading = ref(true);
let skipNextSourceChange = false;
let creatingDocument = false;
let createDocumentTimeout: number | null = null;
let saveTimeout: number | null = null;
let pendingSaveId = '';
let pendingSaveContent = '';

const playgroundParams = (id: string) => ({
  ...(route.params.locale ? { locale: route.params.locale } : {}),
  id,
});

const playgroundPath = () =>
  `${route.params.locale ? `/${route.params.locale}` : ''}/playground`;

const extractTitle = (content: string, untitled: string): string => {
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    const heading = /^#{1,6}\s+(.+)$/.exec(trimmed);
    if (heading) return heading[1].trim().slice(0, 30) || untitled;
    if (trimmed) return trimmed.slice(0, 30);
  }
  return untitled;
};

const saveDocumentContent = async (id: string, content: string) => {
  const previous = documents.value.find((document) => document.id === id);
  if (!previous) return;

  const document: HistoryDocument = {
    ...previous,
    title: extractTitle(content, t('playground.documents.untitled')),
    updated_at: window.Date.now(),
    content,
  };
  await saveDocument(document);
};

const clearCreateDocumentTimeout = () => {
  if (createDocumentTimeout === null) return;
  window.clearTimeout(createDocumentTimeout);
  createDocumentTimeout = null;
};

const clearSaveTimeout = () => {
  if (saveTimeout === null) return;
  window.clearTimeout(saveTimeout);
  saveTimeout = null;
};

const flushPendingSave = async () => {
  if (!pendingSaveId) return;
  const id = pendingSaveId;
  const content = pendingSaveContent;
  pendingSaveId = '';
  pendingSaveContent = '';
  clearSaveTimeout();
  await saveDocumentContent(id, content);
};

const scheduleSave = (id: string, content: string) => {
  pendingSaveId = id;
  pendingSaveContent = content;
  clearSaveTimeout();
  saveTimeout = window.setTimeout(() => {
    saveTimeout = null;
    void flushPendingSave().catch(console.error);
  }, 500);
};

const replaceSourceIfChanged = (content: string) => {
  if (source.value === content) return;
  skipNextSourceChange = true;
  const editor = editorComponent.value;
  if (editor) editor.replaceSource(content);
  else source.value = content;
};

const loadRouteDocument = async () => {
  if (!isReady.value) return;
  if (storageError.value) {
    isRouteLoading.value = false;
    return;
  }

  clearCreateDocumentTimeout();
  await flushPendingSave();
  const id = String(route.params.id ?? '');
  const document = id
    ? documents.value.find((item) => item.id === id)
    : undefined;

  if (id && !document) {
    replaceSourceIfChanged('');
    isRouteLoading.value = false;
    await router.replace(playgroundPath());
    return;
  }

  if (document) {
    replaceSourceIfChanged(document.content);
    isRouteLoading.value = false;
    return;
  }

  if (window.location.hash.startsWith('#snippet=')) {
    const snippet = await decodeSnippet(
      window.location.hash.slice('#snippet='.length),
    );
    replaceSourceIfChanged(snippet ?? '');
    isRouteLoading.value = false;
    return;
  }

  if (documents.value.length === 0 && !id) {
    try {
      const exampleContent = await fetchExample(locale.value);
      if (exampleContent) {
        await createDocumentFromInput(exampleContent);
        isRouteLoading.value = false;
        return;
      }
    } catch (e) {
      console.error('Failed to load example:', e);
    }
  }

  replaceSourceIfChanged('');
  isRouteLoading.value = false;
};

// Create a local document only after the user starts writing on the blank route.
const createDocumentFromInput = async (content: string) => {
  if (creatingDocument || !content || storageError.value) return;
  creatingDocument = true;

  try {
    const now = window.Date.now();
    const document: HistoryDocument = {
      id: window.crypto.randomUUID(),
      title: extractTitle(content, t('playground.documents.untitled')),
      created_at: now,
      updated_at: now,
      content,
    };
    await saveDocument(document);
    await router.replace({
      name: 'Playground',
      params: playgroundParams(document.id),
    });
  } finally {
    creatingDocument = false;
  }
};

// Persist edits with a small debounce and retain the native editor history.
watch(source, (content) => {
  if (!isReady.value || storageError.value || isRouteLoading.value) return;
  if (skipNextSourceChange) {
    skipNextSourceChange = false;
    return;
  }

  const id = String(route.params.id ?? '');
  if (!id) {
    clearCreateDocumentTimeout();
    createDocumentTimeout = window.setTimeout(() => {
      createDocumentTimeout = null;
      void createDocumentFromInput(source.value).catch(console.error);
    }, 300);
    return;
  }
  scheduleSave(id, content);
});

watch(
  isReady,
  (ready) => {
    if (ready) void loadRouteDocument().catch(console.error);
  },
  { immediate: true },
);

watch(
  () => route.params.id,
  () => {
    isRouteLoading.value = true;
    void loadRouteDocument().catch(console.error);
  },
);
</script>

<style>
.playground-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.preview {
  .tab-container {
    flex-shrink: 0;
    margin: 0;

    .tab-item {
      align-items: stretch;
    }
  }

  .output-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 20px;
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>
