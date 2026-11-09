<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Paginator from 'primevue/paginator'
import ProgressSpinner from 'primevue/progressspinner'
import api from '../services/api'
import { useDocumentsStore, type Doc, type Folder } from '../stores/documents'
import { useAuthStore } from '../stores/auth'
import { useCategoryBadge } from '../composables/useCategoryBadge'
import { useAppConfirm } from '../composables/useAppConfirm'

const store = useDocumentsStore()
const authStore = useAuthStore()
const { getCategoryBadge } = useCategoryBadge()
const { confirmDelete, confirmAction } = useAppConfirm()

// ─── Folder Navigation & Tab State ───
const folderBreadcrumbs = ref<Folder[]>([])
const currentFolder = computed<Folder | null>(() => {
  return folderBreadcrumbs.value.length > 0
    ? folderBreadcrumbs.value[folderBreadcrumbs.value.length - 1]
    : null
})

const activeTab = ref<'aktif' | 'trash'>('aktif')
const selectedDoc = ref<Doc | null>(null)
const isDrawerOpen = ref(false)

// ─── Add Folder State ───
const isAddFolderModalOpen = ref(false)
const folderForm = ref({
  name: '',
  unit_id: '',
  parent_folder_id: '',
  parent_folder_name: '',
})
const folderSubmitting = ref(false)

// ─── Upload Document State ───
const isUploadModalOpen = ref(false)
const newDoc = ref({
  name: '',
  category_id: '',
  tags: '',
  note: 'Unggahan awal',
})
const uploadFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const submitting = ref(false)

function triggerFileInput() {
  fileInputRef.value?.click()
}

