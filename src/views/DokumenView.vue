<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import { useDocumentsStore, type Doc, type Folder } from '../stores/documents'
import { useAuthStore } from '../stores/auth'
import { useAppConfirm } from '../composables/useAppConfirm'

const store = useDocumentsStore()
const authStore = useAuthStore()
const { confirmDelete, confirmAction } = useAppConfirm()

// ─── Folder Navigation & Tab State ───
const currentFolder = ref<Folder | null>(null)
const activeTab = ref<'aktif' | 'trash'>('aktif')
const selectedDoc = ref<Doc | null>(null)
const isDrawerOpen = ref(false)

// ─── Add Folder State ───
const isAddFolderModalOpen = ref(false)
const folderForm = ref({
  name: '',
  unit_id: '',
})
const folderSubmitting = ref(false)

// ─── Upload Document State ───
const isUploadModalOpen = ref(false)
const newDoc = ref({
  name: '',
  folder_id: '',
  category_id: '',
  tags: '',
  note: 'Unggahan awal',
})
const uploadFile = ref<File | null>(null)
const submitting = ref(false)

// ─── Version Upload State ───
const isVersionModalOpen = ref(false)
const versionFile = ref<File | null>(null)
const versionNote = ref('')

// ─── Computed Permissions & Role ───
const userRole = computed(() => (authStore.userRole || 'Admin').toLowerCase())
const canAddFolder = computed(() => authStore.canManageFolder || authStore.isAdmin || userRole.value === 'pengelola')

const canModify = (doc: Doc) => {
  if (authStore.isAdmin || userRole.value === 'pengelola') return true
  return doc.owner_id === authStore.user?.id
}

// Documents filtered by current folder or all trashed
const folderDocs = computed(() => {
  if (!currentFolder.value) {
    if (activeTab.value === 'trash') {
      return store.trashedDocs
    }
    return []
  }
  const list = activeTab.value === 'trash' ? store.trashedDocs : store.activeDocs
  return list.filter(d => (d.folder_id || d.folderId) === currentFolder.value?.id)
})

function getFolderDocCount(folderId: string): number {
  return store.activeDocs.filter(d => (d.folder_id || d.folderId) === folderId).length
}

// ─── Lifecycle ───
onMounted(async () => {
  await Promise.allSettled([
    store.fetchDocuments(),
    store.fetchFolders(),
    store.fetchCategories(),
    store.fetchUnits(),
  ])
})

// ─── Folder Actions ───
function openFolder(folder: Folder) {
  currentFolder.value = folder
  activeTab.value = 'aktif'
}

function closeFolder() {
  currentFolder.value = null
}

function openAddFolderModal() {
  const defaultUnit = authStore.isAdmin
    ? (store.units[0]?.id || '')
    : (authStore.user?.unit_id || '')

  folderForm.value = {
    name: '',
    unit_id: defaultUnit,
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
    const payload: { name: string; unit_id?: string } = {
      name: folderForm.value.name.trim(),
    }
    if (folderForm.value.unit_id) {
      payload.unit_id = folderForm.value.unit_id
    }

    await store.createFolder(payload)
    isAddFolderModalOpen.value = false
  } catch (e: any) {
    alert(e.response?.data?.message || 'Gagal membuat folder')
  } finally {
    folderSubmitting.value = false
  }
}

// ─── Upload Document Actions ───
function openUploadModal() {
  newDoc.value = {
    name: '',
    folder_id: currentFolder.value?.id || store.folders[0]?.id || '',
    category_id: store.categories[0]?.id || '',
    tags: '',
    note: 'Unggahan awal',
  }
  uploadFile.value = null
  isUploadModalOpen.value = true
}

