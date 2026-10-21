<script setup lang="ts">
import { ref, computed } from 'vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import { usePermission } from '../composables/usePermission'
import { folders, documents, categories, fmtSize } from '../data/sampleData'

const { canTrashDoc, canUploadVersionDoc, canManageAccess, isAdmin, filterVisibleFolders } = usePermission()

const q = ref('')
const category = ref<string | null>(null)
const folder = ref<string | null>(null)
const includeTrash = ref(false)
const showDocumentDrawer = ref(false)
const selectedDocument = ref<any>(null)

const openDocumentDrawer = (doc: any) => {
  selectedDocument.value = doc
  showDocumentDrawer.value = true
}

const categoryColors: Record<string, { bg: string; fg: string }> = {
  Kontrak: { bg: 'var(--primary-soft)', fg: 'var(--primary)' },
  Keuangan: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  SDM: { bg: 'var(--warning-soft)', fg: 'var(--warning)' },
  Legal: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  Korespondensi: { bg: 'var(--purple-soft)', fg: 'var(--purple)' },
}

const levelColors: Record<string, { bg: string; fg: string }> = {
  Admin: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  Pengelola: { bg: 'var(--primary-soft)', fg: 'var(--primary)' },
  Pembaca: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  Pengguna: { bg: 'var(--warning-soft)', fg: 'var(--warning)' },
}

function getCategoryClass(cat: string) {
  const c = categoryColors[cat] || { bg: 'var(--surface-2)', fg: 'var(--text-muted)' }
  return { background: c.bg, color: c.fg }
}

function getLevelClass(level: string) {
  const c = levelColors[level] || { bg: 'var(--surface-2)', fg: 'var(--text-muted)' }
  return { background: c.bg, color: c.fg }
}

// Computed: visible dokumen per role + filters
const visibleDocs = computed(() => {
  let docs = documents.filter(d => {
    if (!includeTrash.value && d.deletedAt) return false
    return true
  })

  if (q.value) {
    const search = q.value.toLowerCase()
    docs = docs.filter(d => 
      d.name.toLowerCase().includes(search) ||
      d.category.toLowerCase().includes(search) ||
      d.owner.toLowerCase().includes(search) ||
      d.tags.some(t => t.toLowerCase().includes(search))
    )
  }

  if (category.value) {
    docs = docs.filter(d => d.category === category.value)
  }

  if (folder.value) {
    docs = docs.filter(d => d.folderId === folder.value)
  }

  // Role-based filter
  if (!isAdmin.value) {
    const userFolders = filterVisibleFolders.value.map(f => f.id)
    docs = docs.filter(d => userFolders.includes(d.folderId))
  }

  return docs
})

const folderOptions = computed(() => filterVisibleFolders.value.map(f => ({ label: f.name, value: f.id })))

function handleDownload(doc: any) {
  console.log('Download:', doc.name)
}

