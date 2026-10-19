<script setup lang="ts">
import { ref, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Drawer from 'primevue/drawer'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import { usePermission } from '../composables/usePermission'
import { folders as allFolders } from '../data/sampleData'

const { canTrashDoc, canUploadVersionDoc, currentUser, isAdmin, isPengelola } = usePermission()

const activeTab = ref<'aktif' | 'trash'>('aktif')
const currentFolder = ref<string | null>(null)
const selectedDocument = ref<Record<string, string | number> | null>(null)
const showDocumentDrawer = ref(false)

const folderData: Record<string, string | number>[] = [
  {
    name: 'Kontrak',
    kategori: 'Kontrak',
    deskripsi: 'Kontrak',
    pemilik: 'Legal',
    tanggal: '2026-10-15',
    ukuran: '8.5 MB',
    docs: 3,
    status: 'aktif',
    unit: 'Kontrak'
  },
  {
    name: 'Keuangan',
    kategori: 'Keuangan',
    deskripsi: 'Keuangan',
    pemilik: 'Finansial',
    tanggal: '2026-10-19',
    ukuran: '5.1 MB',
    docs: 3,
    status: 'aktif',
    unit: 'Keuangan'
  },
  {
    name: 'SDM',
    kategori: 'SDM',
    deskripsi: 'SDM',
    pemilik: 'SDM',
    tanggal: '2026-10-10',
    ukuran: '3.2 MB',
    docs: 3,
    status: 'aktif',
    unit: 'SDM'
  },
  {
    name: 'Legal',
    kategori: 'Legal',
    deskripsi: 'Legal',
    pemilik: 'Legal',
    tanggal: '2026-09-25',
    ukuran: '4.8 MB',
    docs: 2,
    status: 'aktif',
    unit: 'Legal'
  },
  {
    name: 'Korespondensi',
    kategori: 'Korespondensi',
    deskripsi: 'Korespondensi',
    pemilik: 'Administrasi',
    tanggal: '2026-10-05',
    ukuran: '2.9 MB',
    docs: 2,
    status: 'aktif',
    unit: 'Korespondensi'
  }
]

// Computed: visible folders per role
const visibleFolders = computed(() => {
  return folderData.filter(folder => {
    const matchedAllFolder = allFolders.find(f => f.name === folder.name)
    if (!matchedAllFolder) return false
    
    // Admin: lihat semua
    if (isAdmin.value) return true
    
    // Pengelola + Pengguna: lihat folder unit sendiri saja
    if (currentUser.value?.unit === folder.unit) return true
    
    return false
  })
})

const dokumentData: Record<string, string | number | string[]>[] = [
  // Kontrak
  {
    name: 'Kontrak Sewa Gedung Cikarang 2026',
    kategori: 'Kontrak',
    pemilik: 'Taufik Nugraha',
    tanggal: '15 Jan 2026',
    ukuran: '2.4 MB',
    id: 'D1',
    tags: ['sewa', 'gedung'],
    status: 'aktif',
    versi: 'v1',
    access_level: 'Kelola',
    unit: 'Kontrak'
  },
  // Keuangan
  {
    name: 'Laporan Keuangan Kuartal III 2026',
    kategori: 'Keuangan',
    pemilik: 'Anas',
    tanggal: '10 Oct 2026',
    ukuran: '3.8 MB',
    id: 'D2',
    tags: ['laporan', 'quarterly'],
    status: 'aktif',
    versi: 'v3',
    access_level: 'Kelola',
    unit: 'Keuangan'
  },
  {
    name: 'Invoice Vendor Fumigasi Maret 2026',
    kategori: 'Keuangan',
    pemilik: 'Anas',
    tanggal: '03 Mar 2026',
    ukuran: '412 KB',
    id: 'D3',
    tags: ['invoice', 'vendor'],
    status: 'aktif',
    versi: 'v1',
    access_level: 'Lihat',
    unit: 'Keuangan'
  },
  {
    name: 'Rekonsilasi Bank Februari 2026',
    kategori: 'Keuangan',
    pemilik: 'Anas',
    tanggal: '01 Mar 2026',
    ukuran: '890 KB',
    id: 'D4',
    tags: ['bank', 'rekonsilasi'],
    status: 'aktif',
    versi: 'v1',
    access_level: 'Edit',
    unit: 'Keuangan'
  },
  // SDM
  {
    name: 'SK Pengangkatan Karyawan 2026',
    kategori: 'SDM',
    pemilik: 'Dewi Kusuma',
    tanggal: '15 Sep 2026',
    ukuran: '1.2 MB',
    id: 'D5',
    tags: ['sk', 'karyawan'],
    status: 'aktif',
    versi: 'v1',
    access_level: 'Kelola',
    unit: 'SDM'
  },
  // Legal
  {
    name: 'Memo Hukum Perpanjangan Lease',
    kategori: 'Legal',
    pemilik: 'Nurhasan',
    tanggal: '20 Aug 2026',
    ukuran: '856 KB',
    id: 'D6',
    tags: ['memo', 'lease'],
    status: 'aktif',
    versi: 'v2',
    access_level: 'Lihat',
    unit: 'Legal'
  },
  // Korespondensi
  {
    name: 'Surat Edaran Jam Kerja Fleksibel',
    kategori: 'Korespondensi',
    pemilik: 'Ahmad Ridho',
    tanggal: '01 Oct 2026',
    ukuran: '234 KB',
    id: 'D7',
    tags: ['surat', 'kebijakan'],
    status: 'aktif',
    versi: 'v1',
    access_level: 'Kelola',
    unit: 'Korespondensi'
  }
]

// Computed: visible dokumen per folder + role
const visibleDokumen = computed(() => {
  if (!currentFolder.value) return []
  
  const docsInFolder = dokumentData.filter(d => 
    d.status === activeTab.value && 
    String(d.kategori).toLowerCase() === currentFolder.value
  )
  
  // Admin: lihat semua
  if (isAdmin.value) return docsInFolder
  
  // Pengelola + Pengguna: filter by unit
  return docsInFolder.filter(d => d.unit === currentUser.value?.unit)
})

const openFolder = (folderName: string) => {
  currentFolder.value = folderName.toLowerCase()
}

const formatFolderName = (name: string | null) => {
  if (!name) return ''
  return name.charAt(0).toUpperCase() + name.slice(1)
}

const openDocumentDrawer = (doc: Record<string, string | number>) => {
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

const getAccessLevelClass = (level: string) => {
  const map: Record<string, string> = {
    'Kelola': 'danger',
    'Lihat': 'success',
    'Edit': 'warning'
  }
  return map[level] || 'default'
}

const showFolderPermModal = ref(false)
const selectedFolderForPerm = ref<any>(null)
const folderPermissions = ref([
  { id: 'fp1', folderName: 'Legal', subjectType: 'user', subjectName: 'Ahmad Karim', level: 'edit' }
])
const permForm = ref({
  subjectType: 'user',
  subjectId: null,
  level: 'view'
})

const openFolderPermModal = () => {
  if (!currentFolder.value) return
  const folder = allFolders.find(f => f.name.toLowerCase() === currentFolder.value)
  if (!folder) return
  selectedFolderForPerm.value = folder
  showFolderPermModal.value = true
}

const grantFolderPermission = () => {
  if (!permForm.value.subjectId) {
    console.log('Pilih subjek terlebih dahulu')
    return
  }
  if (permForm.value.subjectType === 'user' && permForm.value.level === 'manage') {
    console.log('Pengguna individual tidak boleh diberi level Kelola')
    return
  }
  const subjectNames: Record<string, string> = {
    'user1': 'Ahmad Karim',
    'user2': 'Siti Nurhaliza',
    'group1': 'Grup Legal',
    'group2': 'Grup Finance'
  }
  const newPerm = {
    id: 'fp' + Date.now(),
    folderName: selectedFolderForPerm.value.name,
    subjectType: permForm.value.subjectType,
    subjectName: subjectNames[permForm.value.subjectId as string] || permForm.value.subjectId,
    level: permForm.value.level
  }
  folderPermissions.value.push(newPerm)
  permForm.value = { subjectType: 'user', subjectId: null, level: 'view' }
  console.log('Akses diberikan')
}

const revokeFolderPermission = (permId: string) => {
  folderPermissions.value = folderPermissions.value.filter(p => p.id !== permId)
  console.log('Akses dicabut')
}

const showUploadModal = ref(false)
const uploadForm = ref({
  nama: '',
  folder: null,
  kategori: null,
  tag: '',
  catatan: ''
})

const showFolderModal = ref(false)
const folderForm = ref({
  nama: '',
  unit: null
})

const folders = [
  { label: 'Keuangan', value: 'keuangan' }
]

const units = [
  { label: 'Legal', value: 'legal' },
  { label: 'Operasional', value: 'operasional' },
  { label: 'Keuangan', value: 'keuangan' }
]

const categories = [
  { label: 'Kontrak', value: 'kontrak' },
  { label: 'Keuangan', value: 'keuangan' },
  { label: 'Lainnya', value: 'lainnya' }
]

const openUploadModal = () => {
  showUploadModal.value = true
}

const closeUploadModal = () => {
  showUploadModal.value = false
  uploadForm.value = { nama: '', folder: null, kategori: null, tag: '', catatan: '' }
}

const handleUpload = () => {
  console.log('Upload:', uploadForm.value)
  closeUploadModal()
}

const openFolderModal = () => {
  showFolderModal.value = true
}

const closeFolderModal = () => {
  showFolderModal.value = false
  folderForm.value = { nama: '', unit: null }
}

const handleCreateFolder = () => {
  console.log('Create Folder:', folderForm.value)
  closeFolderModal()
}
</script>

<template>
  <div class="panel">
    <div class="panel-head">
      <div class="crumbs">
          <button @click="currentFolder = null" :style="{ color: currentFolder ? 'var(--accent)' : 'var(--text)', textDecoration: currentFolder ? 'underline' : 'none' }" style="background: none; border: none; cursor: pointer">Semua Folder</button>
          <span v-if="currentFolder" style="margin: 0 8px; color: var(--muted-foreground)">/</span>
          <span v-if="currentFolder" style="color: var(--text)">{{ formatFolderName(currentFolder) }}</span>
        </div>
      <div class="actions">
        <Button
          v-if="!currentFolder && (isAdmin || isPengelola)"
          label="Tambah Folder"
          icon="pi pi-plus"
          text
          size="small"
          class="folder-btn"
          @click="openFolderModal"
        />
        <Button
          v-if="currentFolder && (isAdmin || isPengelola)"
          label="Kelola Akses"
          icon="pi pi-shield"
          text
          size="small"
          class="access-btn"
          @click="openFolderPermModal"
        />
        <Button
          label="Unggah Dokumen"
          icon="pi pi-plus"
          rounded
          size="small"
          class="upload-btn"
          @click="openUploadModal"
        />
      </div>
    </div>

    <div class="tabs" style="padding: 0 16px">
      <button class="tab" :class="{ active: activeTab === 'aktif' }" @click="activeTab = 'aktif'">Aktif</button>
      <button class="tab" :class="{ active: activeTab === 'trash' }" @click="activeTab = 'trash'">Tempat Sampah</button>
    </div>

    <div class="table-scroll">
      <DataTable v-if="!currentFolder" :value="activeTab === 'aktif' ? visibleFolders.filter(f => f.status === 'aktif') : visibleFolders.filter(f => f.status === 'trash')" responsiveLayout="scroll" class="doc-table" @rowClick="(e: any) => openFolder(e.data.name)">
        <template #empty>
          <div class="empty">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <div>{{ activeTab === 'aktif' ? 'Belum ada folder.' : 'Tempat sampah kosong.' }}</div>
          </div>
        </template>
        <Column field="name" header="Nama Folder" style="width: auto">
          <template #body="slotProps">
            <div class="docname" style="cursor: pointer; color: var(--accent); display: flex; align-items: center; gap: 8px; flex: 1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span style="font-weight: 600; color: #ffffff">{{ slotProps.data.name }}</span>
              <span style="color: #9ca3af; margin: 0 4px">—</span>
              <span style="color: #6b7280; font-size: 13px">{{ slotProps.data.pemilik }}</span>
            </div>
          </template>
        </Column>
        <Column field="docs" header="Dokumen" style="width: 100px; text-align: right">
          <template #body="slotProps">
            <span class="num">{{ slotProps.data.docs }} dokumen</span>
          </template>
        </Column>
      </DataTable>

      <DataTable v-else :value="visibleDokumen" responsiveLayout="scroll" class="doc-table" :rowClassName="() => 'doc-table-row'" @rowClick="(e: any) => openDocumentDrawer(e.data)">
        <template #empty>
          <div class="empty">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            </svg>
            <div>Tidak ada dokumen.</div>
          </div>
        </template>
        <Column field="name" header="Nama" style="width: 200px">
          <template #body="slotProps">
            <div class="docname" style="cursor: pointer">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              </svg>
              {{ slotProps.data.name }}
            </div>
          </template>
        </Column>
        <Column field="kategori" header="Kategori" style="width: 120px">
          <template #body="slotProps">
            <span :class="'pill cat-' + getCategoryClass(slotProps.data.kategori)"><span class="dot"></span>{{ slotProps.data.kategori }}</span>
          </template>
        </Column>
        <Column field="pemilik" header="Pemilik" style="width: 100px" />
        <Column field="tanggal" header="Tanggal" style="width: 100px">
          <template #body="slotProps">
            <span class="num">{{ slotProps.data.tanggal }}</span>
          </template>
        </Column>
        <Column field="ukuran" header="Ukuran" style="width: 80px">
          <template #body="slotProps">
            <span class="num">{{ slotProps.data.ukuran }}</span>
          </template>
        </Column>
        <Column field="versi" header="Versi" style="width: 60px">
          <template #body="slotProps">
            <span class="num">{{ slotProps.data.versi }}</span>
          </template>
        </Column>
        <Column header="Level Anda" style="width: 100px">
          <template #body="slotProps">
            <span :class="'pill pill-' + getAccessLevelClass(slotProps.data.access_level)"><span class="dot"></span>{{ slotProps.data.access_level }}</span>
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
                @click="console.log('Download:', slotProps.data.name)"
                title="Unduh"
              />
              <!-- Upload Versi (edit+) -->
              <Button
                v-if="currentFolder && canUploadVersionDoc(slotProps.data, allFolders.find(f => f.name === formatFolderName(currentFolder))!)"
                icon="pi pi-arrow-up"
                severity="secondary"
                text
                size="small"
                @click="console.log('Upload:', slotProps.data.name)"
                title="Unggah Versi"
              />
              <!-- Trash (manage) -->
              <Button
                v-if="currentFolder && canTrashDoc(slotProps.data, allFolders.find(f => f.name === formatFolderName(currentFolder))!)"
                icon="pi pi-trash"
                severity="secondary"
                text
                size="small"
                @click="console.log('Trash:', slotProps.data.name)"
                title="Pindahkan ke sampah"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>

  <Dialog
    v-model:visible="showUploadModal"
    header="Unggah Dokumen"
    :modal="true"
    :closable="true"
    style="width: 600px"
    @hide="closeUploadModal"
  >
    <div class="form-group">
      <label>Nama Dokumen</label>
      <InputText
        v-model="uploadForm.nama"
        placeholder="mis. Kontrak Pemeliharaan AC 2026"
        class="w-full"
      />
    </div>

    <div class="form-group">
      <label>Folder</label>
      <Dropdown
        v-model="uploadForm.folder"
        :options="folders"
        option-label="label"
        option-value="value"
        placeholder="Pilih folder"
        class="w-full"
      />
    </div>

    <div class="form-group">
      <label>Kategori</label>
      <Dropdown
        v-model="uploadForm.kategori"
        :options="categories"
        option-label="label"
        option-value="value"
        placeholder="Pilih kategori"
        class="w-full"
      />
    </div>

    <div class="form-group">
      <label>Tag (pisahkan koma)</label>
      <InputText
        v-model="uploadForm.tag"
        placeholder="mis. sewa, gedung"
        class="w-full"
      />
    </div>

    <div class="form-group">
      <label>Catatan versi</label>
      <Textarea
        v-model="uploadForm.catatan"
        placeholder="Unggahan awal"
        rows="4"
        class="w-full"
      />
    </div>

    <template #footer>
      <Button
        label="Batal"
        severity="secondary"
        @click="closeUploadModal"
      />
      <Button
        label="Unggah"
        icon="pi pi-upload"
        @click="handleUpload"
      />
    </template>
  </Dialog>

  <Dialog
    v-model:visible="showFolderModal"
    header="Tambah Folder"
    :modal="true"
    :closable="true"
    style="width: 600px"
    @hide="closeFolderModal"
  >
    <div class="form-group">
      <label>Nama Folder</label>
      <InputText
        v-model="folderForm.nama"
        placeholder="mis. Pengadaan Barang"
        class="w-full"
      />
    </div>

    <div class="form-group">
      <label>Unit</label>
      <Dropdown
        v-model="folderForm.unit"
        :options="units"
        option-label="label"
        option-value="value"
        placeholder="Pilih unit"
        class="w-full"
      />
    </div>

    <template #footer>
      <Button
        label="Batal"
        severity="secondary"
        @click="closeFolderModal"
      />
      <Button
        label="Buat Folder"
        icon="pi pi-plus"
        @click="handleCreateFolder"
      />
    </template>
  </Dialog>

  <!-- Folder Permission Modal -->
  <Dialog
    v-model:visible="showFolderPermModal"
    :header="`Kelola Akses — ${selectedFolderForPerm?.name || ''}`"
    :modal="true"
    :closable="true"
    style="width: min(600px, 100%); max-height: 88vh"
    content-style="padding: 0; display: flex; flex-direction: column"
  >
    <div style="flex: 1; overflow-y: auto; padding: 16px 18px; display: flex; flex-direction: column; gap: 24px">
      <!-- AKSES BAWAAN -->
      <div>
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted-foreground); margin-bottom: 12px">Akses Bawaan (Otomatis, Tidak Tersimpan)</div>
        <div style="display: flex; flex-direction: column; gap: 10px">
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px">
            <span>Admin — selalu</span>
            <span style="background: #fecaca; color: #991b1b; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600">Kelola</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px">
            <span>Pengelola {{ selectedFolderForPerm?.unit }} — default</span>
            <span style="background: #fecaca; color: #991b1b; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600">Kelola</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px">
            <span>Pengguna {{ selectedFolderForPerm?.unit }} (0 akun) — default</span>
            <span style="background: #fecaca; color: #991b1b; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600">Edit</span>
          </div>
        </div>
      </div>

      <!-- PENGECUALIAN -->
      <div>
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted-foreground); margin-bottom: 12px">Pengecualian (Individual / Grup)</div>
        <div v-if="folderPermissions.length > 0" style="display: flex; flex-direction: column; gap: 8px">
          <div v-for="perm in folderPermissions" :key="perm.id" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; font-size: 13px">
            <div style="display: flex; align-items: center; gap: 10px">
              <span style="font-weight: 600">{{ perm.subjectName }}</span>
              <span style="background: #bfdbfe; color: #1e3a8a; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: capitalize">{{ perm.level === 'view' ? 'Lihat' : perm.level === 'edit' ? 'Edit' : 'Kelola' }}</span>
            </div>
            <button @click="revokeFolderPermission(perm.id)" style="background: none; border: none; color: var(--muted-foreground); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
        <div v-else style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; text-align: center; color: var(--muted-foreground)">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px; opacity: 0.5">
            <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <div style="font-size: 12px">Belum ada pengecualian izin yang diberikan.</div>
        </div>
      </div>

      <!-- TAMBAH PENGECUALIAN -->
      <div style="border-top: 1px solid var(--border); padding-top: 24px">
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted-foreground); margin-bottom: 14px">Tambah Pengecualian</div>
        
        <div style="margin-bottom: 14px">
          <label style="font-size: 12px; font-weight: 600; color: var(--muted-foreground); display: block; margin-bottom: 6px">Tipe Subjek</label>
          <Dropdown
            v-model="permForm.subjectType"
            :options="[
              { label: 'Pengguna', value: 'user' },
              { label: 'Grup', value: 'group' }
            ]"
            option-label="label"
            option-value="value"
            placeholder="Pilih tipe"
            style="width: 100%"
          />
        </div>

        <div style="margin-bottom: 14px">
          <label style="font-size: 12px; font-weight: 600; color: var(--muted-foreground); display: block; margin-bottom: 6px">Pilih Pengguna/Grup</label>
          <Dropdown
            v-model="permForm.subjectId"
            :options="[
              { label: 'Ahmad Karim', value: 'user1' },
              { label: 'Siti Nurhaliza', value: 'user2' },
              { label: 'Nurhasan', value: 'user3' },
              { label: 'Grup Legal', value: 'group1' },
              { label: 'Grup Finance', value: 'group2' }
            ]"
            option-label="label"
            option-value="value"
            placeholder="Pilih subjek"
            style="width: 100%"
          />
        </div>

        <div style="margin-bottom: 14px">
          <label style="font-size: 12px; font-weight: 600; color: var(--muted-foreground); display: block; margin-bottom: 6px">Level Akses</label>
          <Dropdown
            v-model="permForm.level"
            :options="[
              { label: 'Lihat', value: 'view' },
              { label: 'Edit', value: 'edit' },
              { label: 'Kelola', value: 'manage' }
            ]"
            option-label="label"
            option-value="value"
            placeholder="Pilih level"
            style="width: 100%"
          />
        </div>

        <div style="font-size: 11px; color: var(--muted-foreground); line-height: 1.6">
          Pemberian akses ke Pengguna individual dibatasi maksimal "Edit" (tidak bisa "Kelola"); sebaliknya grup bisa diberi akses sampai "Kelola".
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Tutup"
        severity="secondary"
        @click="showFolderPermModal = false"
      />
      <Button
        label="Berikan Akses"
        icon="pi pi-shield"
        @click="grantFolderPermission"
      />
    </template>
  </Dialog>

  <Drawer v-model:visible="showDocumentDrawer" position="right" :modal="false" :style="{ width: '420px' }">
    <template #header v-if="selectedDocument">
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%">
        <div>
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: var(--text)">{{ selectedDocument.name }}</h3>
          <span :class="'pill cat-' + selectedDocument.kategori"><span class="dot"></span>{{ selectedDocument.kategori }}</span>
        </div>
      </div>
    </template>

    <div v-if="selectedDocument" style="display: flex; flex-direction: column; gap: 24px; padding-top: 12px">
      <!-- METADATA -->
      <div>
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; margin-bottom: 12px">Metadata</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px">
          <div>
            <div style="color: var(--text-muted); font-size: 11px; font-weight: 600; margin-bottom: 4px">FOLDER</div>
            <div style="color: var(--text); font-weight: 500">{{ formatFolderName(currentFolder) }}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 11px; font-weight: 600; margin-bottom: 4px">PEMILIK</div>
            <div style="color: var(--text); font-weight: 500">{{ selectedDocument.pemilik }}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 11px; font-weight: 600; margin-bottom: 4px">TANGGAL DIBUAT</div>
            <div style="color: var(--text); font-weight: 500">{{ selectedDocument.tanggal }}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 11px; font-weight: 600; margin-bottom: 4px">UKURAN SAAT INI</div>
            <div style="color: var(--text); font-weight: 500">{{ selectedDocument.ukuran }}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 11px; font-weight: 600; margin-bottom: 4px">ID DOKUMEN</div>
            <div style="color: var(--text); font-weight: 500; font-family: monospace; font-size: 12px">{{ selectedDocument.id || 'D' + Math.floor(Math.random() * 100) }}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 11px; font-weight: 600; margin-bottom: 4px">STATUS</div>
            <span class="pill" style="background: #16a34a; color: white">Aktif</span>
          </div>
        </div>
      </div>

      <!-- TAGS -->
      <div v-if="(selectedDocument as any).tags && (selectedDocument as any).tags.length">
        <div style="display: flex; gap: 6px; flex-wrap: wrap">
          <span v-for="(tag, idx) in (selectedDocument as any).tags" :key="idx" style="display: inline-block; padding: 4px 10px; background: var(--surface-2); border-radius: 12px; font-size: 12px; color: var(--text); font-weight: 500">{{ tag }}</span>
        </div>
      </div>

      <!-- AKSES -->
      <div>
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; margin-bottom: 12px">Akses Anda ke Dokumen Ini</div>
        <span class="pill pill-danger"><span class="dot"></span>Kelola</span>
      </div>

      <!-- RIWAYAT VERSI -->
      <div>
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; margin-bottom: 12px">Riwayat Versi</div>
        <div style="padding: 12px; background: var(--surface-2); border-radius: 8px">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px">
            <span class="pill" style="background: var(--accent); color: white; padding: 2px 8px; font-size: 11px">v1</span>
            <span class="pill" style="background: var(--surface-3); color: var(--text); padding: 4px 10px">Unggahan awal</span>
          </div>
          <div style="color: var(--text-muted); font-size: 12px">{{ selectedDocument.tanggal }} • {{ selectedDocument.pemilik }} • {{ selectedDocument.ukuran }}</div>
        </div>
      </div>

      <!-- AKTIVITAS -->
      <div>
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; margin-bottom: 12px">Aktivitas Dokumen Ini</div>
        <div style="padding: 12px; background: var(--surface-2); border-radius: 8px; font-size: 13px">
          <div style="color: var(--text-muted); margin-bottom: 4px">20 Sep 2026, 08:14</div>
          <div style="color: var(--text); font-weight: 500">{{ selectedDocument.pemilik }} — Unggah dokumen</div>
        </div>
      </div>

      <!-- ACTION BUTTONS -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border)">
        <Button label="Unduh" icon="pi pi-download" severity="info" size="small" />
        <Button label="Unggah Versi" icon="pi pi-upload" severity="secondary" size="small" />
        <Button label="Ke Sampah" icon="pi pi-trash" severity="danger" size="small" />
        <Button label="Kelola Akses" icon="pi pi-lock" severity="secondary" size="small" />
      </div>
    </div>
  </Drawer>
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

.pill.cat-Keuangan {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.pill.cat-Keuangan .dot {
  background: #10b981;
}

.pill.cat-Lainnya {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.pill.cat-Lainnya .dot {
  background: #f59e0b;
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

.pill.pill-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.pill.pill-danger .dot {
  background: #ef4444;
}

.pill.pill-success {
  background: rgba(22, 163, 74, 0.1);
  color: #16a34a;
}

.pill.pill-success .dot {
  background: #16a34a;
}

.pill.pill-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.pill.pill-warning .dot {
  background: #f59e0b;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

:deep(.folder-btn) {
  color: var(--text) !important;
  background: transparent !important;
  border: none !important;
  padding: 6px 12px !important;
  font-size: 13px !important;
}
:deep(.folder-btn:hover) {
  background: var(--surface-2) !important;
}
:deep(.folder-btn .pi) { font-size: 12px; }

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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}
:deep(.w-full) {
  width: 100%;
}

/* Buat ngosongin header tabel kalo gada isi kolom, */
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
</style>
