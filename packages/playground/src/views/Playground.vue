<!-- @/views/Playground.vue -->
<template>
  <section class="playground-layout">
    <!-- Left Sidebar for Document History -->
    <LeftSidebar>
      <template #nav>
        <Foldable :title="t('playground.documents')" :modelValue="true" class="document-history-foldable">
          <template #header>
            <div class="document-history-header">
              <p>{{ t('playground.documents') }}</p>
              <button
                type="button"
                class="new-doc-btn"
                :disabled="!isReady || isHistoryLoading || Boolean(storageError)"
                @click.stop="createNewDocument"
              >
                <span aria-hidden="true">+</span> {{ t('playground.documents.new') }}
              </button>
            </div>
          </template>

        <div class="document-search-container">
          <input
            v-model="searchQuery"
            type="search"
            class="document-search-input"
            :placeholder="t('playground.documents.search')"
            :aria-label="t('playground.documents.search')"
          />
        </div>

        <div class="document-list">
          <button
            v-for="doc in filteredDocuments"
            :key="doc.id"
            type="button"
            class="document-item"
            :class="{ active: currentDocId === doc.id }"
            @click="switchDocument(doc)"
          >
            <span class="document-icon" aria-hidden="true"></span>
            <div class="document-info">
              <div class="document-title">{{ doc.title || t('playground.documents.untitled') }}</div>
              <div class="document-time">{{ formatTime(doc.updated_at) }}</div>
            </div>
          </button>
          <div v-if="filteredDocuments.length === 0" class="no-documents">
            {{ t('playground.documents.empty') }}
          </div>
        </div>
        </Foldable>
      </template>
    </LeftSidebar>

    <article class="section editor">
      <MarkdownToolbar
        :can-undo="canUndo"
        :can-redo="canRedo"
        @undo="undo"
        @redo="redo"
        @format="formatDocument"
        @tool="applyTool"
      />
      <div class="editor-scroll-container" @scroll="syncScroll" ref="scrollContainer">
        <div class="editor-line-numbers" aria-hidden="true">
          <div v-for="n in lineNumbers" :key="n" class="line-number">{{ n }}</div>
        </div>
        <div
          class="editor-content-wrapper"
          :style="{ minHeight: `calc(${lineNumbers.length} * 1.6em + 32px)` }"
        >
          <div v-if="!supportsCustomHighlight" class="editor-highlight-layer" aria-hidden="true">
            <div v-for="(html, i) in highlightedLines" :key="i" class="highlight-line" v-html="html"></div>
          </div>
          <div
            v-else
            ref="highlightTarget"
            class="editor-highlight-layer custom-highlight-target"
            aria-hidden="true"
          >{{ source + (source.endsWith('\n') ? ' ' : '') }}</div>
          <textarea
            ref="editor"
            v-model="source"
            spellcheck="false"
            class="editor-textarea"
            @input="recordInput"
            @scroll="syncTextareaScroll"
          />
        </div>
      </div>
    </article>

    <article class="section preview">
      <Tabs
        :tabs="tabs"
        :active-tab-value="activeTab"
        :is-router-nav="false"
        @tab-click="activeTab = $event"
      >
        <template #preview>{{ t('playground.preview.render') }}</template>
        <template #ast>JSON/AST</template>
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
import MarkdownToolbar from '@/components/Playground/MarkdownToolbar.vue';

import { computed, h, ref, watch } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { Tabs, type TabItem, LeftSidebar, Foldable } from '@fuyeor/interactify';
import {
  createFuyeorMarkdownParser,
  render as renderMarkdown,
} from '@fuyeor/markdown-parser';
import { renderToVue } from '@fuyeor/markdown-parser-vue';
import { fetchExample } from '@/api/examples';
import { decodeSnippet } from '@/composables/useCompression';
import { useMarkdownEditor } from '@/composables/useMarkdownEditor';
import { usePlaygroundSource } from '@/composables/usePlaygroundSource';
import { useMarkdownHighlighter } from '@/composables/useMarkdownHighlighter';
import { useIndexedDb, type HistoryDocument } from '@/composables/useIndexedDb';

const { t, locale } = useLocale();
const { source } = usePlaygroundSource();

const editor = ref<HTMLTextAreaElement | null>(null);
const scrollContainer = ref<HTMLElement | null>(null);
const highlightTarget = ref<HTMLElement | null>(null);
const activeTab = ref('preview');

// Document history state is kept in IndexedDB and mirrored in reactive memory.
const { documents, saveDocument, isReady, error: storageError } = useIndexedDb();
const currentDocId = ref('');
const searchQuery = ref('');
const isHistoryInitialized = ref(false);
const isHistoryLoading = ref(true);
let skipNextSave = false;
let saveTimeout: ReturnType<typeof window.setTimeout> | null = null;