function clearUploadFile() {
  uploadFile.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// ─── Move Document State ───
const isMoveModalOpen = ref(false)
const docToMove = ref<Doc | null>(null)
const moveTargetFolderId = ref<string>('')
const moveBreadcrumbs = ref<Folder[]>([])
const moveSubmitting = ref(false)

// ─── Version Upload State ───
const isVersionModalOpen = ref(false)
const versionFile = ref<File | null>(null)
const versionFileInputRef = ref<HTMLInputElement | null>(null)
const versionNote = ref('')

function triggerVersionFileInput() {
  versionFileInputRef.value?.click()
}

function clearVersionFile() {
  versionFile.value = null
  if (versionFileInputRef.value) versionFileInputRef.value.value = ''
}

// ─── Computed Permissions & Role ───
const userRole = computed(() => (authStore.userRole || 'Admin').toLowerCase())
const canAddFolder = computed(() => authStore.canManageFolder || authStore.isAdmin || userRole.value === 'pengelola')

const canModify = (doc: Doc) => {
  if (authStore.isAdmin || userRole.value === 'pengelola') return true
  return doc.owner_id === authStore.user?.id
}

const rows = 10

// Folders pagination state (View 1)
const foldersList = ref<Folder[]>([])
const folderFirst = ref(0)
const folderTotalRecords = ref(0)
const loadingFolders = ref(false)

// Subfolders of current active folder
const currentSubFolders = computed(() => {
  if (!currentFolder.value) return []
  return store.folders.filter(f => (f.parent_folder_id || (f as any).parentFolderId) === currentFolder.value?.id)
})

async function fetchFoldersPaginated(page = 1) {
  loadingFolders.value = true
  try {
    const params: Record<string, any> = {
      paginate: true,
      page,
      per_page: rows,
    }
    if (currentFolder.value?.id) {
      params.parent_folder_id = currentFolder.value.id
    } else {
      params.root_only = true
    }

    const res = await api.get('/v1/folders', { params })
    foldersList.value = (res.data?.data ?? []).map((f: any) => ({
      ...f,
      unitId: f.unit_id ?? f.unitId,
    }))
    folderTotalRecords.value = res.data?.meta?.total ?? foldersList.value.length
  } catch {
    const all = store.folders.filter(f => {
      if (currentFolder.value?.id) {
        return (f.parent_folder_id || (f as any).parentFolderId) === currentFolder.value.id
      }
      return !f.parent_folder_id && !(f as any).parentFolderId
    })
    foldersList.value = all.slice(folderFirst.value, folderFirst.value + rows)
    folderTotalRecords.value = all.length
  } finally {
    loadingFolders.value = false
  }
}

function onFolderPageChange(e: { page: number; first: number }) {
  folderFirst.value = e.first
  const targetPage = e.page + 1
  fetchFoldersPaginated(targetPage)
}

// Documents pagination state (View 2)
const docFirst = ref(0)
const docTotalRecords = ref(0)

async function fetchFolderDocs(page = 1) {
  const params: Record<string, any> = {
    page,
    per_page: rows,
    status: activeTab.value === 'trash' ? 'trashed' : 'active',
  }
  if (currentFolder.value?.id) {
    params.folder_id = currentFolder.value.id
  }
  await store.fetchDocuments(params)
  docTotalRecords.value = store.meta?.total ?? store.documents.length
}

function onDocPageChange(e: { page: number; first: number }) {
  docFirst.value = e.first
  const targetPage = e.page + 1
  fetchFolderDocs(targetPage)
}

// Refresh when currentFolder or activeTab changes
watch([currentFolder, activeTab], () => {
  docFirst.value = 0
  folderFirst.value = 0
  if (currentFolder.value) {
    fetchFolderDocs(1)
  }
  fetchFoldersPaginated(1)
})

function getFolderDocCount(folder: any, tab: 'aktif' | 'trash' = 'aktif'): number {
  if (tab === 'trash') {
    if (typeof folder.trashed_documents_count === 'number') {
      return folder.trashed_documents_count
    }
    return store.trashedDocs.filter(d => (d.folder_id || d.folderId) === folder.id).length
  }
  if (typeof folder.documents_count === 'number') {
    return folder.documents_count
  }
  return store.activeDocs.filter(d => (d.folder_id || d.folderId) === folder.id).length
}

// ─── Lifecycle ───
onMounted(async () => {
  await Promise.allSettled([
    fetchFoldersPaginated(1),
    store.fetchFolders({ all: true }),
    store.fetchCategories(),
    store.fetchUnits(),
  ])
})

// ─── Folder Navigation Actions ───
function openFolder(folder: Folder) {
  folderBreadcrumbs.value.push(folder)
  docFirst.value = 0
  folderFirst.value = 0
}

function navigateToBreadcrumb(index: number) {
  if (index === -1) {
    folderBreadcrumbs.value = []
  } else {
    folderBreadcrumbs.value = folderBreadcrumbs.value.slice(0, index + 1)
  }
  docFirst.value = 0
  folderFirst.value = 0
}

function closeFolder() {
  if (folderBreadcrumbs.value.length > 0) {
    folderBreadcrumbs.value.pop()
  }
  docFirst.value = 0
  folderFirst.value = 0
}

function openAddFolderModal(parentFolder: Folder | null = null) {
  const defaultUnit = authStore.isAdmin
    ? (parentFolder?.unit_id || store.units[0]?.id || '')
    : (authStore.user?.unit_id || parentFolder?.unit_id || '')

  folderForm.value = {
    name: '',
    unit_id: defaultUnit,
    parent_folder_id: parentFolder ? parentFolder.id : '',
    parent_folder_name: parentFolder ? parentFolder.name : '',
  }
  isAddFolderModalOpen.value = true
}

async function submitAddFolder() {
  if (!folderForm.value.name.trim()) return alert('Nama folder wajib diisi')
  if (authStore.isAdmin && !folderForm.value.unit_id) {
    return alert('Pilih unit untuk folder ini')
  }

  folderSubmitting.value = true
  try {
    const payload: { name: string; unit_id?: string; parent_folder_id?: string } = {
      name: folderForm.value.name.trim(),
    }
    if (folderForm.value.unit_id) {
      payload.unit_id = folderForm.value.unit_id
    }
    if (folderForm.value.parent_folder_id) {
      payload.parent_folder_id = folderForm.value.parent_folder_id
    }

    await store.createFolder(payload)
    isAddFolderModalOpen.value = false
    await fetchFoldersPaginated(1)
    await store.fetchFolders({ all: true })
  } catch (e: any) {
    alert(e.response?.data?.message || 'Gagal membuat folder')
  } finally {
    folderSubmitting.value = false
  }
}

function handleDeleteFolder(folder: Folder) {
  const docCount = getFolderDocCount(folder, 'aktif') + getFolderDocCount(folder, 'trash')
  const subCount = folder.subfolders_count ?? store.folders.filter(f => (f.parent_folder_id || (f as any).parentFolderId) === folder.id).length

  const hasContents = docCount > 0 || subCount > 0
  const title = hasContents ? 'Hapus Folder dan Seluruh Isinya?' : 'Hapus Folder'
  const message = hasContents
    ? `Folder "${folder.name}" berisi ${docCount} dokumen dan ${subCount} sub-folder.`
    : `Apakah Anda yakin ingin menghapus folder "${folder.name}"?`
  const submessage = hasContents
    ? 'Perhatian: Menghapus folder ini akan menghapus folder beserta seluruh dokumen dan sub-folder di dalamnya secara permanen. Tindakan ini tidak dapat dibatalkan.'
    : 'Folder yang kosong akan langsung dihapus secara permanen.'
  const confirmLabel = hasContents ? 'Hapus Folder & Isinya' : 'Hapus Folder'

  confirmDelete({
    title,
    message,
    submessage,
    confirmLabel,
    onAccept: async () => {
      try {
        await store.deleteFolder(folder.id)
        await fetchFoldersPaginated(1)
        await store.fetchFolders({ all: true })
      } catch (e: any) {
        alert(e.response?.data?.message || 'Gagal menghapus folder')
      }
    },
  })
}

// ─── Upload Document Actions (Only inside folder, no folder field!) ───
function openUploadModal() {
  if (!currentFolder.value) {
    return alert('Silakan buka folder terlebih dahulu sebelum mengunggah dokumen.')
  }
  newDoc.value = {
    name: '',
    category_id: store.categories[0]?.id || '',
    tags: '',
    note: 'Unggahan awal',
  }
  uploadFile.value = null
  isUploadModalOpen.value = true
}

async function submitUploadDoc() {
  if (!currentFolder.value?.id) {
    return alert('Folder tujuan tidak ditemukan.')
  }
  if (!newDoc.value.name.trim()) return alert('Nama dokumen wajib diisi')
  if (!newDoc.value.category_id) return alert('Pilih kategori terlebih dahulu')

  submitting.value = true
  try {
    await store.uploadDocument({
      name: newDoc.value.name.trim(),
      folder_id: currentFolder.value.id,
      category_id: newDoc.value.category_id,
      tags: newDoc.value.tags,
      file: uploadFile.value,
      note: newDoc.value.note,
    })
    isUploadModalOpen.value = false
    await fetchFolderDocs(1)
    await fetchFoldersPaginated(1)
  } catch (e: any) {
    alert(e.response?.data?.message ?? 'Gagal mengunggah dokumen')
  } finally {
    submitting.value = false
  }
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  uploadFile.value = target.files?.[0] ?? null
}

// ─── Move Document Actions ───
function openMoveModal(doc: Doc) {
  docToMove.value = doc
  moveTargetFolderId.value = ''
  moveBreadcrumbs.value = []
  isMoveModalOpen.value = true
}

const moveFoldersList = computed(() => {
  const currentParentId = moveBreadcrumbs.value.length > 0
    ? moveBreadcrumbs.value[moveBreadcrumbs.value.length - 1].id
    : null
  return store.folders.filter(f => {
    if (!currentParentId) {
      return !f.parent_folder_id && !(f as any).parentFolderId
    }
    return (f.parent_folder_id || (f as any).parentFolderId) === currentParentId
  })
})

function hasSubfolders(folderId: string): boolean {
  return store.folders.some(f => (f.parent_folder_id || (f as any).parentFolderId) === folderId)
}

function enterMoveSubfolder(folder: Folder) {
  moveBreadcrumbs.value.push(folder)
  moveTargetFolderId.value = folder.id
}

async function submitMoveDocument() {
  if (!docToMove.value || !moveTargetFolderId.value) return
  moveSubmitting.value = true
  try {
    await store.moveDocument(docToMove.value.id, moveTargetFolderId.value)
    isMoveModalOpen.value = false
    if (selectedDoc.value?.id === docToMove.value.id) {
      const full = await store.fetchDocument(docToMove.value.id)
      if (full) selectedDoc.value = full
    }
    await fetchFolderDocs(1)
    await fetchFoldersPaginated(1)
  } catch (e: any) {
    alert(e.response?.data?.message || 'Gagal memindahkan dokumen')
  } finally {
    moveSubmitting.value = false
  }
}

// ─── Document Detail, Download & Trash Actions ───
async function openDocDetail(doc: Doc) {
  const full = await store.fetchDocument(doc.id)
  selectedDoc.value = full || doc
  isDrawerOpen.value = true
}

function closeDrawer() {
  isDrawerOpen.value = false
}

async function handleDownload(doc: Doc) {
  try {
    await store.downloadDocument(doc.id)
  } catch (e: any) {
    alert(e.response?.data?.message || 'Gagal mengunduh dokumen')
  }
}

function handleTrash(doc: Doc) {
  confirmDelete({
    title: 'Pindahkan ke Tempat Sampah',
    message: `Apakah Anda yakin ingin memindahkan "${doc.name}" ke tempat sampah?`,
    submessage: 'Dokumen dapat dipulihkan kapan saja dari tab Tempat Sampah.',
    confirmLabel: 'Pindahkan ke Sampah',
    onAccept: async () => {
      try {
        await store.trashDocument(doc.id)
        if (selectedDoc.value?.id === doc.id) closeDrawer()
        await fetchFolderDocs(1)
        await fetchFoldersPaginated(1)
      } catch (e: any) {
        alert(e.response?.data?.message ?? 'Gagal memindahkan ke tempat sampah')
      }
    },
  })
}

function handleRestore(doc: Doc) {
  confirmAction({
    title: 'Pulihkan Dokumen',
    message: `Pulihkan "${doc.name}" ke daftar dokumen aktif?`,
    confirmLabel: 'Pulihkan',
    onAccept: async () => {
      try {
        await store.restoreDocument(doc.id)
        if (selectedDoc.value?.id === doc.id) closeDrawer()
        await fetchFolderDocs(1)
        await fetchFoldersPaginated(1)
      } catch (e: any) {
        alert(e.response?.data?.message ?? 'Gagal memulihkan dokumen')
      }
    },
  })
}

function handlePurge(doc: Doc) {
  confirmDelete({
    title: 'Hapus Dokumen Secara Permanen',
    message: `Hapus permanen "${doc.name}"?`,
    submessage: 'Tindakan ini tidak dapat dibatalkan. File dan seluruh riwayat versi akan terhapus.',
    confirmLabel: 'Hapus Permanen',
    onAccept: async () => {
      try {
        await store.deleteDocument(doc.id)
        if (selectedDoc.value?.id === doc.id) closeDrawer()
        await fetchFolderDocs(1)
        await fetchFoldersPaginated(1)
      } catch (e: any) {
        alert(e.response?.data?.message ?? 'Gagal menghapus permanen')
      }
    },
  })
}

// ─── Version Upload ───
function openVersionModal(doc: Doc) {
  selectedDoc.value = doc
  versionFile.value = null
  versionNote.value = ''
  isVersionModalOpen.value = true
}

function handleVersionFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  versionFile.value = target.files?.[0] ?? null
}

