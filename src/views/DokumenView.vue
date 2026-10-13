<script setup lang="ts">
import { ref } from 'vue'
import DataTable from 'primevue/datatable'
import Button from 'primevue/button'

const activeTab = ref<'aktif' | 'trash'>('aktif')
const docs: Record<string, string>[] = []
const trashDocs: Record<string, string>[] = []
</script>

<template>
  <div class="panel">
    <div class="panel-head">
      <div class="crumbs">
        <button class="current">Semua Folder</button>
      </div>
      <Button
        label="Unggah Dokumen"
        icon="pi pi-plus"
        rounded
        size="small"
        class="upload-btn"
      />
    </div>

    <div class="tabs" style="padding: 0 16px">
      <button class="tab" :class="{ active: activeTab === 'aktif' }" @click="activeTab = 'aktif'">Aktif</button>
      <button class="tab" :class="{ active: activeTab === 'trash' }" @click="activeTab = 'trash'">Tempat Sampah</button>
    </div>

    <div class="table-scroll">
      <DataTable :value="activeTab === 'aktif' ? docs : trashDocs" responsiveLayout="scroll" class="doc-table">
        <template #empty>
          <div class="empty">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <div>{{ activeTab === 'aktif' ? 'Belum ada dokumen.' : 'Tempat sampah kosong.' }}</div>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
:deep(.upload-btn) {
  background: var(--accent) !important;
  border-color: var(--accent) !important;
  color: var(--accent-contrast) !important;
  border-radius: 999px !important;
  font-weight: 600 !important;
  padding: 6px 14px !important;
  font-size: 13px !important;
  border: none !important;
}
:deep(.upload-btn:hover) { filter: brightness(1.08); }
:deep(.upload-btn .pi) { font-size: 12px; }

/* Buat ngosongin header tabel kalo gada isi kolom, */
:deep(.doc-table .p-datatable-thead) { display: none !important; }
:deep(.doc-table .p-datatable-emptymessage > td) { padding: 0 !important; border: none !important; }
</style>
