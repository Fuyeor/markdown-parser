<!-- @/option/document.vue -->
<template>
  <header-bar :title="t('option.document')" />

  <div class="option-layout">
    <form-section :title="t('option.document')">
      <form-field :description="t('option.document.export.desc')">
        <button type="button" class="option-btn" @click="handleExport">
          {{ t('option.document.export') }}
        </button>
      </form-field>
      <form-field :description="t('option.document.import.desc')">
        <button type="button" class="option-btn" @click="openFilePicker">
          {{ t('option.document.import') }}
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".json.gz,application/gzip"
          hidden
          @change="handleFileChange"
        />
      </form-field>
    </form-section>
  </div>

  <Modal v-model="isConflictModalOpen" size="small">
    <template #header>
      <h3>{{ t('option.document.conflict') }}</h3>
    </template>
    {{ t('option.document.conflict.desc', { count: conflictDocument.length }) }}
    <template #footer>
      <div class="confirm-dialog-actions">
        <button
          type="button"
          class="action-btn secondary"
          @click="handleResolveConflict(false)"
        >
          {{ t('option.document.conflict.skipAll') }}
        </button>
        <button
          type="button"
          class="action-btn danger"
          @click="handleResolveConflict(true)"
        >
          {{ t('option.document.conflict.overwriteAll') }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { t } from '@fuyeor/vue-locale';
import {
  HeaderBar,
  FormField,
  FormSection,
  Modal,
  toast,
} from '@fuyeor/interactify';
import {
  useIndexedDb,
  type HistoryDocument,
} from '@/document/composable/useIndexedDb';
import {
  ArchiveError,
  buildArchive,
  compressArchive,
  mergeArchive,
  parseArchive,
} from '@/option/util/archive';

const { documents, trashed, importDocuments } = useIndexedDb();

const fileInputRef = ref<HTMLInputElement | null>(null);
const isConflictModalOpen = ref(false);
const conflictDocument = ref<HistoryDocument[]>([]);
const pendingCreate = ref<HistoryDocument[]>([]);
const pendingConflict = ref<HistoryDocument[]>([]);

// Trigger the hidden file input.
const openFilePicker = () => {
  fileInputRef.value?.click();
};

// Build a Basic ISO timestamp for the download filename.
const formatStamp = (): string =>
  new Date()
    .toISOString()
    .slice(0, 19)
    .replaceAll('-', '')
    .replaceAll(':', '') + 'Z';

// Export every document (active + trashed) as a gzipped JSON archive.
const handleExport = async () => {
  // only active document
  const archive = buildArchive(documents.value);
  const blob = await compressArchive(archive);
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `playground-${formatStamp()}.json.gz`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

// Write the merged result and surface the summary toast.
const applyImport = async (
  toCreate: HistoryDocument[],
  toUpdate: HistoryDocument[],
  skipped: number,
) => {
  // 无任何变化时不写库，只提示一致
  if (toCreate.length === 0 && toUpdate.length === 0 && skipped === 0) {
    toast.show(t('option.document.import.unchanged'), { type: 'info' });
    return;
  }

  try {
    await importDocuments([...toCreate, ...toUpdate]);
  } catch (error) {
    console.error('Import failed:', error);
    toast.show(t('option.document.import.invalid'), { type: 'error' });
    return;
  }
  toast.show(
    t('option.document.import.done', {
      created: toCreate.length,
      updated: toUpdate.length,
      skipped,
    }),
    { type: 'success' },
  );
};

// Parse, merge, and either apply directly or ask for conflict resolution.
const handleImport = async (file: Blob) => {
  let incoming: HistoryDocument[];
  try {
    incoming = await parseArchive(file);
  } catch (error) {
    const code = error instanceof ArchiveError ? error.code : 'invalid';
    console.error('Import failed:', error);
    toast.show(t(`option.document.import.${code}`), { type: 'error' });
    return;
  }

  // 用"活跃 + 回收站"全集做冲突检测，以正确处理"本地已删除、备份有活跃文档"
  const { toCreate, conflict } = mergeArchive(
    [...documents.value, ...trashed.value],
    incoming,
  );

  if (conflict.length > 0) {
    pendingCreate.value = toCreate;
    pendingConflict.value = conflict;
    conflictDocument.value = conflict;
    isConflictModalOpen.value = true;
    return;
  }

  await applyImport(toCreate, [], 0);
};

// Resolve conflicts in bulk: skip keeps local, overwrite replaces it.
const handleResolveConflict = async (overwrite: boolean) => {
  isConflictModalOpen.value = false;
  const toCreate = pendingCreate.value;
  const conflict = pendingConflict.value;
  pendingCreate.value = [];
  pendingConflict.value = [];
  conflictDocument.value = [];

  if (overwrite) await applyImport(toCreate, conflict, 0);
  else await applyImport(toCreate, [], conflict.length);
};

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  await handleImport(file);
};
</script>
