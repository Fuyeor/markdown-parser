<!-- @/document/index.vue -->
<template>
  <div class="playground" :data-mode="mode">
    <template v-if="mode === 'rich'">
      <editor :key="route.params.id" :content="source" />
    </template>

    <template v-else>
      <layout-anchor>
        <preview ref="previewComponent" @scroll="handlePreviewScroll" />
      </layout-anchor>

      <text-area
        ref="textComponent"
        :created-at="currentDocument?.created"
        :updated-at="currentDocument?.updated"
        :can-trash="!!currentDocument"
        @scroll="handleEditorScroll"
        @option="handleOption"
        @share="handleShare"
        @trash="handleTrash"
      />
    </template>

    <share-modal ref="shareModalRef" />
  </div>
</template>

<script setup lang="ts">
import Editor from './component/editor.vue';
import TextArea from './component/textarea.vue';
import Preview from './component/preview.vue';
import ShareModal from './component/toolbar/share.vue';

import { computed, ref, watch } from 'vue';
import { t, locale } from '@fuyeor/vue-locale';
import { LayoutAnchor } from '@fuyeor/interactify';
import { useRoute, useRouter } from '@fuyeor/vue-router';
import { debounce } from '@fuyeor/commons';
import { statText } from '@fuyeor/util';
import { get } from './api';
import { decodeSnippet } from './composable/useCompression';
import { useIndexedDb, type HistoryDocument } from './composable/useIndexedDb';
import { source } from './state/source';
import { extractTitle } from './util/extractTitle';

const { mode = 'code' } = defineProps<{
  mode: 'rich' | 'code';
}>();

const route = useRoute();
const router = useRouter();

const {
  documents,
  saveDocument,
  deleteOne,
  isReady,
  error: storageError,
} = useIndexedDb();

const textComponent = ref<InstanceType<typeof TextArea> | null>(null);
const previewComponent = ref<InstanceType<typeof Preview> | null>(null);
const shareModalRef = ref<InstanceType<typeof ShareModal> | null>(null);
const isRouteLoading = ref(true);

let skipNextSourceChange = false;
let creatingDocument = false;

const currentDocument = computed(() => {
  const id = String(route.params.id ?? '');
  return documents.value.find((document) => document.id === id);
});

const handleTrash = async () => {
  const id = String(route.params.id ?? '');
  if (!id) return;

  await deleteOne(id);

  await router.replace({
    name: 'Document',
    params: { ...route.params, id: undefined },
  });
};

const handleShare = () => {
  shareModalRef.value?.open(
    previewComponent.value?.html,
    String(route.params.id ?? ''),
  );
};

const handleOption = () => {
  router.push({ name: 'Option.Editor' });
};

const handleEditorScroll = (percentage: number) => {
  previewComponent.value?.scrollToPercentage(percentage);
};

const handlePreviewScroll = (percentage: number) => {
  textComponent.value?.scrollToPercentage(percentage);
};

const saveDocumentContent = async (id: string, content: string) => {
  const previous = documents.value.find((document) => document.id === id);
  if (!previous) return;

  const document: HistoryDocument = {
    ...previous,
    title: extractTitle(content, t('document.untitled')),
    updated: Date.now(),
    content,
    word: statText(content).word,
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
  const textarea = textComponent.value;
  if (textarea) textarea.replaceSource(content);
  else source.value = content;
};

const createDocumentFromInput = async (content: string) => {
  if (creatingDocument || !content || storageError.value) return;
  creatingDocument = true;

  try {
    const now = Date.now();
    const document: HistoryDocument = {
      id: window.crypto.getRandomValues(new Uint8Array(6)).toHex(),
      title: extractTitle(content, t('document.untitled')),
      content,
      word: statText(content).word,
      created: now,
      updated: now,
    };
    await saveDocument(document);
    await router.replace({
      name: 'Document',
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

  if (window.location.hash.startsWith('#snippet=')) {
    const snippet = await decodeSnippet(
      window.location.hash.slice('#snippet='.length),
    );
    replaceSourceIfChanged(snippet ?? '');
    isRouteLoading.value = false;
    return;
  }

  const id = String(route.params.id ?? '');
  const document = id
    ? documents.value.find((item) => item.id === id)
    : undefined;

  if (id && !document) {
    replaceSourceIfChanged('');
    isRouteLoading.value = false;
    await router.replace({
      name: 'Document',
      params: { ...route.params, id: undefined },
    });
    return;
  }

  if (document) {
    replaceSourceIfChanged(document.content);
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
.textarea-scroll-container,
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
