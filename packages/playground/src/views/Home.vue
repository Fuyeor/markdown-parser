<!-- @fuyeor/markdown-parser-playground/src/views/Home.vue -->
<template>
  <header class="topbar">
    <div class="topbar-actions">
      <button type="button" class="share-btn" @click="openShareModal">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        Share
      </button>
      <LocaleSwitcher
        :supported-locales="SUPPORTED_LOCALES"
        @change="handleLocaleChange"
      />
    </div>
  </header>

  <Modal v-model="isShareModalOpen" strict>
    <template #header>
      <h3>Share Playground</h3>
    </template>
    <div class="share-modal-content">
      <p>Share this snippet with others:</p>
      <div class="share-input-group">
        <input type="text" readonly :value="shareLink" @focus="$event.target?.select()" />
        <button type="button" @click="copyShareLink">Copy</button>
      </div>
    </div>
  </Modal>

  <section class="editor-output-layout" aria-label="Markdown parser playground">
    <article class="pane editor-pane">
      <header class="pane-header">
        <span>01</span>
        <h2>{{ t('editor.source') }}</h2>
      </header>
      <MarkdownToolbar
        :can-undo="canUndo"
        :can-redo="canRedo"
        @undo="undo"
        @redo="redo"
        @format="formatDocument"
        @tool="applyTool"
      />
      <textarea
        ref="editor"
        v-model="source"
        spellcheck="false"
        @input="recordInput"
      />
    </article>

    <article class="pane output-pane">
      <Tabs
        :tabs="tabs"
        :active-tab-value="activeTab"
        :is-router-nav="false"
        container-class="output-tabs"
        @tab-click="activeTab = $event"
      >
        <template #preview>{{ t('preview.render') }}</template>
        <template #ast>JSON (AST)</template>
        <template #html>HTML</template>
      </Tabs>
      <div class="output-content">
        <div v-if="activeTab === 'preview'" class="markdown-rendered">
          <component :is="previewComponent" />
        </div>
        <pre v-else-if="activeTab === 'ast'">{{ astJson }}</pre>
        <pre v-else>{{ renderedHtml }}</pre>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, h, ref, watch, onMounted } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { useRoute, useRouter } from '@fuyeor/vue-router';
import { LocaleSwitcher, Tabs, Modal, useToast, type TabItem } from '@fuyeor/interactify';
import { encodeSnippet, decodeSnippet } from '../composables/useCompression';
import {
  createFuyeorMarkdownParser,
  render as renderMarkdown,
} from '@fuyeor/markdown-parser';
import { renderToVue } from '@fuyeor/markdown-parser-vue';
import MarkdownToolbar from '../components/Playground/MarkdownToolbar.vue';
import { useMarkdownEditor } from '../components/Playground/useMarkdownEditor';
import { SUPPORTED_LOCALES } from '../config/locales';
import { fetchExample } from '../api/examples';

const { t, locale } = useLocale();
const route = useRoute();
const router = useRouter();
const editor = ref<HTMLTextAreaElement | null>(null);
const source = ref('');
const activeTab = ref('preview');
const tabs: TabItem[] = [
  { value: 'preview' },
  { value: 'ast' },
  { value: 'html' },
];
const {
  canUndo,
  canRedo,
  replaceSource,
  recordInput,
  applyTool,
  formatDocument,
  undo,
  redo,
} = useMarkdownEditor(source, editor);

const isShareModalOpen = ref(false);
const shareLink = ref('');
const toast = useToast();

const openShareModal = async () => {
  const snippet = await encodeSnippet(source.value);
  const url = new URL(window.location.href);
  url.hash = `snippet=${snippet}`;
  shareLink.value = url.toString();
  isShareModalOpen.value = true;
};

const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    toast.success('Link copied to clipboard');
  } catch {
    toast.error('Failed to copy link');
  }
};

// Load the current language example without putting large documents in locale messages.
watch(locale, (newLocale) => {
  // Do not overwrite with example if there is a snippet in the URL hash
  if (window.location.hash.startsWith('#snippet=')) return;
  void fetchExample(newLocale).then(replaceSource);
}, { immediate: true });

onMounted(() => {
  const hash = window.location.hash;
  if (hash.startsWith('#snippet=')) {
    const snippet = hash.slice('#snippet='.length);
    void decodeSnippet(snippet).then((decoded) => {
      if (decoded) replaceSource(decoded);
    });
  }
});

const handleLocaleChange = (newLocale: string) => {
  if (!SUPPORTED_LOCALES.includes(newLocale as (typeof SUPPORTED_LOCALES)[number])) return;
  router.replace({ name: route.name, params: { locale: newLocale } });
};

const parser = createFuyeorMarkdownParser();
const ast = computed(() => parser(source.value));
const astJson = computed(() => JSON.stringify(ast.value, null, 2));
const renderedHtml = computed(() => renderMarkdown(ast.value));
const previewComponent = computed(() => ({
  render: () => h('div', renderToVue(ast.value)),
}));
</script>

<style scoped>
.topbar {
  display: flex;
  justify-content: flex-end;
  margin: 20px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #dfe4e8;
  border-radius: 6px;
  background: white;
  color: #3855ae;
  font-weight: 600;
  cursor: pointer;
}

.share-btn:hover {
  background: #edf1ff;
}

.share-modal-content p {
  margin-top: 0;
  margin-bottom: 12px;
  color: #53606d;
}

.share-input-group {
  display: flex;
  gap: 8px;
}

.share-input-group input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dfe4e8;
  border-radius: 6px;
  background: #fbfcfd;
  color: #1a2027;
  font-family: monospace;
}

.share-input-group button {
  padding: 0 16px;
  border: 0;
  border-radius: 6px;
  background: #3855ae;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.share-input-group button:hover {
  background: #2a418a;
}
</style>