const filteredDocuments = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase();
  if (!query) return documents.value;

  return documents.value.filter((doc) =>
    doc.title.toLocaleLowerCase().includes(query) || doc.content.toLocaleLowerCase().includes(query),
  );
});

const generateId = () => crypto.randomUUID();

const extractTitle = (content: string, untitled: string): string => {
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    const heading = /^#{1,6}\s+(.+)$/.exec(trimmed);
    if (heading) return heading[1].trim().slice(0, 30) || untitled;
    if (trimmed) return trimmed.slice(0, 30);
  }
  return untitled;
};

const cancelPendingSave = () => {
  if (!saveTimeout) return;
  window.clearTimeout(saveTimeout);
  saveTimeout = null;
};

const flushPendingSave = async () => {
  if (!saveTimeout) return;
  cancelPendingSave();
  await saveCurrentDocument(source.value);
};

const loadDocumentContent = (content: string) => {
  skipNextSave = source.value !== content;
  replaceSource(content);
};

const createDocument = async (content: string) => {
  await flushPendingSave();
  const now = Date.now();
  const document: HistoryDocument = {
    id: generateId(),
    title: extractTitle(content, t('playground.documents.untitled')),
    created_at: now,
    updated_at: now,
    content,
  };

  currentDocId.value = document.id;
  loadDocumentContent(content);
  await saveDocument(document);
};

const createNewDocument = () => {
  if (!isReady.value || isHistoryLoading.value || storageError.value) return;
  void createDocument('').catch(console.error);
};

const switchDocument = async (document: HistoryDocument) => {
  if (currentDocId.value === document.id) return;

  await flushPendingSave();
  currentDocId.value = document.id;
  loadDocumentContent(document.content);
};

const saveCurrentDocument = async (content: string) => {
  const id = currentDocId.value;
  if (!id) return;

  const previous = documents.value.find((document) => document.id === id);
  const document: HistoryDocument = {
    id,
    title: extractTitle(content, t('playground.documents.untitled')),
    created_at: previous?.created_at ?? Date.now(),
    updated_at: Date.now(),
    content,
  };

  await saveDocument(document);
};

// Debounce writes so typing does not open an IndexedDB transaction for every keypress.
watch(source, (content) => {
  if (!isReady.value || storageError.value || !isHistoryInitialized.value) return;
  if (skipNextSave) {
    skipNextSave = false;
    return;
  }

  if (saveTimeout) window.clearTimeout(saveTimeout);
  saveTimeout = window.setTimeout(() => {
    saveTimeout = null;
    void saveCurrentDocument(content).catch(console.error);
  }, 500);
});

// Open the most recent document or create the initial example after IndexedDB is ready.
watch(isReady, async (ready) => {
  if (!ready || isHistoryInitialized.value) return;
  isHistoryInitialized.value = true;

  try {
    if (storageError.value) {
      const content = await fetchExample(locale.value);
      skipNextSave = true;
      replaceSource(content);
      return;
    }

    const snippet = window.location.hash.startsWith('#snippet=')
      ? await decodeSnippet(window.location.hash.slice('#snippet='.length))
      : null;
    if (snippet !== null) {
      await createDocument(snippet);
      return;
    }

    const latest = documents.value[0];
    if (latest) {
      currentDocId.value = latest.id;
      loadDocumentContent(latest.content);
      return;
    }

    const content = await fetchExample(locale.value);
    await createDocument(content);
  } catch (reason) {
    console.error(reason);
  } finally {
    isHistoryLoading.value = false;
  }
}, { immediate: true });

// Format relative timestamps in the active locale.
const formatTime = (timestamp: number): string => {
  const diff = Math.max(0, Date.now() - timestamp);
  if (diff < 60000) return t('playground.documents.justNow');
  if (diff < 3600000) return t('playground.documents.minutesAgo', { value: Math.floor(diff / 60000) });
  if (diff < 86400000) return t('playground.documents.hoursAgo', { value: Math.floor(diff / 3600000) });
  if (diff < 172800000) return t('playground.documents.yesterday');
  if (diff < 604800000) return t('playground.documents.daysAgo', { value: Math.floor(diff / 86400000) });
  if (diff < 2592000000) return t('playground.documents.weeksAgo', { value: Math.floor(diff / 604800000) });

  const date = new Date(timestamp);
  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

// Use the native Custom Highlight API when the browser exposes its registry.
const supportsCustomHighlight = 'highlights' in CSS;

const { lineNumbers, highlightedLines } = useMarkdownHighlighter(
  source,
  highlightTarget,
  supportsCustomHighlight,
);

// The outer container owns scrolling so line numbers and the mirrored text stay aligned.
const syncScroll = () => {};

const syncTextareaScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = target.scrollTop;
  }
};
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