async function submitUploadDoc() {
  if (!newDoc.value.name.trim()) return alert('Nama dokumen wajib diisi')
  if (!newDoc.value.folder_id) return alert('Pilih folder terlebih dahulu')
  if (!newDoc.value.category_id) return alert('Pilih kategori terlebih dahulu')

  submitting.value = true
  try {
    await store.uploadDocument({
      name: newDoc.value.name.trim(),
      folder_id: newDoc.value.folder_id,
      category_id: newDoc.value.category_id,
      tags: newDoc.value.tags,
      file: uploadFile.value,
      note: newDoc.value.note,
    })
    isUploadModalOpen.value = false
    await store.fetchDocuments()
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

async function openDocDetail(doc: Doc) {
  const full = await store.fetchDocument(doc.id)
  selectedDoc.value = full || doc
  isDrawerOpen.value = true
}

function closeDrawer() {
  isDrawerOpen.value = false
}

function handleDownload(doc: Doc) {
  store.downloadDocument(doc.id)
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
    await store.fetchDocuments()
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

function getCategoryBadgeColor(catName: string) {
  const normalized = (catName || '').toLowerCase().trim()
  if (normalized.includes('kontrak')) return { bg: 'rgba(59, 130, 246, 0.18)', text: '#60a5fa', dot: '#3b82f6' }
  if (normalized.includes('keuangan')) return { bg: 'rgba(16, 185, 129, 0.18)', text: '#34d399', dot: '#10b981' }
  if (normalized.includes('proposal')) return { bg: 'rgba(245, 158, 11, 0.18)', text: '#fbbf24', dot: '#f59e0b' }
  if (normalized.includes('masuk')) return { bg: 'rgba(6, 182, 212, 0.18)', text: '#22d3ee', dot: '#06b6d4' }
  if (normalized.includes('keluar')) return { bg: 'rgba(168, 85, 247, 0.18)', text: '#c084fc', dot: '#a855f7' }
  if (normalized.includes('rapat') || normalized.includes('notulen')) return { bg: 'rgba(139, 92, 246, 0.18)', text: '#a78bfa', dot: '#8b5cf6' }
  if (normalized.includes('acara')) return { bg: 'rgba(20, 184, 166, 0.18)', text: '#2dd4bf', dot: '#14b8a6' }
  if (normalized.includes('sdm')) return { bg: 'rgba(234, 88, 12, 0.18)', text: '#fb923c', dot: '#ea580c' }
  if (normalized.includes('legal')) return { bg: 'rgba(239, 68, 68, 0.18)', text: '#f87171', dot: '#ef4444' }
  return { bg: 'rgba(148, 163, 184, 0.18)', text: '#cbd5e1', dot: '#94a3b8' }
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
      <div class="crumbs">
        <button
          type="button"
          :class="{ current: !currentFolder }"
          @click="closeFolder"
        >
          Semua Folder
        </button>
        <template v-if="currentFolder">
          <span>›</span>
          <button type="button" class="current font-bold">
            {{ currentFolder.name }}
            <span class="muted font-normal">(unit {{ currentFolder.unit?.name || currentFolder.name }})</span>
          </button>
        </template>
      </div>

      <div class="flex items-center gap-2">
        <!-- Tambah Folder (hanya saat di Semua Folder, untuk Admin/Pengelola) -->
        <button
          v-if="!currentFolder && canAddFolder"
          type="button"
          class="btn ghost sm"
          @click="openAddFolderModal"
        >
          + Tambah Folder
        </button>

        <!-- Kelola Akses / Kembali (saat berada di dalam folder) -->
        <button
          v-if="currentFolder"
          type="button"
          class="btn ghost sm"
          @click="closeFolder"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-1">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Semua Folder
        </button>

        <!-- Unggah Dokumen -->
        <button
          type="button"
          class="btn primary sm"
          @click="openUploadModal"
        >
          + Unggah Dokumen
        </button>
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
    <!-- VIEW 1: DAFTAR FOLDER (Saat currentFolder === null)     -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <div v-if="!currentFolder && activeTab === 'aktif'" class="panel-body p-2">
      <div v-if="store.loading && store.folders.length === 0" class="empty">
        <div>Memuat folder...</div>
      </div>

      <div v-else-if="store.folders.length === 0" class="empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="opacity-40 mb-1">
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/>
        </svg>
        <div>Belum ada folder yang dibuat.</div>
        <button v-if="canAddFolder" class="btn ghost sm mt-2" @click="openAddFolderModal">
          + Tambah Folder
        </button>
      </div>

      <!-- Clean list of folder rows matching screenshot 1 -->
      <div v-else class="folder-grid">
        <button
          v-for="folder in store.folders"
          :key="folder.id"
          type="button"
          class="folder-row"
          @click="openFolder(folder)"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-muted flex-shrink-0">
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/>
          </svg>
          <span class="text-sm font-medium">{{ folder.name }} — {{ folder.unit?.name || folder.name }}</span>
          <span class="count">{{ getFolderDocCount(folder.id) }} dokumen</span>
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- VIEW 2: DAFTAR DOKUMEN (Folder dipilih atau Tab Sampah) -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <div v-else class="table-scroll">
      <!-- Loading State -->
      <div v-if="store.loading" class="empty">
        <div>Memuat dokumen...</div>
      </div>

      <!-- Empty State -->
      <div v-else-if="folderDocs.length === 0" class="empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="opacity-40 mb-1">
          <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/>
        </svg>
        <div>
          {{ activeTab === 'aktif'
            ? (currentFolder ? `Belum ada dokumen di folder "${currentFolder.name}".` : 'Belum ada dokumen aktif.')
            : (currentFolder ? `Tempat sampah kosong untuk folder "${currentFolder.name}".` : 'Tempat sampah kosong.')
          }}
        </div>
        <button
          v-if="activeTab === 'aktif'"
          type="button"
          class="btn primary sm mt-2"
          @click="openUploadModal"
        >
          + Unggah Dokumen
        </button>
      </div>

      <!-- Clean Table matching Screenshot 2 & 3 -->
      <table v-else>
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
          <tr
            v-for="doc in folderDocs"
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
                  background: getCategoryBadgeColor(getCategoryName(doc)).bg,
                  color: getCategoryBadgeColor(getCategoryName(doc)).text,
                  border: '1px solid ' + getCategoryBadgeColor(getCategoryName(doc)).text + '33',
                }"
              >
                <span
                  class="dot"
                  :style="{ background: getCategoryBadgeColor(getCategoryName(doc)).dot }"
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
                <!-- If Active tab -->
                <template v-if="activeTab === 'aktif'">
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
                  <button
                    v-if="canModify(doc)"
                    type="button"
                    class="iconbtn"
                    title="Pindahkan ke tempat sampah"
                    @click="handleTrash(doc)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </template>

                <!-- If Trash tab -->
                <template v-else>
                  <button
                    v-if="canModify(doc)"
                    type="button"
                    class="iconbtn"
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
                    class="iconbtn"
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
                  background: getCategoryBadgeColor(getCategoryName(selectedDoc)).bg,
                  color: getCategoryBadgeColor(getCategoryName(selectedDoc)).text,
                  border: '1px solid ' + getCategoryBadgeColor(getCategoryName(selectedDoc)).text + '33',
                }"
              >
                <span
                  class="dot"
                  :style="{ background: getCategoryBadgeColor(getCategoryName(selectedDoc)).dot }"
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
          <div class="btnrow pt-3 border-t border-border mt-auto">
            <button class="btn primary flex-1 justify-center" @click="handleDownload(selectedDoc)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Unduh File
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
              class="btn danger"
              @click="handleTrash(selectedDoc)"
            >
              Pindahkan ke Sampah
            </button>
            <button
              v-else-if="canModify(selectedDoc)"
              class="btn ghost"
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
    <!-- MODAL: TAMBAH FOLDER BARU                               -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <Dialog
      v-model:visible="isAddFolderModalOpen"
      header="Buat Folder Baru"
      modal
      :style="{ width: '420px' }"
    >
      <div class="flex flex-col gap-3 py-2">
        <label class="formlabel">
          <span>Nama Folder <span class="text-red-500">*</span></span>
          <InputText
            v-model="folderForm.name"
            placeholder="Contoh: Dokumen Legal 2026"
            class="w-full"
            autofocus
          />
        </label>

        <label v-if="authStore.isAdmin" class="formlabel">
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
    <!-- MODAL: UNGGAH DOKUMEN BARU                              -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <Dialog
      v-model:visible="isUploadModalOpen"
      header="Unggah Dokumen Baru"
      modal
      :style="{ width: '480px' }"
    >
      <div class="flex flex-col gap-3 py-2">
        <label class="formlabel">
          <span>Nama Dokumen <span class="text-red-500">*</span></span>
          <InputText v-model="newDoc.name" placeholder="Contoh: Kontrak Sewa Gedung 2026" class="w-full" />
        </label>

        <label class="formlabel">
          <span>Folder <span class="text-red-500">*</span></span>
          <Select
            v-model="newDoc.folder_id"
            :options="store.folders"
            optionLabel="name"
            optionValue="id"
            placeholder="Pilih Folder"
            class="w-full"
          />
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

        <label class="formlabel">
          <span>Pilih File Dokumen</span>
          <input
            type="file"
            accept=".pdf,.docx,.xlsx,.doc,.xls,.png,.jpg,.jpeg"
            class="w-full p-2 border border-border rounded text-sm bg-surface-2"
            @change="handleFileChange"
          />
        </label>

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

        <label class="formlabel">
          <span>Pilih File Versi Baru <span class="text-red-500">*</span></span>
          <input
            type="file"
            accept=".pdf,.docx,.xlsx,.doc,.xls,.png,.jpg,.jpeg"
            class="w-full p-2 border border-border rounded text-sm bg-surface-2"
            @change="handleVersionFileChange"
          />
        </label>

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
</style>
