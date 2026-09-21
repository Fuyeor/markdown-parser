<!-- @/playground/index.vue -->
<template>
  <div class="playground-layout">
    <section class="playground">
      <editor
        ref="editorComponent"
        :created-at="currentDocument?.created_at"
        :updated-at="currentDocument?.updated_at"
        @scroll="handleEditorScroll"
        @copy-source="handleCopySource"
        @copy-html="handleCopyHtml"
      >
        <template #share>
          <share-modal />
        </template>
      </editor>

      <preview ref="previewComponent" @scroll="handlePreviewScroll" />
    </section>

    <stats-bar
      v-if="editorComponent?.stats"
      :created-at="currentDocument?.created_at"
      :updated-at="currentDocument?.updated_at"
      :stats="editorComponent.stats"
    />
  </div>
</template>

<script setup lang="ts">
import Editor from './component/editor.vue';
import Preview from './component/preview.vue';
import StatsBar from './component/stats-bar.vue';
import ShareModal from './component/share-modal.vue';

import { computed, ref, watch } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { useToast } from '@fuyeor/interactify';
import { useRoute, useRouter } from '@fuyeor/vue-router';
import { debounce } from '@fuyeor/commons';
import { get } from './api';
import { decodeSnippet } from './composable/useCompression';
import { usePlaygroundSource } from './composable/usePlaygroundSource';
import { useIndexedDb, type HistoryDocument } from './composable/useIndexedDb';
import { countDocumentStats } from './composable/useDocumentStats';

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

const editorComponent = ref<InstanceType<typeof Editor> | null>(null);
const previewComponent = ref<InstanceType<typeof Preview> | null>(null);
const isRouteLoading = ref(true);

let synchronizingScroll = false;
let skipNextSourceChange = false;
let creatingDocument = false;

const currentDocument = computed(() => {
  const id = String(route.params.id ?? '');
  return documents.value.find((document) => document.id === id);
});

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
    title: extractTitle(content, t('documents.untitled')),
    updated_at: window.Date.now(),
    content,
    word_count: countDocumentStats(content).words,
  };
  await saveDocument(document);
};

const debouncedSave = debounce(async (id: string, content: string) => {
  await saveDocumentContent(id, content);
}, 500);

const debouncedCreate = debounce(async (content: string) => {
  await createDocumentFromInput(content);
}, 300);

const replaceSourceIfChanged = (content: string) => {
  if (source.value === content) return;
  skipNextSourceChange = true;
  const editor = editorComponent.value;
  if (editor) editor.replaceSource(content);
  else source.value = content;
};

const createDocumentFromInput = async (content: string) => {
  if (creatingDocument || !content || storageError.value) return;
  creatingDocument = true;

  try {
    const now = window.Date.now();
    const document: HistoryDocument = {
      id: window.crypto.randomUUID(),
      title: extractTitle(content, t('documents.untitled')),
      created_at: now,
      updated_at: now,
      content,
      word_count: countDocumentStats(content).words,
    };
    await saveDocument(document);
    await router.replace({
      name: 'Playground',
      params: { ...route.params, id: document.id },
    });
  } finally {
    creatingDocument = false;
  }
};

const loadRouteDocument = async () => {
  if (!isReady.value) return;
  if (storageError.value) {
    isRouteLoading.value = false;
    return;
  }

  debouncedCreate.cancel();
  debouncedSave.cancel();

  const id = String(route.params.id ?? '');
  const document = id
    ? documents.value.find((item) => item.id === id)
    : undefined;

  if (id && !document) {
    replaceSourceIfChanged('');
    isRouteLoading.value = false;
    await router.replace({
      name: 'Playground',
      params: { ...route.params, id: undefined },
    });
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
      const exampleContent = await get(locale.value);
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

watch(source, (content) => {
  if (!isReady.value || storageError.value || isRouteLoading.value) return;
  if (skipNextSourceChange) {
    skipNextSourceChange = false;
    return;
  }

  const id = String(route.params.id ?? '');
  if (!id) {
    debouncedCreate(source.value);
    return;
  }
  debouncedSave(id, content);
});

watch(
  [isReady, () => route.params.id],
  ([ready]) => {
    if (!ready) return;
    isRouteLoading.value = true;
    loadRouteDocument().catch(console.error);
  },
  { immediate: true },
);
</script>

<style>
.playground-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.playground {
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
}

.section {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

@media (width <= 900px) {
  .playground-layout {
    position: absolute;
    top: var(--height-header);
    height: calc(100% - var(--height-header));
  }

  .playground {
    flex-direction: column-reverse;
  }
}

.preview {
  .tab-container {
    flex-shrink: 0;
    margin: 0;

    .tab-item {
      align-items: stretch;
    }
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>
