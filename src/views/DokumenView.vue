<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import api from '../services/api'
import { useDocumentsStore, type Doc, type DocVersion } from '../stores/documents'
import { users as sampleUsers, groups as sampleGroups } from '../data/sampleData'
import { useAuthStore } from '../stores/auth'
import { useAppConfirm } from '../composables/useAppConfirm'

const store = useDocumentsStore()
const authStore = useAuthStore()
const { confirmDelete, confirmAction } = useAppConfirm()

// Role & Hierarchy based on Auth
const userRole = computed(() => (authStore.userRole || 'Admin').toLowerCase())
const userUnitName = computed(() => {
  const u = authStore.user?.unit
  if (!u) return ''
  if (typeof u === 'string') return u.toLowerCase().trim()
  return (u.name || '').toLowerCase().trim()
})

// Dynamic Units & Categories from Backend API
const dynamicUnits = ref<{ id: string; name: string }[]>([])
const dynamicCategories = ref<{ id?: string; name: string }[]>([])

async function fetchDynamicMetadata() {
  try {
    const [unitsRes, catRes] = await Promise.allSettled([
      api.get('/v1/units'),
      api.get('/v1/categories'),
    ])
    if (unitsRes.status === 'fulfilled' && unitsRes.value.data?.data) {
      dynamicUnits.value = unitsRes.value.data.data
    }
    if (catRes.status === 'fulfilled' && catRes.value.data?.data) {
      dynamicCategories.value = catRes.value.data.data
    }
  } catch {
    // fallback
  }
}

onMounted(() => {
  fetchDynamicMetadata()
})

const availableUnitNames = computed(() => {
  const defaults = ['Kontrak', 'Keuangan', 'SDM', 'Legal', 'Korespondensi']
  const fromApi = dynamicUnits.value.map(u => u.name)
  const combined = Array.from(new Set([...fromApi, ...defaults]))
  return combined
})

const availableCategoryNames = computed(() => {
  const defaults = ['Kontrak', 'Keuangan', 'SDM', 'Legal', 'Korespondensi']
  const fromApi = dynamicCategories.value.map(c => c.name)
  const combined = Array.from(new Set([...fromApi, ...defaults]))
  return combined
})

// Check if user can access a given folder
function canAccessFolder(f: { id: string; name: string; unitId: string; restricted?: boolean }): boolean {
  if (authStore.isAdmin || userRole.value === 'admin') {
    return true
  }

  const fUnit = (f.unitId || f.name || '').toLowerCase().trim()

  // Pengelola: hanya bisa akses folder unit terkait
  if (userRole.value === 'pengelola') {
    if (!userUnitName.value) return true
    return fUnit === userUnitName.value
  }

  // Pengguna: default dapat akses folder unit terkait
  if (userRole.value === 'pengguna' || userRole.value === 'user') {
    if (!userUnitName.value) return true
    return fUnit === userUnitName.value
  }

  return true
}

function selectFolder(f: { id: string; name: string; unitId: string; restricted?: boolean }) {
  if (canAccessFolder(f)) {
    currentFolderId.value = f.id
  }
}

// Navigation & Tab states
const currentFolderId = ref<string | null>(null) // null = Root (Daftar Folder)
const activeTab = ref<'aktif' | 'trash'>('aktif')

// Detail Drawer state
const selectedDoc = ref<Doc | null>(null)
const isDrawerOpen = ref(false)

// Modals state
const isUploadModalOpen = ref(false)
const isVersionModalOpen = ref(false)
const isFolderModalOpen = ref(false)
const isPermModalOpen = ref(false)
const permTargetType = ref<'folder' | 'doc'>('folder')
const selectedPermDoc = ref<Doc | null>(null)

// Form states
const newDoc = ref({
  name: '',
  folderId: 'f1',
  category: 'Kontrak',
  tags: '',
  fileSize: 1024,
  note: 'Unggahan awal',
})

const newVersion = ref({
  note: '',
  fileSize: 2048,
})

const newFolder = ref({
  name: '',
  unitId: 'Kontrak',
  restricted: false,
})

const permForm = ref<{
  subjectType: 'user' | 'group'
  subjectId: string
  level: 'view' | 'edit' | 'manage'
}>({
  subjectType: 'user',
  subjectId: '',
  level: 'view',
})

// Current folder entity
const currentFolder = computed(() => {
  if (!currentFolderId.value) return null
  return store.folders.find(f => f.id === currentFolderId.value) || store.folders[0] || null
})

// User access level inside current folder
const userAccessLevel = computed<'Kelola' | 'Edit' | 'Unduh' | 'Lihat'>(() => {
  if (authStore.isAdmin || userRole.value === 'admin') {
    return 'Kelola'
  }
  if (userRole.value === 'pengelola') {
    if (!currentFolder.value) return 'Kelola'
    const fUnit = (currentFolder.value.unitId || currentFolder.value.name || '').toLowerCase().trim()
    if (fUnit === userUnitName.value) {
      return 'Kelola'
    }
    return 'Lihat'
  }
  if (userRole.value === 'pengguna' || userRole.value === 'user') {
    return 'Edit'
  }
  return 'Lihat'
})