const parser = createFuyeorMarkdownParser();
const ast = computed(() => parser(source.value));
const astJson = computed(() => JSON.stringify(ast.value, null, 2));
const renderedHtml = computed(() => renderMarkdown(ast.value));
const previewComponent = computed(() => ({
  render: () => h('div', renderToVue(ast.value)),
}));
</script>

<style>
/* Sidebar and Document History Styles */
.playground-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.document-history-foldable {
  margin: 8px;
}

.editor,
.preview {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
}

.preview {
  overflow: hidden;
  border-left: 1px solid var(--border-subtle, #e2e8f0);
}

.document-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.document-history-header p {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #2d3748);
}

.new-doc-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: 4px 8px;
  border: 1px solid var(--border-subtle, #e2e8f0);
  border-radius: 4px;
  color: #6b46c1;
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.new-doc-btn:hover:not(:disabled) {
  background: #faf5ff;
}

.new-doc-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.document-search-container {
  position: relative;
  padding: 8px 10px;
}

.document-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-subtle, #e2e8f0);
  border-radius: 6px;
  color: var(--text-primary, #2d3748);
  background: var(--surface-raised, #ffffff);
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}

.document-search-input:focus {
  border-color: #9f7aea;
}

.document-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.document-item {
  display: flex;
  width: 100%;
  align-items: flex-start;
  padding: 10px 12px;
  border: 0;
  border-radius: 8px;
  color: inherit;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
}

.document-item:hover {
  background-color: var(--bg-hover, #f7fafc);
}

.document-item.active {
  background-color: #f3ebff;
}

.document-icon {
  position: relative;
  flex: 0 0 13px;
  width: 13px;
  height: 16px;
  margin: 2px 12px 0 2px;
  border: 1.5px solid currentColor;
  border-radius: 2px;
  color: #8a94a6;
  opacity: 0.75;
}

.document-icon::before {
  position: absolute;
  top: -1.5px;
  right: -1.5px;
  width: 5px;
  height: 5px;
  border-bottom: 1.5px solid currentColor;
  border-left: 1.5px solid currentColor;
  background: var(--surface-raised, #ffffff);
  content: '';
}

.document-item.active .document-icon {
  color: #6b46c1;
  opacity: 1;
}

.document-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.document-title {
  font-size: 14px;
  color: var(--text-primary, #2d3748);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.document-item.active .document-title {
  color: #553c9a;
  font-weight: 500;
}

.document-time {
  font-size: 12px;
  color: var(--text-secondary, #a0aec0);
}

.no-documents {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary, #a0aec0);
  font-size: 13px;
}

/* Editor Styles */
.editor-toolbar,
.tab-container {
  height: 3rem;
  border-bottom: var(--border-subtle);
}

.editor-scroll-container {
  display: flex;
  flex: 1;
  overflow: auto;
  background: var(--bg-primary, #ffffff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
}

.editor-line-numbers {
  padding: 16px 12px;
  text-align: right;
  color: #a0aec0;
  user-select: none;
  border-right: 1px solid #edf2f7;
  background: #f8fafc;
}

.line-number {
  min-height: 1.6em;
}

.editor-content-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
}

.editor-highlight-layer,
.editor-textarea {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 16px;
  margin: 0;
  border: 0;
  box-sizing: border-box;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.editor-highlight-layer {
  pointer-events: none;
  z-index: 1;
  color: #1a202c;
}

.highlight-line {
  min-height: 1.6em;
}

.editor-textarea {
  color: transparent;
  background: transparent;
  caret-color: #2b6cb0;
  resize: none;
  outline: none;
  overflow: hidden;
  z-index: 2;
}

/* Make selection visible on the transparent textarea */
.editor-textarea::selection {
  background: rgba(43, 108, 176, 0.25);
  color: transparent;
}

/* Fallback Highlighting tokens */
.hl-punctuation { color: #a0aec0; }
.hl-heading { color: #553c9a; font-weight: 600; }
.hl-quote { color: #718096; font-style: italic; }
.hl-list { color: #2d3748; }
.hl-bold { font-weight: 700; color: #1a202c; }
.hl-italic { font-style: italic; color: #1a202c; }
.hl-code { color: #d53f8c; background: #faf5ff; border-radius: 3px; padding: 0 2px; }
.hl-strike { text-decoration: line-through; color: #a0aec0; }
.hl-code-fence { color: #805ad5; }
</style>