function handleTrash(doc: any) {
  console.log('Trash:', doc.name)
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Search Panel -->
    <div class="panel">
      <div class="panel-body flex flex-col gap-3">
        <InputText
          v-model="q"
          placeholder="Cari nama dokumen, tag, atau pemilik…"
          class="w-full"
        />
        <div class="filters">
          <Select
            v-model="category"
            :options="categories.map(c => ({ label: c.name, value: c.name }))"
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

    <!-- Results Panel -->
    <div class="panel">
      <div class="panel-head">
        <h2>{{ visibleDocs.length }} hasil ditemukan</h2>
      </div>
      <div class="table-scroll">
        <DataTable :value="visibleDocs" responsiveLayout="scroll" class="doc-table" :rowClassName="() => 'doc-table-row'" @rowClick="(e: any) => openDocumentDrawer(e.data)">
          <template #empty>
            <div class="empty">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="10.5" cy="10.5" r="6.5"/><line x1="20" y1="20" x2="15.4" y2="15.4"/>
              </svg>
              <div>Tidak ada dokumen yang cocok.</div>
            </div>
          </template>
          <Column field="name" header="Nama">
            <template #body="slotProps">
              <div class="docname">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>
                  <path d="M14 3v4h4"/>
                </svg>
                {{ slotProps.data.name }}
              </div>
            </template>
          </Column>
          <Column field="category" header="Kategori" style="width: 120px">
            <template #body="slotProps">
              <span class="pill" :style="getCategoryClass(slotProps.data.category)">
                <span class="dot" :style="{ background: categoryColors[slotProps.data.category]?.fg || 'var(--text-muted)' }"></span>
                {{ slotProps.data.category }}
              </span>
            </template>
          </Column>
          <Column field="owner" header="Pemilik" style="width: 140px">
            <template #body="slotProps">
              <span class="muted">{{ slotProps.data.owner }}</span>
            </template>
          </Column>
          <Column field="date" header="Tanggal" style="width: 110px">
            <template #body="slotProps">
              <span class="num">{{ slotProps.data.date }}</span>
            </template>
          </Column>
          <Column field="size" header="Ukuran" style="width: 90px">
            <template #body="slotProps">
              <span class="num">{{ fmtSize(slotProps.data.size) }}</span>
            </template>
          </Column>
          <Column field="versions" header="Versi" style="width: 80px">
            <template #body="slotProps">
              <span class="num">v{{ slotProps.data.versions.length }}</span>
            </template>
          </Column>
          <Column field="level" header="Level Anda" style="width: 100px">
            <template #body="slotProps">
              <span class="pill" :style="getLevelClass(slotProps.data.access_level)">
                <span class="dot" :style="{ background: levelColors[slotProps.data.access_level]?.fg || 'var(--text-muted)' }"></span>
                {{ slotProps.data.access_level }}
              </span>
            </template>
          </Column>
          <Column header="Aksi" style="width: 130px">
            <template #body="slotProps">
              <div class="action-buttons">
                <Button
                  icon="pi pi-download"
                  severity="secondary"
                  text
                  size="small"
                  @click="handleDownload(slotProps.data)"
                  title="Unduh"
                />
                <Button
                  v-if="canUploadVersionDoc(slotProps.data)"
                  icon="pi pi-arrow-up"
                  severity="secondary"
                  text
                  size="small"
                  @click="console.log('Upload:', slotProps.data.name)"
                  title="Unggah Versi"
                />
                <Button
                  v-if="canTrashDoc(slotProps.data)"
                  icon="pi pi-trash"
                  severity="secondary"
                  text
                  size="small"
                  @click="handleTrash(slotProps.data)"
                  title="Pindahkan ke sampah"
                />
                <Button
                  v-if="canManageAccess(slotProps.data)"
                  icon="pi pi-lock"
                  severity="secondary"
                  text
                  size="small"
                  title="Kelola Akses"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Document Detail Drawer -->
    <Drawer v-model:visible="showDocumentDrawer" header="Detail Dokumen" position="right" :modal="true" style="width: 420px">
      <div v-if="selectedDocument" style="display: flex; flex-direction: column; gap: 24px">
        <!-- HEADER -->
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%">
          <div>
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: var(--text)">{{ selectedDocument.name }}</h3>
            <span class="pill" :style="getCategoryClass(selectedDocument.category)">
              <span class="dot" :style="{ background: categoryColors[selectedDocument.category]?.fg || 'var(--text-muted)' }"></span>
              {{ selectedDocument.category }}
            </span>
          </div>
        </div>

        <!-- METADATA -->
        <div>
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; margin-bottom: 12px">Metadata</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div>
              <div style="color: var(--text-muted); font-size: 11px; font-weight: 600; margin-bottom: 4px">FOLDER</div>
              <div style="color: var(--text); font-size: 13px">{{ folders.find(f => f.id === selectedDocument.folderId)?.name || '—' }}</div>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 11px; font-weight: 600; margin-bottom: 4px">PEMILIK</div>
              <div style="color: var(--text); font-size: 13px">{{ selectedDocument.owner }}</div>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 11px; font-weight: 600; margin-bottom: 4px">TANGGAL DIBUAT</div>
              <div style="color: var(--text); font-size: 13px">{{ selectedDocument.date }}</div>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 11px; font-weight: 600; margin-bottom: 4px">UKURAN SAAT INI</div>
              <div style="color: var(--text); font-size: 13px">{{ fmtSize(selectedDocument.size) }}</div>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 11px; font-weight: 600; margin-bottom: 4px">ID DOKUMEN</div>
              <div style="color: var(--text); font-size: 13px">{{ selectedDocument.id }}</div>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 11px; font-weight: 600; margin-bottom: 4px">STATUS</div>
              <span style="display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 11.5px; font-weight: 600; background: rgba(16, 185, 129, 0.1); color: #10b981">{{ selectedDocument.deletedAt ? 'Di Sampah' : 'Aktif' }}</span>
            </div>
          </div>
        </div>

        <!-- TAGS -->
        <div v-if="selectedDocument.tags && selectedDocument.tags.length">
          <div style="display: flex; gap: 6px; flex-wrap: wrap">
            <span v-for="(tag, idx) in selectedDocument.tags" :key="idx" style="display: inline-block; padding: 4px 10px; background: var(--surface-2); border-radius: 12px; font-size: 12px; color: var(--text); font-weight: 500">{{ tag }}</span>
          </div>
        </div>

        <!-- AKSES -->
        <div>
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; margin-bottom: 12px">Akses Anda ke Dokumen Ini</div>
          <span class="pill" :style="getLevelClass(selectedDocument.access_level)">
            <span class="dot" :style="{ background: levelColors[selectedDocument.access_level]?.fg || 'var(--text-muted)' }"></span>
            {{ selectedDocument.access_level }}
          </span>
        </div>

        <!-- RIWAYAT VERSI -->
        <div v-if="selectedDocument.versions && selectedDocument.versions.length">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; margin-bottom: 12px">Riwayat Versi</div>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <div v-for="(v, idx) in selectedDocument.versions" :key="idx" style="padding: 12px; background: var(--surface-2); border-radius: 6px">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: var(--primary); color: white; font-size: 11px; font-weight: 700">{{ v.versi }}</span>
                <span style="color: var(--text); font-size: 13px; font-weight: 500">{{ v.note }}</span>
              </div>
              <div style="color: var(--text-muted); font-size: 11px">{{ v.tanggal }} • {{ v.uploader }} • {{ fmtSize(v.size) }}</div>
            </div>
          </div>
        </div>

        <!-- AKTIVITAS -->
        <div v-if="selectedDocument.activities && selectedDocument.activities.length">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; margin-bottom: 12px">Aktivitas Dokumen Ini</div>
          <div style="display: flex; flex-direction: column; gap: 12px">
            <div v-for="(activity, idx) in selectedDocument.activities" :key="idx" style="font-size: 12px">
              <div style="color: var(--text-muted); margin-bottom: 4px">{{ activity.time }}</div>
              <div style="color: var(--text)"><strong>{{ activity.actor }}</strong> — {{ activity.action }}</div>
            </div>
          </div>
        </div>

        <!-- ACTION BUTTONS -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">
          <Button icon="pi pi-download" label="Unduh" severity="primary" style="width: 100%" />
          <Button icon="pi pi-arrow-up" label="Unggah Versi" severity="secondary" style="width: 100%" />
          <Button icon="pi pi-trash" label="Ke Sampah" severity="danger" style="width: 100%" />
          <Button icon="pi pi-lock" label="Kelola Akses" severity="secondary" style="width: 100%" />
        </div>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
}

.pill .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.action-buttons {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.badge-level {
  display: inline-block;
  padding: 4px 8px;
  background: var(--surface-2);
  color: var(--text);
  font-size: 12px;
  border-radius: 4px;
}

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

:deep(.doc-table .p-datatable-tbody > tr) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

:deep(.doc-table .p-datatable-tbody > tr:hover) {
  background-color: var(--surface-2) !important;
}

:deep(.doc-table .p-datatable-tbody > tr:hover td) {
  background-color: transparent !important;
}

.pill.pill-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.pill.pill-danger .dot {
  background: #ef4444;
}

.muted { color: var(--text-muted); }
.num { font-variant-numeric: tabular-nums; color: var(--text); font-size: 12.5px; }
.docname { display: inline-flex; align-items: center; gap: 8px; font-weight: 500; color: var(--text); }
.docname svg { flex-shrink: 0; color: var(--text-muted); }

.filters { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.filters :deep(.p-select) { min-width: 160px; }
.filters :deep(.p-checkbox) { margin-top: 2px; }

.empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px; color: var(--text-muted); text-align: center; }
.empty svg { opacity: 0.4; }
</style>