const canManageAccess = computed(() => {
  return userAccessLevel.value === 'Kelola'
})

// Document counts per folder
function getDocCountInFolder(folderId: string) {
  return store.activeDocs.filter(d => d.folderId === folderId).length
}

// Filtered documents when inside a folder or in trash
const docsInFolder = computed(() => {
  if (activeTab.value === 'trash') {
    return store.trashedDocs
  }
  if (currentFolderId.value) {
    return store.activeDocs.filter(d => d.folderId === currentFolderId.value)
  }
  return []
})

// Permissions list for current context
const currentPermissions = computed(() => {
  const fId = permTargetType.value === 'doc'
    ? selectedPermDoc.value?.folderId
    : (currentFolderId.value || currentFolder.value?.id)

  if (!fId) return []
  return (store.folderPermissions || []).filter(p => p && p.folderId === fId)
})

// Users available for permission grant (active users with role 'Pengguna')
const availableUsers = computed(() => {
  try {
    const s = localStorage.getItem('doksli-master-users')
    if (s) {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const activeUsers = parsed.filter((u: any) => u.status === 'active' && u.role === 'Pengguna')
        if (activeUsers.length > 0) return activeUsers
      }
    }
  } catch {}
  return sampleUsers.filter(u => u.status === 'active' && u.role === 'Pengguna')
})

