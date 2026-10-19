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
import { folders as allFolders } from '../data/sampleData'

const { canTrashDoc, canUploadVersionDoc, currentUser, isAdmin } = usePermission()

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

const getCategoryClass = (cat: string) => {
  const map: Record<string, string> = {
    'Kontrak': 'Kontrak',
    'Keuangan': 'Keuangan',
    'SDM': 'SDM',
    'Legal': 'Legal',
    'Korespondensi': 'Korespondensi'
  }
  return map[cat] || cat.replace(/\s+/g, '')
}

const getLevelClass = (level: string) => {
  const map: Record<string, string> = {
    'Admin': 'Admin',
    'Pengelola': 'Pengelola',
    'Pembaca': 'Pembaca',
    'Pengguna': 'Pengguna'
  }
  return map[level] || level.replace(/\s+/g, '')
}

const docs: Record<string, any>[] = [
  {
    name: 'Kontrak Pemeliharaan HVAC 2026',
    category: 'Kontrak',
    owner: 'Ahmad Ridho',
    date: '2026-10-19',
    size: '2.4 MB',
    version: '1.2',
    level: 'Pengelola',
    id: 'D1',
    folder: 'Legal',
    unit: 'Legal',
    tags: ['hvac', 'maintenance'],
    access_level: 'Kelola',
    created_by: 'Taufik Nugraha',
    status: 'Aktif',
    versions: [
      { versi: 'v1.2', desc: 'Perbaruan kontrak', tanggal: '19 Oct 2026', author: 'Ahmad Ridho', size: '2.4 MB' },
      { versi: 'v1.1', desc: 'Revisi pasal 3', tanggal: '18 Oct 2026', author: 'Taufik Nugraha', size: '2.3 MB' },
      { versi: 'v1.0', desc: 'Unggahan awal', tanggal: '15 Oct 2026', author: 'Taufik Nugraha', size: '2.2 MB' }
    ],
    activities: [
      { time: '19 Oct 2026, 10:45', actor: 'Ahmad Ridho', action: 'Unggah dokumen' },
      { time: '18 Oct 2026, 14:15', actor: 'Taufik Nugraha', action: 'Perbarui dokumen' },
      { time: '15 Oct 2026, 09:30', actor: 'Taufik Nugraha', action: 'Buat dokumen' }
    ]
  },
  {
    name: 'Laporan Audit Triwulan III',
    category: 'Keuangan',
    owner: 'Dewi Kusuma',
    date: '2026-10-05',
    size: '1.8 MB',
    version: '2.0',
    level: 'Pembaca',
    id: 'D2',
    folder: 'Finansial',
    unit: 'Keuangan',
    tags: ['audit', 'quarterly'],
    access_level: 'Lihat',
    created_by: 'Anas',
    status: 'Aktif',
    versions: [
      { versi: 'v2.0', desc: 'Final report', tanggal: '05 Oct 2026', author: 'Anas', size: '1.8 MB' },
      { versi: 'v1.0', desc: 'Unggahan awal', tanggal: '01 Oct 2026', author: 'Anas', size: '1.6 MB' }
    ],
    activities: [
      { time: '05 Oct 2026, 16:20', actor: 'Anas', action: 'Finalisasi dokumen' },
      { time: '01 Oct 2026, 08:00', actor: 'Anas', action: 'Buat dokumen' }
    ]
  }
]

// Computed: visible dokumen per role
const visibleDocs = computed(() => {
  // Admin: lihat semua
  if (isAdmin.value) return docs
  
  // Pengelola + Pengguna: filter by unit
  return docs.filter(d => d.unit === currentUser.value?.unit)
})

function handleDownload(doc: Record<string, any>) {
  console.log('Download:', doc.name)
}

function handleTrash(doc: Record<string, any>) {
  console.log('Trash:', doc.name)
}

const categories = ['Kontrak', 'Keuangan', 'SDM', 'Legal', 'Korespondensi']
const folderOptions = [
  { label: 'Divisi Hukum', value: 'f1' },
  { label: 'Operasional Gedung', value: 'f2' }
]
</script>

