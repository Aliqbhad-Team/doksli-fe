<script setup lang="ts">
import { ref, computed } from 'vue'
import TreeSelect from 'primevue/treeselect'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { usePermission } from '../composables/usePermission'
import { documents, categories, tags, fmtSize } from '../data/sampleData'

const { canTrashDoc, canUploadVersionDoc, canManageAccess, currentUser, isAdmin, isPengelola, filterVisibleFolders } = usePermission()

// Tree folder nodes
const folderNodes = computed(() => filterVisibleFolders.value.map(f => ({
  label: f.name,
  key: f.id,
  data: f,
  children: []
})))

const selectedFolder = ref<string | null>(null)
const q = ref('')

// Visible documents per folder + role
const visibleDocs = computed(() => {
  let docs = documents.filter(d => !d.deletedAt)
  if (selectedFolder.value) {
    docs = docs.filter(d => d.folderId === selectedFolder.value)
  }
  if (q.value) {
    const search = q.value.toLowerCase()
    docs = docs.filter(d => 
      d.name.toLowerCase().includes(search) ||
      d.category.toLowerCase().includes(search) ||
      d.owner.toLowerCase().includes(search) ||
      d.tags.some(t => t.toLowerCase().includes(search))
    )
  }
  return docs
})

const categoryColors: Record<string, { bg: string; fg: string }> = {
  Kontrak: { bg: 'var(--primary-soft)', fg: 'var(--primary)' },
  Keuangan: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  SDM: { bg: 'var(--warning-soft)', fg: 'var(--warning)' },
  Legal: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  Korespondensi: { bg: 'var(--purple-soft)', fg: 'var(--purple)' },
}

function getCatStyle(cat: string) {
  const c = categoryColors[cat] || { bg: 'var(--surface-2)', fg: 'var(--text-muted)' }
  return { background: c.bg, color: c.fg }
}

// Upload dialog
const uploadDialog = ref(false)
const uploadingDoc = ref<any>(null)
const uploadForm = ref({ version: '', note: '', file: null as File | null })

const openUpload = (doc: any) => {
  uploadingDoc.value = doc
  uploadForm.value = { version: '', note: '', file: null }
  uploadDialog.value = true
}

const submitUpload = () => {
  if (!uploadForm.value.version || !uploadForm.value.note || !uploadForm.value.file) {
    alert('Semua field wajib diisi')
    return
  }
  const doc = uploadingDoc.value
  doc.versions.unshift({
    v: doc.versions.length + 1,
    date: new Date().toISOString().split('T')[0],
    uploader: currentUser.value?.name || 'User',
    size: Math.round(uploadForm.value.file.size / 1024),
    note: uploadForm.value.note
  })
  doc.version = (doc.versions.length).toFixed(1)
  doc.size += uploadForm.value.file.size
  uploadDialog.value = false
}

// New document dialog
const newDocDialog = ref(false)
const newDocForm = ref({
  name: '',
  category: '',
  folderId: '',
  tags: [] as string[],
  file: null as File | null
})

const openNewDoc = () => {
  newDocForm.value = { name: '', category: '', folderId: selectedFolder.value || '', tags: [], file: null }
  newDocDialog.value = true
}

const submitNewDoc = () => {
  if (!newDocForm.value.name || !newDocForm.value.category || !newDocForm.value.folderId || !newDocForm.value.file) {
    alert('Semua field wajib diisi')
    return
  }
  const newDoc = {
    id: 'd' + Date.now(),
    name: newDocForm.value.name,
    folderId: newDocForm.value.folderId,
    category: newDocForm.value.category,
    owner: currentUser.value?.name || 'User',
    date: new Date().toISOString().split('T')[0],
    size: Math.round(newDocForm.value.file.size / 1024),
    tags: newDocForm.value.tags,
    versions: [{ v: 1, date: new Date().toISOString().split('T')[0], uploader: currentUser.value?.name || 'User', size: Math.round(newDocForm.value.file.size / 1024), note: 'Unggahan awal' }],
    deletedAt: null
  }
  documents.unshift(newDoc)
  newDocDialog.value = false
}

function handleFileChange(event: Event, form: { file: File | null }) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    form.file = target.files[0]
  }
}
</script>