async function submitUploadVersion() {
  if (!versionFile.value) return alert('Pilih file terlebih dahulu')
  if (!selectedDoc.value) return
  submitting.value = true
  try {
    await store.uploadVersion(selectedDoc.value.id, versionFile.value, versionNote.value)
    isVersionModalOpen.value = false
    const full = await store.fetchDocument(selectedDoc.value.id)
    if (full) selectedDoc.value = full
    await fetchFolderDocs(Math.floor(docFirst.value / rows) + 1)
  } catch (e: any) {
    alert(e.response?.data?.message ?? 'Gagal upload versi')
  } finally {
    submitting.value = false
  }
}

// ─── Helper Functions ───
function getCategoryName(doc: Doc): string {
  return doc.category?.name || doc.categoryName || (typeof doc.category === 'string' ? doc.category : '-')
}

function getOwnerName(doc: Doc): string {
  return doc.owner?.name || doc.ownerName || (typeof doc.owner === 'string' ? doc.owner : '-')
}

function getFolderName(folderId?: string): string {
  if (!folderId) return '-'
  const f = store.folders.find(x => x.id === folderId)
  return f ? f.name : folderId
}

function isDocTrashed(doc: Doc): boolean {
  return doc.status === 'trashed' || !!doc.deleted_at || !!doc.deletedAt
}

