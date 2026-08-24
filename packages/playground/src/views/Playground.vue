<!-- @/views/Playground.vue -->
<template>
  <div class="playground-wrapper">
    <section class="playground-layout">
      <PlaygroundEditor
        ref="editorComponent"
        :created-at="currentDocument?.created_at"
        :updated-at="currentDocument?.updated_at"
        @scroll="handleEditorScroll"
        @copy-source="handleCopySource"
        @copy-html="handleCopyHtml"
      >
        <template #share>
          <PlaygroundShare />
        </template>
      </PlaygroundEditor>
      <PlaygroundPreview
        ref="previewComponent"
        @scroll="handlePreviewScroll"
      />
    </section>
    <DocumentStatsBar
      v-if="editorComponent?.stats"
      :created-at="currentDocument?.created_at"
      :updated-at="currentDocument?.updated_at"
      :stats="editorComponent.stats"
    />
  </div>
</template>

<script setup lang="ts">
import PlaygroundEditor from '@/components/Playground/PlaygroundEditor.vue';
import PlaygroundPreview from '@/components/Playground/PlaygroundPreview.vue';
import DocumentStatsBar from '@/components/Playground/DocumentStatsBar.vue';
import PlaygroundShare from '@/components/Playground/PlaygroundShare.vue';

import { computed, ref, watch } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { useToast } from '@fuyeor/interactify';
import { useRoute, useRouter } from '@fuyeor/vue-router';
import { fetchExample } from '@/api/examples';
import { decodeSnippet } from '@/composables/useCompression';
import { usePlaygroundSource } from '@/composables/usePlaygroundSource';
import { useIndexedDb, type HistoryDocument } from '@/composables/useIndexedDb';
import { countDocumentStats } from '@/composables/useDocumentStats';

const route = useRoute();
const router = useRouter();

const { t, locale } = useLocale();
const { showToast } = useToast();
const { source } = usePlaygroundSource();

const {
  documents,
  saveDocument,
  isReady,
  error: storageError,
} = useIndexedDb();
const editorComponent = ref<InstanceType<typeof PlaygroundEditor> | null>(null);
const previewComponent = ref<InstanceType<typeof PlaygroundPreview> | null>(null);
let synchronizingScroll = false;

const releaseScrollSync = () => {
  window.requestAnimationFrame(() => {
    synchronizingScroll = false;
  });
};

const handleCopySource = async () => {
  await window.navigator.clipboard.writeText(source.value);
  showToast(t('copy.success'), { type: 'success' });
};

const handleCopyHtml = async () => {
  const html = previewComponent.value?.renderedHtml;
  if (!html) return;

  const clipboardItem = new window.ClipboardItem({
    'text/html': new window.Blob([html], { type: 'text/html' }),
    'text/plain': new window.Blob([source.value], { type: 'text/plain' }),
  });
  await window.navigator.clipboard.write([clipboardItem]);
  showToast(t('copy.success'), { type: 'success' });
};

const handleEditorScroll = (percentage: number) => {
  if (synchronizingScroll) return;
  synchronizingScroll = true;
  previewComponent.value?.scrollToPercentage(percentage);
  releaseScrollSync();
};

const handlePreviewScroll = (percentage: number) => {
  if (synchronizingScroll) return;
  synchronizingScroll = true;
  editorComponent.value?.scrollToPercentage(percentage);
  releaseScrollSync();
};
const currentDocument = computed(() => {
  const id = String(route.params.id ?? '');
  return documents.value.find((document) => document.id === id);
});
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

  const stats = countDocumentStats(content);
  const document: HistoryDocument = {
    ...previous,
    title: extractTitle(content, t('documents.untitled')),
    updated_at: window.Date.now(),
    content,
    word_count: stats.words,
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
    const stats = countDocumentStats(content);
    const document: HistoryDocument = {
      id: window.crypto.randomUUID(),
      title: extractTitle(content, t('documents.untitled')),
      created_at: now,
      updated_at: now,
      content,
      word_count: stats.words,
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
.playground-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.playground-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
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
