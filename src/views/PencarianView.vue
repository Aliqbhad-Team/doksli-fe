<script setup lang="ts">
import { ref } from 'vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { folders } from '../data/sampleData'

const q = ref('')
const category = ref<string | null>(null)
const folder = ref<string | null>(null)
const includeTrash = ref(false)
const docs: Record<string, string>[] = []

const categories = ['Kontrak', 'Keuangan', 'SDM', 'Legal', 'Korespondensi']
const folderOptions = folders.map(f => ({ label: f.name, value: f.id }))
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="panel">
      <div class="panel-body flex flex-col gap-3">
        <InputText v-model="q" placeholder="Cari nama dokumen..." class="w-full" />
        <div class="filters">
          <Select
            v-model="category"
            :options="categories"
            placeholder="Semua kategori"
            showClear
          />
          <Select
            v-model="folder"
            :options="folderOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Semua folder"
            showClear
          />
          <div class="flex items-center gap-2">
            <Checkbox v-model="includeTrash" binary inputId="incTrash" />
            <label for="incTrash" class="cursor-pointer" style="font-size: 13px">Sertakan tempat sampah</label>
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>0 hasil ditemukan</h2>
      </div>
      <div class="table-scroll">
        <DataTable :value="docs" responsiveLayout="scroll" class="doc-table">
          <template #empty>
            <div class="empty">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="10.5" cy="10.5" r="6.5"/><line x1="20" y1="20" x2="15.4" y2="15.4"/>
              </svg>
              <div>Belum ada data.</div>
            </div>
          </template>
          <Column field="name" header="Nama">
            <template #body="slotProps">
              <div class="docname">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/></svg>
                {{ slotProps.data.name }}
              </div>
            </template>
          </Column>
          <Column field="category" header="Kategori">
            <template #body="slotProps">
              <span :class="'pill cat-' + slotProps.data.category"><span class="dot"></span>{{ slotProps.data.category }}</span>
            </template>
          </Column>
          <Column field="owner" header="Pemilik">
            <template #body="slotProps">
              <span class="muted">{{ slotProps.data.owner }}</span>
            </template>
          </Column>
          <Column field="date" header="Tanggal">
            <template #body="slotProps">
              <span class="num">{{ slotProps.data.date }}</span>
            </template>
          </Column>
          <Column field="size" header="Ukuran">
            <template #body="slotProps">
              <span class="num">{{ slotProps.data.size }}</span>
            </template>
          </Column>
          <Column field="version" header="Versi">
            <template #body="slotProps">
              <span class="num">v{{ slotProps.data.version }}</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.doc-table .p-datatable-thead > tr > th) {
  background: var(--surface) !important;
  color: var(--text-muted) !important;
  font-size: 11px !important;
  text-transform: uppercase !important;
  letter-spacing: .04em !important;
  font-weight: 600 !important;
  padding: 8px 10px !important;
  border-bottom: 1px solid var(--border) !important;
  white-space: nowrap !important;
}
:deep(.doc-table .p-datatable-tbody > tr > td) {
  padding: 10px !important;
  border-bottom: 1px solid var(--border) !important;
  font-size: 13px !important;
  vertical-align: middle !important;
  background: var(--surface) !important;
}
:deep(.doc-table .p-datatable-tbody > tr:last-child > td) { border-bottom: none !important; }
:deep(.doc-table .p-datatable-emptymessage > td) { padding: 0 !important; border: none !important; }
</style>