function getCurrentVersion(doc: Doc): any {
  if (doc.latest_version) {
    return {
      v: doc.latest_version.version_number,
      size: doc.latest_version.size_bytes,
      uploader: doc.latest_version.uploader?.name || 'Admin',
      note: doc.latest_version.note,
      checksum: doc.latest_version.checksum,
    }
  }
  if (!doc.versions || doc.versions.length === 0) {
    return { v: 1, size: doc.size || 0, uploader: 'Admin' }
  }
  const last = doc.versions[doc.versions.length - 1]
  return {
    v: last.version_number ?? (last as any).v ?? 1,
    size: last.size_bytes ?? (last as any).size ?? 0,
    uploader: last.uploader?.name ?? (last as any).uploader ?? 'Admin',
    note: last.note,
    checksum: last.checksum,
  }
}

function getUserLevel(doc: Doc) {
  if (canModify(doc)) {
    return {
      label: 'Kelola',
      color: '#f87171',
      dot: '#ef4444',
    }
  }
  return {
    label: 'Lihat',
    color: '#94a3b8',
    dot: '#64748b',
  }
}
</script>

<template>
  <div class="panel">
    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- PANEL HEAD: BREADCRUMBS & ACTION BUTTONS               -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <div class="panel-head">
      <div class="crumbs flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          :class="{ current: !currentFolder }"
          @click="navigateToBreadcrumb(-1)"
        >
          Semua Folder
        </button>
        <template v-for="(folder, idx) in folderBreadcrumbs" :key="folder.id">
          <span class="text-muted">›</span>
          <button
            type="button"
            :class="{ current: idx === folderBreadcrumbs.length - 1, 'font-bold': idx === folderBreadcrumbs.length - 1 }"
            @click="navigateToBreadcrumb(idx)"
          >
            {{ folder.name }}
            <span v-if="idx === folderBreadcrumbs.length - 1 && folder.unit?.name" class="muted font-normal text-xs">
              (unit {{ folder.unit.name }})
            </span>
          </button>
        </template>
      </div>

      <div class="flex items-center gap-2">
        <!-- Tambah Folder (hanya saat di Semua Folder root, untuk Admin/Pengelola) -->
        <button
          v-if="!currentFolder && canAddFolder"
          type="button"
          class="btn ghost sm"
          @click="openAddFolderModal(null)"
        >
          + Tambah Folder
        </button>

        <!-- Saat berada di dalam folder: Tambah Sub-Folder & Kembali -->
        <template v-if="currentFolder">
          <button
            v-if="canAddFolder"
            type="button"
            class="btn ghost sm"
            @click="openAddFolderModal(currentFolder)"
          >
            + Tambah Sub-Folder
          </button>

          <button
            type="button"
            class="btn ghost sm"
            @click="closeFolder"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-1">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Kembali
          </button>

          <!-- Unggah Dokumen HANYA muncul saat di dalam folder -->
          <button
            v-if="activeTab === 'aktif'"
            type="button"
            class="btn primary sm"
            @click="openUploadModal"
          >
            + Unggah Dokumen
          </button>
        </template>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- TABS BAR: AKTIF | TEMPAT SAMPAH                         -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <div class="tabs px-4">
      <button
        type="button"
        class="tab"
        :class="{ active: activeTab === 'aktif' }"
        @click="activeTab = 'aktif'"
      >
        Aktif
      </button>
      <button
        type="button"
        class="tab"
        :class="{ active: activeTab === 'trash' }"
        @click="activeTab = 'trash'"
      >
        Tempat Sampah
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- VIEW 1: DAFTAR FOLDER DI ROOT (Saat currentFolder null) -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <div v-if="!currentFolder" class="panel-body p-2">
      <div v-if="loadingFolders" class="empty">
        <div class="flex flex-col items-center justify-center gap-2 py-6">
          <ProgressSpinner style="width: 32px; height: 32px" strokeWidth="4" />
          <span>Memuat folder...</span>
        </div>
      </div>

      <div v-else-if="foldersList.length === 0" class="empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="opacity-40 mb-1">
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/>
        </svg>
        <div>
          {{ activeTab === 'aktif' ? 'Belum ada folder yang dibuat.' : 'Tidak ada folder di tempat sampah.' }}
        </div>
        <button v-if="canAddFolder && activeTab === 'aktif'" class="btn ghost sm mt-2" @click="openAddFolderModal(null)">
          + Tambah Folder
        </button>
      </div>

      <!-- Clean list of folder rows -->
      <div v-else class="folder-grid">
        <div
          v-for="folder in foldersList"
          :key="folder.id"
          class="folder-row flex items-center justify-between p-2 rounded hover:bg-surface-2 transition-colors cursor-pointer group"
          @click="openFolder(folder)"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-muted flex-shrink-0">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/>
            </svg>
            <span class="text-sm font-medium">{{ folder.name }}</span>
            <span v-if="folder.unit?.name" class="text-xs text-muted"> — {{ folder.unit.name }}</span>
          </div>

          <div class="flex items-center gap-3">
            <span class="count text-xs text-muted">
              {{ getFolderDocCount(folder, activeTab) }}
              {{ activeTab === 'aktif' ? 'dokumen' : 'dokumen terhapus' }}
            </span>
            <!-- Tombol Hapus Folder (hanya di tab aktif & untuk yang berhak) -->
            <button
              v-if="canAddFolder && activeTab === 'aktif'"
              type="button"
              class="iconbtn sm opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
              title="Hapus folder"
              @click.stop="handleDeleteFolder(folder)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Numeric Pagination for Folders -->
      <div v-if="folderTotalRecords > rows" class="border-t border-[var(--border)] p-2 mt-2 flex justify-center">
        <Paginator
          v-model:first="folderFirst"
          :rows="rows"
          :totalRecords="folderTotalRecords"
          :alwaysShow="true"
          @page="onFolderPageChange"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
        />
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- VIEW 2: DI DALAM FOLDER (SUBFOLDER & TABEL DOKUMEN)    -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <div v-else>
      <!-- Sub-Folders Section (jika folder ini memiliki sub-folder) -->
      <div v-if="currentSubFolders.length > 0" class="p-3 border-b border-border bg-surface-2/40">
        <div class="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
          Sub-Folder ({{ currentSubFolders.length }})
        </div>
        <div class="folder-grid">
          <div
            v-for="subf in currentSubFolders"
            :key="subf.id"
            class="folder-row flex items-center justify-between p-2 rounded hover:bg-surface-2 transition-colors cursor-pointer group"
            @click="openFolder(subf)"
          >
            <div class="flex items-center gap-2 min-w-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-accent flex-shrink-0">
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/>
              </svg>
              <span class="text-xs font-semibold">{{ subf.name }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="count text-[11px] text-muted">
                {{ getFolderDocCount(subf, activeTab) }} {{ activeTab === 'aktif' ? 'dokumen' : 'dokumen terhapus' }}
              </span>
              <button
                v-if="canAddFolder && activeTab === 'aktif'"
                type="button"
                class="iconbtn sm opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                title="Hapus sub-folder"
                @click.stop="handleDeleteFolder(subf)"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Document Table -->
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>NAMA</th>
              <th>KATEGORI</th>
              <th>PEMILIK</th>
              <th>TANGGAL</th>
              <th>UKURAN</th>
              <th>VERSI</th>
              <th>LEVEL ANDA</th>
              <th style="text-align: right"></th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading State saat fetch dokumen / pindah page -->
            <tr v-if="store.loading">
              <td colspan="8" style="text-align: center; padding: 32px;" class="muted">
                <div class="flex flex-col items-center justify-center gap-2">
                  <ProgressSpinner style="width: 32px; height: 32px" strokeWidth="4" />
                  <span>Memuat dokumen...</span>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-else-if="store.documents.length === 0">
              <td colspan="8">
                <div class="empty py-8">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="opacity-40 mb-1">
                    <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/>
                  </svg>
                  <div>
                    {{ activeTab === 'aktif'
                      ? `Belum ada dokumen aktif di folder "${currentFolder.name}".`
                      : `Tempat sampah kosong untuk folder "${currentFolder.name}".`
                    }}
                  </div>
                  <button
                    v-if="activeTab === 'aktif'"
                    type="button"
                    class="btn primary sm mt-2"
                    @click="openUploadModal"
                  >
                    + Unggah Dokumen ke Folder Ini
                  </button>
                </div>
              </td>
            </tr>

            <!-- Document Rows -->
            <tr
              v-for="doc in store.documents"
              :key="doc.id"
              class="clickable"
              @click="openDocDetail(doc)"
            >
              <!-- NAMA -->
              <td>
                <div class="docname">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/>
                  </svg>
                  <span class="truncate" :title="doc.name">{{ doc.name }}</span>
                </div>
              </td>

              <!-- KATEGORI -->
              <td>
                <span
                  class="pill"
                  :style="{
                    background: getCategoryBadge(getCategoryName(doc)).bg,
                    color: getCategoryBadge(getCategoryName(doc)).text,
                    border: '1px solid ' + getCategoryBadge(getCategoryName(doc)).text + '33',
                  }"
                >
                  <span
                    class="dot"
                    :style="{ background: getCategoryBadge(getCategoryName(doc)).dot }"
                  ></span>
                  {{ getCategoryName(doc) }}
                </span>
              </td>

              <!-- PEMILIK -->
              <td class="muted text-xs">{{ getOwnerName(doc) }}</td>

              <!-- TANGGAL -->
              <td><span class="num muted text-xs">{{ doc.date }}</span></td>

              <!-- UKURAN -->
              <td><span class="num">{{ store.fmtSize(doc.latest_version?.size_bytes || doc.size) }}</span></td>

              <!-- VERSI -->
              <td><span class="num">v{{ doc.latest_version?.version_number || 1 }}</span></td>

              <!-- LEVEL ANDA -->
              <td>
                <span
                  class="pill"
                  :style="{
                    background: 'transparent',
                    color: getUserLevel(doc).color,
                    border: 'none',
                    padding: '0',
                  }"
                >
                  <span
                    class="dot"
                    :style="{ background: getUserLevel(doc).dot }"
                  ></span>
                  {{ getUserLevel(doc).label }}
                </span>
              </td>

              <!-- AKSI -->
              <td style="text-align: right" @click.stop>
                <div class="flex items-center justify-end gap-1">
                  <!-- Active Tab Actions -->
                  <template v-if="activeTab === 'aktif'">
                    <!-- Unduh Dokumen -->
                    <button
                      type="button"
                      class="iconbtn"
                      title="Unduh dokumen"
                      @click="handleDownload(doc)"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </button>

                    <!-- Pindahkan Folder -->
                    <button
                      v-if="canModify(doc)"
                      type="button"
                      class="iconbtn"
                      title="Pindahkan ke folder lain"
                      @click="openMoveModal(doc)"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 3h6v6"></path>
                        <path d="M10 14L21 3"></path>
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      </svg>
                    </button>

                    <!-- Pindahkan ke Tempat Sampah -->
                    <button
                      v-if="canModify(doc)"
                      type="button"
                      class="iconbtn hover:text-red-400"
                      title="Pindahkan ke tempat sampah"
                      @click="handleTrash(doc)"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </template>

                  <!-- Trash Tab Actions -->
                  <template v-else>
                    <button
                      v-if="canModify(doc)"
                      type="button"
                      class="iconbtn hover:text-green-400"
                      title="Pulihkan dokumen"
                      @click="handleRestore(doc)"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="1 4 1 10 7 10"></polyline>
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                      </svg>
                    </button>
                    <button
                      v-if="canModify(doc)"
                      type="button"
                      class="iconbtn hover:text-red-400"
                      title="Hapus permanen"
                      @click="handlePurge(doc)"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Numeric Pagination for Documents -->
      <div v-if="docTotalRecords > rows" class="border-t border-[var(--border)] p-2 flex justify-center">
        <Paginator
          v-model:first="docFirst"
          :rows="rows"
          :totalRecords="docTotalRecords"
          :alwaysShow="true"
          @page="onDocPageChange"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
        />
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- SCRIM & DETAIL DRAWER                                   -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <div class="scrim" :class="{ open: isDrawerOpen }" @click="closeDrawer"></div>
    <div class="drawer" :class="{ open: isDrawerOpen }">
      <template v-if="selectedDoc">
        <div class="drawer-head">
          <div class="flex flex-col gap-1 pr-4">
            <h3 class="font-bold text-sm leading-snug">{{ selectedDoc.name }}</h3>
            <div class="flex items-center gap-2">
              <span
                class="pill"
                :style="{
                  background: getCategoryBadge(getCategoryName(selectedDoc)).bg,
                  color: getCategoryBadge(getCategoryName(selectedDoc)).text,
                  border: '1px solid ' + getCategoryBadge(getCategoryName(selectedDoc)).text + '33',
                }"
              >
                <span
                  class="dot"
                  :style="{ background: getCategoryBadge(getCategoryName(selectedDoc)).dot }"
                ></span>
                {{ getCategoryName(selectedDoc) }}
              </span>
              <span class="text-xs text-text-muted">
                Folder: {{ getFolderName(selectedDoc.folderId || selectedDoc.folder_id) }}
              </span>
            </div>
          </div>
          <button class="iconbtn" @click="closeDrawer" title="Tutup">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="drawer-body">
          <!-- Information Grid -->
          <div>
            <div class="section-title">Informasi Dokumen</div>
            <div class="field-grid">
              <div class="field">
                <span class="k">Ukuran File</span>
                <span class="v num">{{ store.fmtSize(selectedDoc.size) }}</span>
              </div>
              <div class="field">
                <span class="k">Versi Aktif</span>
                <span class="v num">v{{ getCurrentVersion(selectedDoc)?.v || 1 }}</span>
              </div>
              <div class="field">
                <span class="k">Pemilik</span>
                <span class="v">{{ getOwnerName(selectedDoc) }}</span>
              </div>
              <div class="field">
                <span class="k">Tanggal</span>
                <span class="v num text-xs">{{ selectedDoc.date }}</span>
              </div>
            </div>
          </div>

          <!-- Tags -->
          <div v-if="selectedDoc.tags && selectedDoc.tags.length">
            <div class="section-title">Tags</div>
            <div class="taglist">
              <span v-for="tag in selectedDoc.tags" :key="tag.id" class="tag">
                #{{ typeof tag === 'string' ? tag : tag.name }}
              </span>
            </div>
          </div>

          <!-- Version History -->
          <div>
            <div class="section-title">
              Riwayat Versi ({{ selectedDoc.versions?.length || 1 }})
            </div>
            <div class="flex flex-col">
              <div
                v-for="(ver, idx) in (selectedDoc.versions || [getCurrentVersion(selectedDoc)])"
                :key="idx"
                class="vrow"
                :class="{ current: idx === (selectedDoc.versions?.length || 1) - 1 }"
              >
                <div class="vnum">v{{ ver.version_number ?? (ver as any).v ?? 1 }}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-xs">{{ ver.uploader?.name ?? (ver as any).uploader ?? 'Admin' }}</span>
                    <span class="num text-[11px] text-text-muted">{{ store.fmtSize(ver.size_bytes ?? (ver as any).size) }}</span>
                    <span
                      v-if="idx === (selectedDoc.versions?.length || 1) - 1"
                      class="text-[10px] bg-accent-soft text-accent px-1.5 py-0.5 rounded font-bold"
                    >
                      AKTIF
                    </span>
                  </div>
                  <div v-if="ver.note" class="text-[11.5px] text-text-muted truncate">"{{ ver.note }}"</div>
                  <code v-if="ver.checksum" class="text-[10px] text-muted block mt-0.5 font-mono">
                    SHA: {{ ver.checksum.substring(0, 16) }}…
                  </code>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons in Drawer -->
          <div class="btnrow pt-3 border-t border-border mt-auto flex flex-wrap gap-2">
            <button class="btn primary flex-1 justify-center" @click="handleDownload(selectedDoc)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Unduh File
            </button>

            <!-- Move folder button in drawer -->
            <button
              v-if="!isDocTrashed(selectedDoc) && canModify(selectedDoc)"
              class="btn ghost sm"
              @click="openMoveModal(selectedDoc)"
            >
              Pindah Folder
            </button>

            <!-- Upload new version button (when active) -->
            <button
              v-if="!isDocTrashed(selectedDoc)"
              class="btn ghost sm"
              @click="openVersionModal(selectedDoc)"
            >
              + Versi Baru
            </button>

            <!-- Trash or Restore -->
            <button
              v-if="!isDocTrashed(selectedDoc) && canModify(selectedDoc)"
              class="btn danger sm"
              @click="handleTrash(selectedDoc)"
            >
              Pindahkan ke Sampah
            </button>
            <button
              v-else-if="canModify(selectedDoc)"
              class="btn ghost sm"
              style="color: var(--success); font-weight: 600"
              @click="handleRestore(selectedDoc)"
            >
              Pulihkan
            </button>
            <button
              v-if="isDocTrashed(selectedDoc) && canModify(selectedDoc)"
              class="btn danger sm"
              @click="handlePurge(selectedDoc)"
            >
              Hapus Permanen
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- MODAL: PINDAHKAN DOKUMEN KE FOLDER LAIN                 -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <Dialog
      v-model:visible="isMoveModalOpen"
      header="Pindahkan Dokumen"
      modal
      :style="{ width: '480px' }"
    >
      <div class="flex flex-col gap-3 py-2">
        <div class="p-2.5 rounded bg-surface-2 border border-border text-xs flex flex-col gap-1">
          <div>
            Dokumen: <strong class="text-text">{{ docToMove?.name }}</strong>
          </div>
          <span class="text-muted">Folder saat ini: {{ getFolderName(docToMove?.folder_id || docToMove?.folderId) }}</span>
        </div>

        <!-- Mini Breadcrumb Navigator inside Modal -->
        <div class="crumbs text-xs flex items-center gap-1 p-2 bg-surface rounded border border-border flex-wrap">
          <button
            type="button"
            class="text-xs hover:text-accent font-semibold"
            :class="{ 'font-bold text-accent': moveBreadcrumbs.length === 0 }"
            @click="moveBreadcrumbs = []"
          >
            📁 Root (Semua Folder)
          </button>
          <template v-for="(b, idx) in moveBreadcrumbs" :key="b.id">
            <span class="text-muted">›</span>
            <button
              type="button"
              class="text-xs hover:text-accent font-semibold"
              :class="{ 'font-bold text-accent': idx === moveBreadcrumbs.length - 1 }"
              @click="moveBreadcrumbs = moveBreadcrumbs.slice(0, idx + 1)"
            >
              {{ b.name }}
            </button>
          </template>
        </div>

        <div class="text-xs text-muted flex items-center justify-between">
          <span>Pilih folder tujuan di bawah ini:</span>
          <span v-if="moveTargetFolderId" class="text-accent font-bold">
            Terpilih: {{ getFolderName(moveTargetFolderId) }}
          </span>
        </div>

        <!-- List of Folders at current level -->
        <div class="folder-grid max-h-[240px] overflow-y-auto p-1 border border-border rounded">
          <div
            v-for="f in moveFoldersList"
            :key="f.id"
            class="folder-row flex items-center justify-between p-2 rounded hover:bg-surface-2 transition-colors cursor-pointer"
            :class="{ 'bg-accent-soft/30 border border-accent': moveTargetFolderId === f.id }"
            @click="moveTargetFolderId = f.id"
          >
            <div class="flex items-center gap-2 min-w-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted flex-shrink-0">
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/>
              </svg>
              <span class="text-xs font-semibold truncate">{{ f.name }}</span>
              <span v-if="f.unit?.name" class="text-[10px] text-muted">({{ f.unit.name }})</span>
            </div>

            <div class="flex items-center gap-2">
              <button
                v-if="hasSubfolders(f.id)"
                type="button"
                class="text-[11px] px-2 py-0.5 rounded border border-border hover:bg-surface text-muted hover:text-text"
                title="Buka sub-folder"
                @click.stop="enterMoveSubfolder(f)"
              >
                Subfolder ›
              </button>
              <span
                class="text-[11px] px-2 py-0.5 rounded font-bold"
                :class="moveTargetFolderId === f.id ? 'bg-accent text-accent-contrast' : 'bg-surface-2 text-muted'"
              >
                {{ moveTargetFolderId === f.id ? 'Terpilih' : 'Pilih' }}
              </span>
            </div>
          </div>

          <div v-if="moveFoldersList.length === 0" class="empty py-6 text-xs text-muted text-center">
            Tidak ada sub-folder di level ini.
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Batal" text size="small" @click="isMoveModalOpen = false" />
          <Button
            label="Pindahkan ke Sini"
            icon="pi pi-check"
            size="small"
            :loading="moveSubmitting"
            :disabled="!moveTargetFolderId || moveTargetFolderId === (docToMove?.folder_id || docToMove?.folderId)"
            @click="submitMoveDocument"
          />
        </div>
      </template>
    </Dialog>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- MODAL: TAMBAH FOLDER / SUB-FOLDER BARU                  -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <Dialog
      v-model:visible="isAddFolderModalOpen"
      :header="folderForm.parent_folder_id ? 'Buat Sub-Folder Baru' : 'Buat Folder Baru'"
      modal
      :style="{ width: '420px' }"
    >
      <div class="flex flex-col gap-3 py-2">
        <div v-if="folderForm.parent_folder_id" class="p-2 rounded bg-surface-2 border border-border text-xs text-muted">
          Folder Induk: <strong class="text-text">{{ folderForm.parent_folder_name }}</strong>
        </div>

        <label class="formlabel">
          <span>Nama Folder <span class="text-red-500">*</span></span>
          <InputText
            v-model="folderForm.name"
            :placeholder="folderForm.parent_folder_id ? 'Contoh: Berkas Kontrak 2026' : 'Contoh: Dokumen Legal 2026'"
            class="w-full"
            autofocus
          />
        </label>

        <label v-if="authStore.isAdmin && !folderForm.parent_folder_id" class="formlabel">
          <span>Unit Organisasi <span class="text-red-500">*</span></span>
          <Select
            v-model="folderForm.unit_id"
            :options="store.units"
            optionLabel="name"
            optionValue="id"
            placeholder="Pilih Unit"
            class="w-full"
          />
        </label>
        <div v-else class="text-xs text-muted">
          Folder otomatis ditautkan ke unit kerja akun Anda.
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Batal" text size="small" @click="isAddFolderModalOpen = false" />
          <Button
            label="Simpan Folder"
            icon="pi pi-check"
            size="small"
            :loading="folderSubmitting"
            @click="submitAddFolder"
          />
        </div>
      </template>
    </Dialog>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- MODAL: UNGGAH DOKUMEN BARU (Hanya di dalam folder)      -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <Dialog
      v-model:visible="isUploadModalOpen"
      header="Unggah Dokumen Baru"
      modal
      :style="{ width: '480px' }"
    >
      <div class="flex flex-col gap-3 py-2">
        <!-- Target folder display (No dropdown!) -->
        <div class="p-2.5 rounded bg-surface-2 border border-border text-xs flex items-center justify-between">
          <span>Folder Tujuan: <strong class="text-accent">{{ currentFolder?.name }}</strong></span>
          <span v-if="currentFolder?.unit?.name" class="text-muted">Unit: {{ currentFolder.unit.name }}</span>
        </div>

        <label class="formlabel">
          <span>Nama Dokumen <span class="text-red-500">*</span></span>
          <InputText v-model="newDoc.name" placeholder="Contoh: Kontrak Sewa Gedung 2026" class="w-full" />
        </label>

        <label class="formlabel">
          <span>Kategori <span class="text-red-500">*</span></span>
          <Select
            v-model="newDoc.category_id"
            :options="store.categories"
            optionLabel="name"
            optionValue="id"
            placeholder="Pilih Kategori"
            class="w-full"
          />
        </label>

        <label class="formlabel">
          <span>Tags (pisahkan dengan koma)</span>
          <InputText v-model="newDoc.tags" placeholder="kontrak, sewa, gedung" class="w-full" />
        </label>

        <div class="formlabel">
          <span>Pilih File Dokumen <span class="text-red-500">*</span></span>
          <input
            ref="fileInputRef"
            type="file"
            accept=".pdf,.docx,.xlsx,.doc,.xls,.png,.jpg,.jpeg"
            class="hidden"
            @change="handleFileChange"
          />

          <!-- Belum memilih file -->
          <div
            v-if="!uploadFile"
            class="dropzone-box"
            @click="triggerFileInput"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-accent mb-1">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div class="text-xs font-semibold text-text">Klik untuk memilih file dokumen</div>
            <div class="text-[11px] text-muted">PDF, DOCX, XLSX, JPG, PNG (Maks 25MB)</div>
          </div>

          <!-- File terpilih -->
          <div
            v-else
            class="file-selected-box"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="file-icon-badge">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div class="min-w-0">
                <div class="text-xs font-semibold truncate text-text" :title="uploadFile.name">
                  {{ uploadFile.name }}
                </div>
                <div class="text-[11px] text-muted">
                  {{ store.fmtSize(uploadFile.size) }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                class="btn ghost sm text-xs"
                @click="triggerFileInput"
              >
                Ganti
              </button>
              <button
                type="button"
                class="iconbtn sm hover:text-red-400"
                title="Hapus file"
                @click="clearUploadFile"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <label class="formlabel">
          <span>Catatan Versi Awal</span>
          <Textarea v-model="newDoc.note" rows="2" placeholder="Catatan versi awal (opsional)..." class="w-full" />
        </label>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Batal" text size="small" @click="isUploadModalOpen = false" />
          <Button
            label="Unggah"
            icon="pi pi-upload"
            size="small"
            :loading="submitting"
            @click="submitUploadDoc"
          />
        </div>
      </template>
    </Dialog>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- MODAL: UPLOAD VERSI BARU DOKUMEN                        -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <Dialog
      v-model:visible="isVersionModalOpen"
      header="Unggah Versi Baru"
      modal
      :style="{ width: '440px' }"
    >
      <div class="flex flex-col gap-3 py-2">
        <div class="p-2.5 rounded bg-surface-2 border border-border text-xs">
          Dokumen: <strong>{{ selectedDoc?.name }}</strong>
        </div>

        <div class="formlabel">
          <span>Pilih File Versi Baru <span class="text-red-500">*</span></span>
          <input
            ref="versionFileInputRef"
            type="file"
            accept=".pdf,.docx,.xlsx,.doc,.xls,.png,.jpg,.jpeg"
            class="hidden"
            @change="handleVersionFileChange"
          />

          <!-- Belum memilih file -->
          <div
            v-if="!versionFile"
            class="dropzone-box"
            @click="triggerVersionFileInput"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-accent mb-1">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div class="text-xs font-semibold text-text">Klik untuk memilih file versi baru</div>
            <div class="text-[11px] text-muted">PDF, DOCX, XLSX, JPG, PNG (Maks 25MB)</div>
          </div>

          <!-- File terpilih -->
          <div
            v-else
            class="file-selected-box"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="file-icon-badge">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div class="min-w-0">
                <div class="text-xs font-semibold truncate text-text" :title="versionFile.name">
                  {{ versionFile.name }}
                </div>
                <div class="text-[11px] text-muted">
                  {{ store.fmtSize(versionFile.size) }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                class="btn ghost sm text-xs"
                @click="triggerVersionFileInput"
              >
                Ganti
              </button>
              <button
                type="button"
                class="iconbtn sm hover:text-red-400"
                title="Hapus file"
                @click="clearVersionFile"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <label class="formlabel">
          <span>Catatan Perubahan</span>
          <Textarea
            v-model="versionNote"
            rows="2"
            placeholder="Contoh: Revisi pasal 4 mengenai masa sewa"
            class="w-full"
          />
        </label>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Batal" text size="small" @click="isVersionModalOpen = false" />
          <Button
            label="Upload Versi"
            icon="pi pi-check"
            size="small"
            :loading="submitting"
            @click="submitUploadVersion"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.panel {
  padding: 0;
}

.dropzone-box {
  border: 1.5px dashed var(--border);
  border-radius: 8px;
  padding: 20px 16px;
  background: var(--surface-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.dropzone-box:hover {
  border-color: var(--accent);
  background: var(--surface);
}

.file-selected-box {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.file-icon-badge {
  width: 34px;
  height: 34px;
  border-radius: 6px;
  background: var(--accent-soft, rgba(99, 102, 241, 0.12));
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