<template>
  <div class="flex flex-col gap-5 h-full">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <TreeSelect
          v-model="selectedFolder"
          :options="folderNodes"
          placeholder="Semua folder"
          :filter="true"
          filterBy="label"
          :showClear="true"
          class="w-[280px]"
          aria-label="Pilih folder"
        />
        <InputText
          v-model="q"
          placeholder="Cari nama, kategori, pemilik, tag…"
          class="w-[300px]"
        />
      </div>
      <div class="toolbar-right">
        <Button
          v-if="isAdmin || isPengelola"
          label="Tambah Dokumen"
          icon="pi pi-plus"
          @click="openNewDoc"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="panel">
      <div class="panel-body p-0">
        <DataTable :value="visibleDocs" responsiveLayout="scroll" class="doc-table" :rowClassName="() => 'doc-table-row'">
          <template #empty>
            <div class="empty">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="10.5" cy="10.5" r="6.5"/><line x1="20" y1="20" x2="15.4" y2="15.4"/>
              </svg>
              <div>Tidak ada dokumen.</div>
            </div>
          </template>
          <Column field="name" header="Nama" style="min-width: 220px">
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
          <Column field="category" header="Kategori" style="width: 130px">
            <template #body="slotProps">
              <span class="pill" :style="getCatStyle(slotProps.data.category)">
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
          <Column header="Aksi" style="width: 130px">
            <template #body="slotProps">
              <div class="action-buttons">
                <Button icon="pi pi-download" severity="secondary" text size="small" title="Unduh" />
                <Button
                  v-if="canUploadVersionDoc(slotProps.data)"
                  icon="pi pi-arrow-up"
                  severity="secondary"
                  text
                  size="small"
                  @click="openUpload(slotProps.data)"
                  title="Unggah Versi"
                />
                <Button
                  v-if="canTrashDoc(slotProps.data)"
                  icon="pi pi-trash"
                  severity="secondary"
                  text
                  size="small"
                  @click="console.log('Trash:', slotProps.data.name)"
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

    <!-- Upload Version Dialog -->
    <Dialog v-model:visible="uploadDialog" header="Unggah Versi Baru" :style="{ width: '480px' }" :modal="true">
      <div v-if="uploadingDoc" class="flex flex-col gap-3">
        <div class="muted" style="font-size: 13px">{{ uploadingDoc.name }}</div>
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text)">Versi</label>
          <InputText v-model="uploadForm.version" placeholder="mis. 2.0" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text)">Catatan Perubahan</label>
          <Textarea v-model="uploadForm.note" rows="3" placeholder="Deskripsi perubahan..." />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text)">File</label>
          <input type="file" @change="e => handleFileChange(e, uploadForm)" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Batal" text @click="uploadDialog = false" />
        <Button label="Unggah" @click="submitUpload" />
      </template>
    </Dialog>

    <!-- New Document Dialog -->
    <Dialog v-model:visible="newDocDialog" header="Tambah Dokumen" :style="{ width: '520px' }" :modal="true">
      <div class="flex flex-col gap-3">
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text)">Nama Dokumen</label>
          <InputText v-model="newDocForm.name" placeholder="mis. Kontrak Baru 2026" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text)">Kategori</label>
          <Select v-model="newDocForm.category" :options="categories.map(c => ({ label: c.name, value: c.name }))" optionLabel="label" placeholder="Pilih kategori" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text)">Folder</label>
          <Select v-model="newDocForm.folderId" :options="folderNodes" optionLabel="label" optionValue="key" placeholder="Pilih folder" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text)">Tags</label>
          <Select v-model="newDocForm.tags" :options="tags.map(t => ({ label: t.name, value: t.name }))" optionLabel="label" multiple placeholder="Pilih tags" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text)">File</label>
          <input type="file" @change="e => handleFileChange(e, newDocForm)" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Batal" text @click="newDocDialog = false" />
        <Button label="Simpan" @click="submitNewDoc" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.toolbar-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.toolbar-right { display: flex; gap: 8px; }

.panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
.panel-body { padding: 16px; }
.panel-body.p-0 { padding: 0; }

.docname { display: inline-flex; align-items: center; gap: 8px; font-weight: 500; color: var(--text); }
.docname svg { flex-shrink: 0; color: var(--text-muted); }

.pill { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 999px; font-size: 11.5px; font-weight: 600; white-space: nowrap; }
.dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

.action-buttons { display: flex; gap: 4px; justify-content: flex-end; }
.num { font-variant-numeric: tabular-nums; color: var(--text); font-size: 12.5px; }
.muted { color: var(--text-muted); }

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
:deep(.doc-table .p-datatable-tbody > tr) { cursor: pointer; transition: background-color 0.2s ease; }
:deep(.doc-table .p-datatable-tbody > tr:hover) { background-color: var(--surface-2) !important; }
:deep(.doc-table .p-datatable-tbody > tr:hover td) { background-color: transparent !important; }

.empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px; color: var(--text-muted); text-align: center; }
.empty svg { opacity: 0.4; }
</style>