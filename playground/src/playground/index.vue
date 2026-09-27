<!-- @/playground/index.vue -->
<template>
  <div class="playground">
    <layout-anchor>
      <preview ref="previewComponent" @scroll="handlePreviewScroll" />
    </layout-anchor>

    <editor
      ref="editorComponent"
      :created-at="currentDocument?.created_at"
      :updated-at="currentDocument?.updated_at"
      @scroll="handleEditorScroll"
      @share="handleShare"
      @copy-source="copyText(source)"
      @copy-html="handleCopyHtml"
    />

    <share-modal ref="shareModalRef" />
  </div>
</template>

<script setup lang="ts">
import Editor from './component/editor.vue';
import Preview from './component/preview.vue';
import ShareModal from './component/share-modal.vue';

import { computed, ref, watch } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { useToast, useCopy, LayoutAnchor } from '@fuyeor/interactify';
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
const { copyText } = useCopy();
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
const shareModalRef = ref<InstanceType<typeof ShareModal> | null>(null);
const isRouteLoading = ref(true);

let skipNextSourceChange = false;
let creatingDocument = false;

const currentDocument = computed(() => {
  const id = String(route.params.id ?? '');
  return documents.value.find((document) => document.id === id);
});

const handleShare = () => {
  shareModalRef.value?.open();
};

const handleCopyHtml = async () => {
  const html = previewComponent.value?.html;
  if (!html) return;

  const clipboardItem = new window.ClipboardItem({
    'text/html': new window.Blob([html], { type: 'text/html' }),
    'text/plain': new window.Blob([source.value], { type: 'text/plain' }),
  });
  await window.navigator.clipboard.write([clipboardItem]);
  showToast(t('copy.success'), { type: 'success' });
};

const handleEditorScroll = (percentage: number) => {
  previewComponent.value?.scrollToPercentage(percentage);
};

const handlePreviewScroll = (percentage: number) => {
  editorComponent.value?.scrollToPercentage(percentage);
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
.playground {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 20px);
  width: 100%;
}

/* scroll performance optimization */
.editor-scroll-container,
.output-content {
  contain: layout paint;
}

@media (width <= 900px) {
  .playground {
    position: absolute;
    top: var(--height-header);
    height: calc(100% - var(--height-header));
  }

  .section {
    padding: 6px 12px;
    height: 50%;
  }
}
</style>