// Groups available for permission grant
const availableGroups = computed(() => {
  try {
    const s = localStorage.getItem('doksli-master-groups')
    if (s) {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return sampleGroups
})

// Subject options computed based on selected type
const subjectOptions = computed(() => {
  if (permForm.value.subjectType === 'user') {
    const list = availableUsers.value || []
    if (list.length === 0) {
      return [{ id: 'u5', label: 'Nurhasan (unit Korespondensi)', name: 'Nurhasan' }]
    }
    return list.map(u => ({
      id: u.id,
      label: `${u.name} (unit ${u.unit || '-'})`,
      name: u.name,
    }))
  } else {
    const list = availableGroups.value || []
    if (list.length === 0) {
      return [{ id: 'g1', label: 'Tim Legal (2 anggota)', name: 'Tim Legal' }]
    }
    return list.map(g => ({
      id: g.id,
      label: `${g.name} (${g.memberIds?.length || 0} anggota)`,
      name: g.name,
    }))
  }
})

function onSubjectTypeChange() {
  permForm.value.subjectId = subjectOptions.value[0]?.id || ''
  if (permForm.value.subjectType === 'user' && permForm.value.level === 'manage') {
    permForm.value.level = 'edit'
  }
}

function getSubjectDisplayName(p: any): string {
  if (p && p.subjectName) return p.subjectName
  if (p && p.subjectType === 'user') {
    const u = availableUsers.value.find(x => x.id === p.subjectId) || sampleUsers.find(x => x.id === p.subjectId)
    return u ? `${u.name} (unit ${u.unit || '-'})` : p.subjectId
  }
  if (p && p.subjectType === 'group') {
    const g = availableGroups.value.find(x => x.id === p.subjectId) || sampleGroups.find(x => x.id === p.subjectId)
    return g ? g.name : p.subjectId
  }
  return p ? (p.subjectId || '-') : '-'
}

function getGranterName(grantedBy: any): string {
  if (!grantedBy) return 'Admin'
  const u = sampleUsers.find(x => x.id === grantedBy)
  return u ? u.name : String(grantedBy)
}

// Current document version helpers
function getCurrentVersion(doc: Doc): DocVersion | undefined {
  if (!doc.versions || doc.versions.length === 0) return undefined
  return doc.versions[doc.versions.length - 1]
}

function getFolderName(folderId: string): string {
  const f = store.folders.find(x => x.id === folderId)
  return f ? f.name : folderId
}

// Drawer helpers
function openDocDetail(doc: Doc) {
  selectedDoc.value = doc
  isDrawerOpen.value = true
}

function closeDrawer() {
  isDrawerOpen.value = false
}

// Related audit activities for selected document
const relatedActivities = computed(() => {
  if (!selectedDoc.value) return []
  const docName = selectedDoc.value.name.toLowerCase()
  return store.auditLog.filter(a => a.object.toLowerCase().includes(docName)).slice(0, 5)
})

// Action handlers
function handleDownload(doc: Doc) {
  store.downloadDocument(doc.id)
}

function handleTrash(doc: Doc) {
  confirmDelete({
    title: 'Pindahkan ke Tempat Sampah',
    message: `Apakah Anda yakin ingin memindahkan "${doc.name}" ke tempat sampah?`,
    submessage: 'Dokumen masih dapat dipulihkan dari tab Tempat Sampah.',
    confirmLabel: 'Pindahkan',
    onAccept: () => {
      store.trashDocument(doc.id)
      if (selectedDoc.value?.id === doc.id) {
        closeDrawer()
      }
    },
  })
}

function handleRestore(doc: Doc) {
  store.restoreDocument(doc.id)
}

function handlePurge(doc: Doc) {
  confirmDelete({
    title: 'Hapus Permanen Dokumen',
    message: `Apakah Anda yakin ingin menghapus permanen "${doc.name}"?`,
    submessage: 'Tindakan ini tidak dapat dibatalkan dan seluruh riwayat versi dokumen ini akan terhapus.',
    confirmLabel: 'Hapus Permanen',
    onAccept: () => {
      store.purgeDocument(doc.id)
      if (selectedDoc.value?.id === doc.id) {
        closeDrawer()
      }
    },
  })
}

function handleRevertVersion(vnum: number) {
  if (!selectedDoc.value) return
  confirmAction({
    title: 'Pulihkan Versi Dokumen',
    message: `Jadikan versi v${vnum} sebagai versi aktif baru?`,
    submessage: 'Versi aktif dokumen akan diperbarui dengan data dari versi terpilih.',
    confirmLabel: 'Jadikan Aktif',
    icon: 'clock',
    severity: 'info',
    onAccept: () => {
      store.revertVersion(selectedDoc.value!.id, vnum)
      const updated = store.documents.find(d => d.id === selectedDoc.value?.id)
      if (updated) selectedDoc.value = updated
    },
  })
}

// Modal Handlers
function openUploadModal() {
  newDoc.value = {
    name: '',
    folderId: currentFolderId.value || store.folders[0]?.id || 'f1',
    category: availableCategoryNames.value[0] || 'Kontrak',
    tags: '',
    fileSize: Math.floor(Math.random() * 2000) + 500,
    note: 'Unggahan awal dokumen',
  }
  isUploadModalOpen.value = true
}

function submitUploadDoc() {
  if (!newDoc.value.name.trim()) return alert('Nama dokumen wajib diisi')
  store.uploadDocument({
    name: newDoc.value.name.trim(),
    folderId: newDoc.value.folderId,
    category: newDoc.value.category,
    tags: newDoc.value.tags.split(',').map(t => t.trim()).filter(Boolean),
    size: newDoc.value.fileSize,
    note: newDoc.value.note.trim(),
  })
  isUploadModalOpen.value = false
}

function openVersionModal() {
  newVersion.value = {
    note: '',
    fileSize: Math.floor(Math.random() * 2500) + 800,
  }
  isVersionModalOpen.value = true
}

function submitUploadVersion() {
  if (!selectedDoc.value) return
  store.uploadVersion(selectedDoc.value.id, newVersion.value.note, newVersion.value.fileSize)
  const updated = store.documents.find(d => d.id === selectedDoc.value?.id)
  if (updated) selectedDoc.value = updated
  isVersionModalOpen.value = false
}

function openAddFolderModal() {
  let defaultUnit = availableUnitNames.value[0] || 'Kontrak'
  if (userUnitName.value) {
    const matched = availableUnitNames.value.find(u => u.toLowerCase() === userUnitName.value)
    if (matched) defaultUnit = matched
  }

  newFolder.value = {
    name: '',
    unitId: defaultUnit,
    restricted: false,
  }
  isFolderModalOpen.value = true
}

function submitAddFolder() {
  if (!newFolder.value.name.trim()) return alert('Nama folder wajib diisi')
  store.addFolder(
    newFolder.value.name.trim(),
    newFolder.value.unitId,
    newFolder.value.restricted
  )
  isFolderModalOpen.value = false
}

// Open Kelola Akses from Folder Header
function openFolderPermModal() {
  permTargetType.value = 'folder'
  selectedPermDoc.value = null
  isPermModalOpen.value = true
  permForm.value.subjectType = 'user'
  permForm.value.level = 'view'
  if (subjectOptions.value && subjectOptions.value.length > 0) {
    permForm.value.subjectId = subjectOptions.value[0].id
  }
}

// Open Kelola Akses from Doc Drawer
function openDocPermModal(doc: Doc) {
  permTargetType.value = 'doc'
  selectedPermDoc.value = doc
  isPermModalOpen.value = true
  permForm.value.subjectType = 'user'
  permForm.value.level = 'view'
  if (subjectOptions.value && subjectOptions.value.length > 0) {
    permForm.value.subjectId = subjectOptions.value[0].id
  }
}

function submitGrantPermission() {
  const folderId = permTargetType.value === 'doc'
    ? selectedPermDoc.value?.folderId
    : (currentFolderId.value || currentFolder.value?.id)

  if (!folderId) return
  if (!permForm.value.subjectId) return alert('Pilih subjek terlebih dahulu')

  if (permForm.value.subjectType === 'user' && permForm.value.level === 'manage') {
    return alert('Pengguna individual tidak boleh diberi level "Kelola"')
  }

  const selectedOpt = subjectOptions.value.find(o => o.id === permForm.value.subjectId)
  const subjectName = selectedOpt ? selectedOpt.name : permForm.value.subjectId

  store.grantFolderPermission({
    folderId,
    subjectType: permForm.value.subjectType,
    subjectId: permForm.value.subjectId,
    subjectName,
    level: permForm.value.level,
  })

  alert(`Akses berhasil diberikan ke ${subjectName}`)
}

function revokePerm(permId: string) {
  confirmDelete({
    title: 'Cabut Izin Akses',
    message: 'Apakah Anda yakin ingin mencabut izin akses folder ini?',
    submessage: 'Subjek yang bersangkutan tidak akan memiliki akses khusus lagi ke folder ini.',
    confirmLabel: 'Cabut Izin',
    onAccept: () => {
      store.revokeFolderPermission(permId)
    },
  })
}
</script>

<template>
  <div class="panel">
    <!-- Panel Head: Breadcrumbs / Title + Actions -->
    <div class="panel-head">
      <div class="crumbs">
        <button
          type="button"
          :class="{ current: !currentFolderId }"
          @click="currentFolderId = null"
        >
          Semua Folder
        </button>
        <template v-if="currentFolder">
          <span class="muted">/</span>
          <button type="button" class="current">{{ currentFolder.name }}</button>
        </template>
      </div>

      <div class="flex items-center gap-2">
        <!-- Jika di Semua Folder: tampilkan + Tambah Folder (Admin & Pengelola) -->
        <button
          v-if="!currentFolderId && (authStore.isAdmin || userRole === 'pengelola')"
          type="button"
          class="btn ghost sm"
          @click="openAddFolderModal"
        >
          + Tambah Folder
        </button>

        <!-- Jika di dalam Folder: berubah menjadi Kelola Akses dengan icon perisai bercentang (Khusus level Kelola) -->
        <button
          v-else-if="currentFolderId && canManageAccess"
          type="button"
          class="btn ghost sm flex items-center gap-1.5 cursor-pointer"
          style="cursor: pointer"
          @click.stop="openFolderPermModal"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          Kelola Akses
        </button>

        <button 
          v-if="currentFolderId"
          type="button" 
          class="btn sm primary" 
          @click="openUploadModal"
        >
          + Unggah Dokumen
        </button>
      </div>
    </div>

    <!-- Tabs: Aktif vs Tempat Sampah -->
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

    <!-- STATE 1: DAFTAR FOLDER (Saat di Semua Folder & Tab Aktif) -->
    <div
      v-if="!currentFolderId && activeTab === 'aktif'"
      class="p-2 folder-grid"
    >
      <button
        v-for="f in store.folders"
        :key="f.id"
        type="button"
        class="folder-row"
        :class="{
          'folder-disabled': !canAccessFolder(f),
          'cursor-pointer': canAccessFolder(f)
        }"
        :disabled="!canAccessFolder(f)"
        :title="!canAccessFolder(f) ? `Folder terkunci - Hanya untuk unit ${f.unitId}` : `Buka folder ${f.name}`"
        @click="selectFolder(f)"
      >
        <!-- Icon: Gembok jika disable, Folder jika bisa diakses -->
        <template v-if="!canAccessFolder(f)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-locked shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </template>
        <template v-else>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-accent shrink-0">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
        </template>

        <span class="font-medium text-sm flex-1 text-left flex items-center gap-2">
          <strong>{{ f.name }}</strong>
          <span class="text-text-muted"> &mdash; {{ f.unitId }}</span>
          <span v-if="!canAccessFolder(f)" class="pill sm text-[11px]" style="background:var(--locked-soft); color:var(--locked); padding: 1px 7px;">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline-block mr-0.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Terkunci
          </span>
        </span>
        <span class="count">{{ getDocCountInFolder(f.id) }} dokumen</span>
      </button>
    </div>

    <!-- STATE 2: TABEL DOKUMEN (Saat berada di dalam Folder atau Tab Tempat Sampah) -->
    <div v-else class="table-scroll">
      <table>
        <thead>
          <tr>
            <th style="min-width: 250px">NAMA</th>
            <th>KATEGORI</th>
            <th v-if="activeTab === 'trash'">FOLDER</th>
            <th>PEMILIK</th>
            <th>TANGGAL</th>
            <th>UKURAN</th>
            <th>VERSI</th>
            <th>LEVEL ANDA</th>
            <th style="text-align: right; width: 80px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="docsInFolder.length === 0">
            <td :colspan="activeTab === 'trash' ? 9 : 8">
              <div class="empty">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <div>{{ activeTab === 'aktif' ? 'Folder ini masih kosong.' : 'Tempat sampah kosong.' }}</div>
              </div>
            </td>
          </tr>

          <tr
            v-for="doc in docsInFolder"
            :key="doc.id"
            class="clickable"
            @click="openDocDetail(doc)"
          >
            <!-- 1. NAMA -->
            <td>
              <div class="docname">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/>
                </svg>
                <span class="truncate font-semibold hover:underline" :title="doc.name">{{ doc.name }}</span>
              </div>
            </td>

            <!-- 2. KATEGORI -->
            <td>
              <span :class="'pill cat-' + doc.category">
                <span class="dot"></span>{{ doc.category }}
              </span>
            </td>

            <!-- (Trash only: FOLDER) -->
            <td v-if="activeTab === 'trash'" class="muted text-xs">
              {{ getFolderName(doc.folderId) }}
            </td>

            <!-- 3. PEMILIK -->
            <td class="muted text-xs">{{ doc.owner }}</td>

            <!-- 4. TANGGAL -->
            <td><span class="num muted text-xs">{{ doc.date }}</span></td>

            <!-- 5. UKURAN -->
            <td><span class="num text-xs">{{ store.fmtSize(doc.size) }}</span></td>

            <!-- 6. VERSI -->
            <td><span class="num text-xs">v{{ getCurrentVersion(doc)?.v || 1 }}</span></td>

            <!-- 7. LEVEL ANDA -->
            <td>
              <span 
                class="pill"
                :class="{
                  'pill-kelola': userAccessLevel === 'Kelola',
                  'pill-edit': userAccessLevel === 'Edit',
                  'pill-unduh': userAccessLevel === 'Unduh',
                  'pill-lihat': userAccessLevel === 'Lihat',
                }"
              >
                <span class="dot"></span>{{ userAccessLevel }}
              </span>
            </td>

            <!-- 8. AKSI -->
            <td style="text-align: right" @click.stop>
              <div class="flex items-center justify-end gap-1">
                <!-- Active Doc Actions -->
                <template v-if="activeTab === 'aktif'">
                  <button
                    type="button"
                    class="iconbtn"
                    title="Unduh dokumen"
                    @click="handleDownload(doc)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </button>
                  <button
                    v-if="userAccessLevel === 'Kelola'"
                    type="button"
                    class="iconbtn"
                    title="Pindahkan ke tempat sampah"
                    @click="handleTrash(doc)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-danger">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </template>

                <!-- Trashed Doc Actions -->
                <template v-else>
                  <button
                    type="button"
                    class="btn sm"
                    title="Pulihkan dokumen"
                    @click="handleRestore(doc)"
                  >
                    Pulihkan
                  </button>
                  <button
                    v-if="userAccessLevel === 'Kelola'"
                    type="button"
                    class="btn sm danger"
                    title="Hapus permanen"
                    @click="handlePurge(doc)"
                  >
                    Hapus
                  </button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Scrim overlay for Drawer -->
    <div
      class="scrim"
      :class="{ open: isDrawerOpen }"
      @click="closeDrawer"
    ></div>

    <!-- Detail Drawer -->
    <div
      class="drawer"
      :class="{ open: isDrawerOpen }"
    >
      <template v-if="selectedDoc">
        <div class="drawer-head">
          <div class="flex flex-col gap-1 pr-4">
            <h3 class="font-bold text-sm leading-snug">{{ selectedDoc.name }}</h3>
            <div class="flex items-center gap-2">
              <span :class="'pill cat-' + selectedDoc.category">
                <span class="dot"></span>{{ selectedDoc.category }}
              </span>
              <span class="text-xs text-text-muted">Folder: {{ getFolderName(selectedDoc.folderId) }}</span>
            </div>
          </div>
          <button type="button" class="iconbtn" @click="closeDrawer" title="Tutup">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="drawer-body">
          <!-- Metadata Grid -->
          <div>
            <div class="section-title">Informasi Dokumen</div>
            <div class="field-grid">
              <div class="field">
                <span class="k">Ukuran File</span>
                <span class="v num">{{ store.fmtSize(selectedDoc.size) }}</span>
              </div>
              <div class="field">
                <span class="k">Versi Saat Ini</span>
                <span class="v num">v{{ getCurrentVersion(selectedDoc)?.v || 1 }}</span>
              </div>
              <div class="field">
                <span class="k">Pemilik</span>
                <span class="v">{{ selectedDoc.owner }}</span>
              </div>
              <div class="field">
                <span class="k">Terakhir Diubah</span>
                <span class="v num text-xs">{{ selectedDoc.date }}</span>
              </div>
            </div>
            <div v-if="selectedDoc.tags && selectedDoc.tags.length" class="mt-3">
              <span class="k" style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600">Tags</span>
              <div class="taglist mt-1">
                <span v-for="tag in selectedDoc.tags" :key="tag" class="tag">#{{ tag }}</span>
              </div>
            </div>
          </div>

          <!-- Version History -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="section-title mb-0">Riwayat Versi ({{ selectedDoc.versions?.length || 1 }})</div>
              <button
                v-if="!selectedDoc.deletedAt"
                type="button"
                class="btn sm"
                style="font-size: 11.5px; padding: 3px 8px"
                @click="openVersionModal"
              >
                + Versi Baru
              </button>
            </div>

            <div class="flex flex-col">
              <div
                v-for="(ver, idx) in selectedDoc.versions"
                :key="ver.v"
                class="vrow"
                :class="{ current: idx === selectedDoc.versions.length - 1 }"
              >
                <div class="vnum">v{{ ver.v }}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-xs">{{ ver.uploader }}</span>
                    <span class="num text-[11px] text-text-muted">{{ store.fmtSize(ver.size) }}</span>
                    <span v-if="idx === selectedDoc.versions.length - 1" class="text-[10px] bg-accent-soft text-accent px-1.5 py-0.5 rounded font-bold">
                      AKTIF
                    </span>
                  </div>
                  <div class="text-[11.5px] text-text-muted truncate">{{ ver.note }}</div>
                  <div class="num text-[10.5px] text-text-muted">{{ ver.date }}</div>
                </div>

                <!-- Revert Button if not active version -->
                <button
                  v-if="idx !== selectedDoc.versions.length - 1 && !selectedDoc.deletedAt"
                  type="button"
                  class="btn sm ghost"
                  style="font-size: 11px; padding: 2px 6px; color: var(--accent)"
                  title="Jadikan versi aktif"
                  @click="handleRevertVersion(ver.v)"
                >
                  Jadikan aktif
                </button>
              </div>
            </div>
          </div>

          <!-- Related Activity Log -->
          <div>
            <div class="section-title">Aktivitas Terkait Dokumen</div>
            <div v-if="relatedActivities.length === 0" class="text-xs text-text-muted italic py-1">
              Belum ada riwayat aktivitas khusus dokumen ini.
            </div>
            <div v-else class="flex flex-col">
              <div
                v-for="act in relatedActivities"
                :key="act.id"
                class="actrow"
              >
                <span class="t">{{ act.time }}</span>
                <div class="flex-1 text-xs">
                  <strong>{{ act.user }}</strong>: {{ act.action }}
                </div>
              </div>
            </div>
          </div>

          <!-- Drawer Action Footer -->
          <div class="btnrow pt-3 border-t border-border mt-auto">
            <button type="button" class="btn primary flex-1 justify-center" @click="handleDownload(selectedDoc)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Unduh File
            </button>
            <button
              v-if="!selectedDoc.deletedAt && userAccessLevel === 'Kelola'"
              type="button"
              class="btn flex items-center gap-1.5 cursor-pointer"
              title="Kelola akses dokumen ini"
              @click="openDocPermModal(selectedDoc)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              Kelola Akses
            </button>
            <button
              v-if="!selectedDoc.deletedAt && userAccessLevel === 'Kelola'"
              type="button"
              class="btn danger"
              @click="handleTrash(selectedDoc)"
              title="Pindahkan ke tempat sampah"
            >
              Hapus
            </button>
            <button
              v-else
              type="button"
              class="btn"
              @click="handleRestore(selectedDoc)"
            >
              Pulihkan
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- PrimeVue Dialogs -->
    <!-- Modal: Kelola Akses Folder & Dokumen -->
    <Dialog
      v-model:visible="isPermModalOpen"
      modal
      :header="`Kelola Akses — ${permTargetType === 'doc' ? selectedPermDoc?.name : (currentFolder?.name || 'Folder')}`"
      :style="{ width: '560px' }"
    >
      <div class="flex flex-col gap-4">
        <!-- Hint if Doc override -->
        <p v-if="permTargetType === 'doc'" class="muted text-xs leading-relaxed -mt-1 mb-0">
          Dokumen ini mewarisi akses folder <strong>{{ getFolderName(selectedPermDoc?.folderId || '') }}</strong>. Pengecualian di tingkat dokumen akan menimpa (*override*) akses folder, khusus untuk dokumen ini.
        </p>

        <!-- Akses Bawaan -->
        <div>
          <div class="section-title">Akses Bawaan (Otomatis, Tidak Tersimpan)</div>
          <ul class="text-xs text-text-muted space-y-1.5 pl-4 list-disc mt-1">
            <li>
              Admin &mdash; selalu
              <span class="pill text-[11px] font-semibold" style="color:var(--danger); background:var(--surface-2)">
                <span class="dot" style="background:var(--danger)"></span>Kelola
              </span>
            </li>
            <li>
              Pengelola unit <strong>{{ currentFolder?.unitId || getFolderName(selectedPermDoc?.folderId || '') }}</strong> &mdash;
              <span class="pill text-[11px] font-semibold" style="color:var(--danger); background:var(--surface-2)">
                <span class="dot" style="background:var(--danger)"></span>Kelola
              </span>
            </li>
            <li>
              Pengguna unit <strong>{{ currentFolder?.unitId || getFolderName(selectedPermDoc?.folderId || '') }}</strong> &mdash; default
              <span class="pill text-[11px] font-semibold" style="color:var(--warning); background:var(--surface-2)">
                <span class="dot" style="background:var(--warning)"></span>Edit
              </span>
            </li>
          </ul>
        </div>

        <!-- Pengecualian -->
        <div>
          <div class="section-title">
            Pengecualian {{ permTargetType === 'doc' ? 'Tingkat Dokumen' : '(Individual / Grup)' }}
          </div>
          <div v-if="currentPermissions.length === 0" class="empty py-3 border border-border rounded-lg mt-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-text-muted">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <div class="text-xs text-text-muted">Belum ada pengecualian izin yang diberikan.</div>
          </div>
          <div v-else class="table-scroll border border-border rounded-lg mt-1">
            <table>
              <thead>
                <tr>
                  <th>Subjek</th>
                  <th>Level</th>
                  <th>Diberikan Oleh</th>
                  <th>Tanggal</th>
                  <th style="width: 36px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in currentPermissions" :key="p.id">
                  <td class="text-xs">
                    <strong>{{ getSubjectDisplayName(p) }}</strong>
                    <span class="muted text-[11px] ml-1">({{ p.subjectType === 'user' ? 'Pengguna' : 'Grup' }})</span>
                  </td>
                  <td>
                    <span
                      class="pill text-[11px]"
                      :style="{
                        background: 'var(--surface-2)',
                        color: p.level === 'manage' ? 'var(--danger)' : p.level === 'edit' ? 'var(--warning)' : 'var(--accent)'
                      }"
                    >
                      <span
                        class="dot"
                        :style="{
                          background: p.level === 'manage' ? 'var(--danger)' : p.level === 'edit' ? 'var(--warning)' : 'var(--accent)'
                        }"
                      ></span>
                      {{ p.level === 'manage' ? 'Kelola' : p.level === 'edit' ? 'Edit' : 'Lihat' }}
                    </span>
                  </td>
                  <td class="muted text-xs">{{ getGranterName(p.grantedBy) }}</td>
                  <td class="num muted text-xs">{{ p.grantedAt || '-' }}</td>
                  <td>
                    <button type="button" class="iconbtn sm" style="width:24px; height:24px" title="Cabut akses" @click.stop="revokePerm(p.id)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tambah Pengecualian -->
        <div>
          <div class="section-title">Tambah Pengecualian</div>
          <div class="grid grid-cols-2 gap-3 mt-1.5">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold" style="color: var(--text-muted)">Tipe Subjek</label>
              <Select 
                v-model="permForm.subjectType" 
                :options="[
                  { label: 'Pengguna (Individual)', value: 'user' },
                  { label: 'Grup', value: 'group' }
                ]" 
                optionLabel="label" 
                optionValue="value" 
                fluid 
                size="small"
                @change="onSubjectTypeChange"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold" style="color: var(--text-muted)">
                Pilih {{ permForm.subjectType === 'user' ? 'Pengguna' : 'Grup' }}
              </label>
              <Select 
                v-model="permForm.subjectId" 
                :options="subjectOptions" 
                optionLabel="label" 
                optionValue="id" 
                fluid 
                size="small"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5 mt-3">
            <label class="text-xs font-semibold" style="color: var(--text-muted)">Level Akses</label>
            <Select 
              v-model="permForm.level" 
              :options="permForm.subjectType === 'group' ? [
                { label: 'Lihat (Hanya Baca)', value: 'view' },
                { label: 'Edit (Unggah & Perbarui Dokumen)', value: 'edit' },
                { label: 'Kelola (Akses Penuh)', value: 'manage' }
              ] : [
                { label: 'Lihat (Hanya Baca)', value: 'view' },
                { label: 'Edit (Unggah & Perbarui Dokumen)', value: 'edit' }
              ]" 
              optionLabel="label" 
              optionValue="value" 
              fluid 
              size="small"
            />
          </div>

          <p class="muted text-[11.5px] mt-2 mb-0 leading-relaxed">
            Pemberian akses ke Pengguna individual dibatasi maksimal "Edit" (tidak bisa "Kelola"); sebaliknya grup bisa diberi akses sampai "Kelola".
          </p>
        </div>
      </div>

      <template #footer>
        <Button label="Tutup" severity="secondary" text @click="isPermModalOpen = false" />
        <Button label="Berikan Akses" @click="submitGrantPermission">
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </template>
        </Button>
      </template>
    </Dialog>

    <!-- PrimeVue Dialog: Unggah Dokumen Baru -->
    <Dialog
      v-model:visible="isUploadModalOpen"
      modal
      header="Unggah Dokumen Baru"
      :style="{ width: '480px' }"
    >
      <div class="flex flex-col gap-3.5">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold" style="color: var(--text-muted)">Nama Dokumen</label>
          <InputText v-model="newDoc.name" placeholder="Contoh: Surat Keputusan Direksi No 12" fluid />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold" style="color: var(--text-muted)">Folder</label>
            <Select 
              v-model="newDoc.folderId" 
              :options="store.folders" 
              optionLabel="name" 
              optionValue="id" 
              fluid 
              size="small"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold" style="color: var(--text-muted)">Kategori</label>
            <Select 
              v-model="newDoc.category" 
              :options="availableCategoryNames" 
              fluid 
              size="small"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold" style="color: var(--text-muted)">Tags (pisahkan koma)</label>
          <InputText v-model="newDoc.tags" placeholder="sk, direksi, internal" fluid />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold" style="color: var(--text-muted)">Catatan Unggahan</label>
          <Textarea v-model="newDoc.note" placeholder="Catatan versi awal dokumen..." rows="3" fluid autoResize />
        </div>
      </div>

      <template #footer>
        <Button label="Batal" severity="secondary" text @click="isUploadModalOpen = false" />
        <Button label="Simpan & Unggah" @click="submitUploadDoc" />
      </template>
    </Dialog>

    <!-- PrimeVue Dialog: Unggah Versi Baru -->
    <Dialog
      v-model:visible="isVersionModalOpen"
      modal
      header="Unggah Versi Baru"
      :style="{ width: '460px' }"
    >
      <div class="flex flex-col gap-3">
        <p class="text-xs text-[var(--text-muted)] -mt-1 mb-0">{{ selectedDoc?.name }}</p>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold" style="color: var(--text-muted)">Catatan Perubahan (Changelog)</label>
          <Textarea v-model="newVersion.note" placeholder="Jelaskan perubahan pada versi ini..." rows="3" fluid autoResize />
        </div>

        <div class="text-xs text-[var(--text-muted)]">
          Versi berikutnya akan otomatis ditetapkan sebagai <strong>v{{ (selectedDoc?.versions?.length || 0) + 1 }}</strong> dan menjadi versi aktif.
        </div>
      </div>

      <template #footer>
        <Button label="Batal" severity="secondary" text @click="isVersionModalOpen = false" />
        <Button label="Unggah Versi Baru" @click="submitUploadVersion" />
      </template>
    </Dialog>

    <!-- PrimeVue Dialog: Tambah Folder Baru -->
    <Dialog
      v-model:visible="isFolderModalOpen"
      modal
      header="Tambah Folder Baru"
      :style="{ width: '440px' }"
    >
      <div class="flex flex-col gap-3.5">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold" style="color: var(--text-muted)">Nama Folder</label>
          <InputText v-model="newFolder.name" placeholder="Contoh: Operasional & Logistik" fluid />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold" style="color: var(--text-muted)">Unit Terkait</label>
          <Select 
            v-model="newFolder.unitId" 
            :options="availableUnitNames" 
            fluid 
            size="small"
          />
        </div>

        <div class="flex items-center gap-2 cursor-pointer pt-1" @click="newFolder.restricted = !newFolder.restricted">
          <Checkbox v-model="newFolder.restricted" :binary="true" />
          <span class="text-xs font-semibold text-[var(--text)]">Folder Akses Terbatas (Restricted)</span>
        </div>
      </div>

      <template #footer>
        <Button label="Batal" severity="secondary" text @click="isFolderModalOpen = false" />
        <Button label="Buat Folder" @click="submitAddFolder" />
      </template>
    </Dialog>

  </div>
</template>

<style scoped>
.folder-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
}
.folder-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: none;
  color: var(--text);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.folder-row:hover {
  background: var(--surface-2);
}
.folder-row .count {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.folder-row.folder-disabled {
  opacity: 0.55;
  cursor: not-allowed !important;
}
.folder-row.folder-disabled:hover {
  background: transparent !important;
}

/* Level Anda Pills */
.pill-kelola {
  background: var(--danger-soft);
  color: var(--danger);
}
.pill-kelola .dot {
  background: var(--danger);
}

.pill-edit {
  background: var(--warning-soft);
  color: var(--warning);
}
.pill-edit .dot {
  background: var(--warning);
}

.pill-unduh {
  background: var(--accent-soft);
  color: var(--accent);
}
.pill-unduh .dot {
  background: var(--accent);
}

.pill-lihat {
  background: var(--surface-2);
  color: var(--text-muted);
}
.pill-lihat .dot {
  background: var(--text-muted);
}
</style>