<template>
  <div class="flex flex-col gap-3">
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
          <Column field="category" header="Kategori">
            <template #body="slotProps">
              <span :class="'pill cat-' + getCategoryClass(slotProps.data.category)"><span class="dot"></span>{{ slotProps.data.category }}</span>
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
          <Column field="version" header="Versi" style="width: 80px">
            <template #body="slotProps">
              <span class="num">v{{ slotProps.data.version }}</span>
            </template>
          </Column>
          <Column field="level" header="Level Anda" style="width: 100px">
            <template #body="slotProps">
              <span :class="'pill level-' + getLevelClass(slotProps.data.level)"><span class="dot"></span>{{ slotProps.data.level }}</span>
            </template>
          </Column>
          <Column header="Aksi" style="width: 100px">
            <template #body="slotProps">
              <div class="action-buttons" style="display: flex; gap: 4px">
                <!-- Download (everyone) -->
                <Button
                  icon="pi pi-download"
                  severity="secondary"
                  text
                  size="small"
                  @click="handleDownload(slotProps.data)"
                  title="Unduh"
                />
                <!-- Upload Versi (edit+) -->
                <Button
                  v-if="canUploadVersionDoc(slotProps.data, allFolders.find(f => f.name === slotProps.data.folder)!)"
                  icon="pi pi-arrow-up"
                  severity="secondary"
                  text
                  size="small"
                  @click="console.log('Upload:', slotProps.data.name)"
                  title="Unggah Versi"
                />
                <!-- Trash (manage) -->
                <Button
                  v-if="canTrashDoc(slotProps.data, allFolders.find(f => f.name === slotProps.data.folder)!)"
                  icon="pi pi-trash"
                  severity="secondary"
                  text
                  size="small"
                  @click="handleTrash(slotProps.data)"
                  title="Pindahkan ke sampah"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <Drawer v-model:visible="showDocumentDrawer" header="Detail Dokumen" position="right" :modal="true" style="width: 420px">
      <div v-if="selectedDocument" style="display: flex; flex-direction: column; gap: 24px">
        <!-- HEADER -->
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%">
          <div>
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: var(--text)">{{ selectedDocument.name }}</h3>
            <span :class="'pill cat-' + getCategoryClass(selectedDocument.category)"><span class="dot"></span>{{ selectedDocument.category }}</span>
          </div>
        </div>

        <!-- METADATA -->
        <div>
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; margin-bottom: 12px">Metadata</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div>
              <div style="color: var(--text-muted); font-size: 11px; font-weight: 600; margin-bottom: 4px">FOLDER</div>
              <div style="color: var(--text); font-size: 13px">{{ selectedDocument.folder }}</div>
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
              <div style="color: var(--text); font-size: 13px">{{ selectedDocument.size }}</div>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 11px; font-weight: 600; margin-bottom: 4px">ID DOKUMEN</div>
              <div style="color: var(--text); font-size: 13px">{{ selectedDocument.id }}</div>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 11px; font-weight: 600; margin-bottom: 4px">STATUS</div>
              <span style="display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 11.5px; font-weight: 600; background: rgba(16, 185, 129, 0.1); color: #10b981">{{ selectedDocument.status }}</span>
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
          <span class="pill pill-danger"><span class="dot"></span>{{ selectedDocument.access_level }}</span>
        </div>

        <!-- RIWAYAT VERSI -->
        <div v-if="selectedDocument.versions && selectedDocument.versions.length">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; margin-bottom: 12px">Riwayat Versi</div>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <div v-for="(v, idx) in selectedDocument.versions" :key="idx" style="padding: 12px; background: var(--surface-2); border-radius: 6px">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: var(--accent); color: white; font-size: 11px; font-weight: 700">{{ v.versi }}</span>
                <span style="color: var(--text); font-size: 13px; font-weight: 500">{{ v.desc }}</span>
              </div>
              <div style="color: var(--text-muted); font-size: 11px">{{ v.tanggal }} • {{ v.author }} • {{ v.size }}</div>
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

.pill.cat-Kontrak {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.pill.cat-Kontrak .dot {
  background: #3b82f6;
}

.pill.cat-LaporanKeuangan {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.pill.cat-LaporanKeuangan .dot {
  background: #10b981;
}

.pill.cat-SDM {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.pill.cat-SDM .dot {
  background: #f59e0b;
}

.pill.cat-Legal {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.pill.cat-Legal .dot {
  background: #ef4444;
}

.pill.cat-Korespondensi {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.pill.cat-Korespondensi .dot {
  background: #8b5cf6;
}

.pill.level-Admin {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.pill.level-Admin .dot {
  background: #dc2626;
}

.pill.level-Pengelola {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.pill.level-Pengelola .dot {
  background: #2563eb;
}

.pill.level-Pembaca {
  background: rgba(22, 163, 74, 0.1);
  color: #16a34a;
}

.pill.level-Pembaca .dot {
  background: #16a34a;
}

.pill.level-Pengguna {
  background: rgba(5, 150, 105, 0.1);
  color: #059669;
}

.pill.level-Pengguna .dot {
  background: #059669;
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
</style>