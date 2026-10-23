import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

export type DocVersion = {
  v: number
  date: string
  uploader: string
  size: number
  note: string
}

export type Doc = {
  id: string
  name: string
  folderId: string
  category: string
  owner: string
  date: string
  size: number
  tags: string[]
  versions: DocVersion[]
  deletedAt: string | null
}

export type Folder = {
  id: string
  name: string
  unitId: string
  restricted?: boolean
}

export type Audit = {
  id: string
  user: string
  action: string
  object: string
  ip: string
  time: string
}

export type FolderPermission = {
  id: string
  folderId: string
  subjectType: 'user' | 'group'
  subjectId: string
  subjectName: string
  level: 'view' | 'edit' | 'manage'
  grantedBy: string
  grantedAt: string
}

export const initialFolderPermissions: FolderPermission[] = [
  { id: 'fp1', folderId: 'f4', subjectType: 'user', subjectId: 'u5', subjectName: 'Anas (unit Keuangan)', level: 'view', grantedBy: 'Fadhil Maulana', grantedAt: '15 Sep 2026' },
  { id: 'fp2', folderId: 'f4', subjectType: 'group', subjectId: 'g2', subjectName: 'Tim Pengadaan Gabungan', level: 'view', grantedBy: 'Fadhil Maulana', grantedAt: '1 Okt 2026' },
]

export const initialFolders: Folder[] = [
  { id: 'f1', name: 'Kontrak', unitId: 'Kontrak', restricted: false },
  { id: 'f2', name: 'Keuangan', unitId: 'Keuangan', restricted: false },
  { id: 'f3', name: 'SDM', unitId: 'SDM', restricted: false },
  { id: 'f4', name: 'Legal', unitId: 'Legal', restricted: true },
  { id: 'f5', name: 'Korespondensi', unitId: 'Korespondensi', restricted: false },
]

export const initialDocuments: Doc[] = [
  {
    id: 'd1',
    name: 'Kontrak Sewa Gedung Cikarang 2026',
    folderId: 'f1',
    category: 'Kontrak',
    owner: 'Taufik Nugraha',
    date: '15 Jan 2026',
    size: 2450,
    tags: ['sewa', 'gedung'],
    versions: [
      { v: 1, date: '15 Jan 2026', uploader: 'Taufik Nugraha', size: 2450, note: 'Unggahan awal' }
    ],
    deletedAt: null
  },
  {
    id: 'd2',
    name: 'Perjanjian Kerja Sama Vendor Scanning',
    folderId: 'f1',
    category: 'Kontrak',
    owner: 'Dewi Larasati',
    date: '2 Nov 2025',
    size: 1120,
    tags: ['vendor', 'scanning'],
    versions: [
      { v: 1, date: '2 Nov 2025', uploader: 'Dewi Larasati', size: 1120, note: 'Unggahan awal' }
    ],
    deletedAt: null
  },
  {
    id: 'd3',
    name: 'Addendum Kontrak Pemasok ATK',
    folderId: 'f1',
    category: 'Kontrak',
    owner: 'Dewi Larasati',
    date: '20 Feb 2026',
    size: 612,
    tags: ['atk'],
    versions: [
      { v: 1, date: '20 Feb 2026', uploader: 'Dewi Larasati', size: 612, note: 'Unggahan awal' }
    ],
    deletedAt: null
  },
  {
    id: 'd4',
    name: 'Laporan Keuangan Kuartal I 2026',
    folderId: 'f2',
    category: 'Keuangan',
    owner: 'Anas',
    date: '5 Apr 2026',
    size: 3870,
    tags: ['laporan', 'kuartal'],
    versions: [
      { v: 1, date: '2 Apr 2026', uploader: 'Anas', size: 3600, note: 'Unggahan awal' },
      { v: 2, date: '4 Apr 2026', uploader: 'Anas', size: 3750, note: 'Revisi angka pajak' },
      { v: 3, date: '5 Apr 2026', uploader: 'Anas', size: 3870, note: 'Perbaikan format tabel' }
    ],
    deletedAt: null
  },
  {
    id: 'd5',
    name: 'Invoice Vendor Fumigasi Maret 2026',
    folderId: 'f2',
    category: 'Keuangan',
    owner: 'Anas',
    date: '10 Mar 2026',
    size: 412,
    tags: ['invoice'],
    versions: [
      { v: 1, date: '10 Mar 2026', uploader: 'Anas', size: 412, note: 'Unggahan awal' }
    ],
    deletedAt: null
  },
  {
    id: 'd6',
    name: 'Rekonsiliasi Bank Februari 2026',
    folderId: 'f2',
    category: 'Keuangan',
    owner: 'Nurhasan',
    date: '1 Mar 2026',
    size: 890,
    tags: ['rekonsiliasi'],
    versions: [
      { v: 1, date: '1 Mar 2026', uploader: 'Nurhasan', size: 890, note: 'Unggahan awal' }
    ],
    deletedAt: null
  },
  {
    id: 'd7',
    name: 'SK Pengangkatan Karyawan Batch 12',
    folderId: 'f3',
    category: 'SDM',
    owner: 'Clara Hutagalung',
    date: '8 Jan 2026',
    size: 1540,
    tags: ['sk', 'karyawan'],
    versions: [
      { v: 1, date: '8 Jan 2026', uploader: 'Clara Hutagalung', size: 1540, note: 'Unggahan awal' }
    ],
    deletedAt: null
  },
  {
    id: 'd8',
    name: 'Data Cuti Tahunan 2026',
    folderId: 'f3',
    category: 'SDM',
    owner: 'Clara Hutagalung',
    date: '14 Feb 2026',
    size: 305,
    tags: ['cuti'],
    versions: [
      { v: 1, date: '14 Feb 2026', uploader: 'Clara Hutagalung', size: 305, note: 'Unggahan awal' }
    ],
    deletedAt: null
  },
  {
    id: 'd9',
    name: 'Notulen Rapat Evaluasi Kinerja Q1',
    folderId: 'f3',
    category: 'SDM',
    owner: 'Anas',
    date: '12 Apr 2026',
    size: 480,
    tags: ['notulen', 'kinerja'],
    versions: [
      { v: 1, date: '12 Apr 2026', uploader: 'Anas', size: 480, note: 'Unggahan awal' }
    ],
    deletedAt: null
  },
  {
    id: 'd10',
    name: 'Somasi Sengketa Lahan Bekasi',
    folderId: 'f4',
    category: 'Legal',
    owner: 'Taufik Nugraha',
    date: '1 Des 2025',
    size: 2130,
    tags: ['somasi', 'sengketa'],
    versions: [
      { v: 1, date: '1 Des 2025', uploader: 'Taufik Nugraha', size: 2130, note: 'Unggahan awal' }
    ],
    deletedAt: null
  },
  {
    id: 'd11',
    name: 'Opini Hukum Akuisisi Anak Usaha',
    folderId: 'f4',
    category: 'Legal',
    owner: 'Taufik Nugraha',
    date: '22 Mar 2026',
    size: 4230,
    tags: ['opini-hukum'],
    versions: [
      { v: 1, date: '20 Mar 2026', uploader: 'Taufik Nugraha', size: 4000, note: 'Unggahan awal' },
      { v: 2, date: '22 Mar 2026', uploader: 'Taufik Nugraha', size: 4230, note: 'Tambahan lampiran due diligence' }
    ],
    deletedAt: null
  },
  {
    id: 'd12',
    name: 'Surat Masuk Dinas Perpustakaan Kearsipan',
    folderId: 'f5',
    category: 'Korespondensi',
    owner: 'Nurhasan',
    date: '28 Feb 2026',
    size: 210,
    tags: ['surat-masuk'],
    versions: [
      { v: 1, date: '28 Feb 2026', uploader: 'Nurhasan', size: 210, note: 'Unggahan awal' }
    ],
    deletedAt: null
  },
  {
    id: 'd13',
    name: 'Surat Keluar Konfirmasi Audit ANRI',
    folderId: 'f5',
    category: 'Korespondensi',
    owner: 'Nurhasan',
    date: '15 Mar 2026',
    size: 260,
    tags: ['surat-keluar', 'audit'],
    versions: [
      { v: 1, date: '15 Mar 2026', uploader: 'Nurhasan', size: 260, note: 'Unggahan awal' }
    ],
    deletedAt: null
  },
  {
    id: 'd14',
    name: 'Draft Lama Kontrak Vendor (dibatalkan)',
    folderId: 'f1',
    category: 'Kontrak',
    owner: 'Dewi Larasati',
    date: '3 Okt 2025',
    size: 540,
    tags: ['draft'],
    versions: [
      { v: 1, date: '3 Okt 2025', uploader: 'Dewi Larasati', size: 540, note: 'Unggahan awal' }
    ],
    deletedAt: '18 Sep 2026'
  }
]

export const initialAuditLog: Audit[] = [
  { id: 'a1', user: 'Clara Hutagalung', action: 'Lihat dokumen', object: 'Data Cuti Tahunan 2026', ip: '10.20.4.18', time: '21 Sep 2026, 08:01' },
  { id: 'a2', user: 'Nurhasan', action: 'Unduh dokumen', object: 'Surat Keluar Konfirmasi Audit ANRI', ip: '10.20.4.44', time: '21 Sep 2026, 07:35' },
  { id: 'a3', user: 'Fadhil Maulana', action: 'Masuk ke sistem', object: '—', ip: '10.20.4.11', time: '21 Sep 2026, 07:12' },
  { id: 'a4', user: 'Dewi Larasati', action: 'Pindahkan ke tempat sampah', object: 'Draft Lama Kontrak Vendor (dibatalkan)', ip: '10.20.4.22', time: '18 Sep 2026, 11:03' },
  { id: 'a5', user: 'Taufik Nugraha', action: 'Lihat dokumen', object: 'Somasi Sengketa Lahan Bekasi', ip: '10.20.4.15', time: '20 Sep 2026, 15:12' },
  { id: 'a6', user: 'Anas', action: 'Unggah versi baru', object: 'Laporan Keuangan Kuartal I 2026 v3', ip: '10.20.4.30', time: '20 Sep 2026, 14:47' },
  { id: 'a7', user: 'Anas', action: 'Unggah versi baru', object: 'Laporan Keuangan Kuartal I 2026 v2', ip: '10.20.4.30', time: '20 Sep 2026, 10:22' },
  { id: 'a8', user: 'Anas', action: 'Lihat dokumen', object: 'Laporan Keuangan Kuartal I 2026', ip: '10.20.4.30', time: '20 Sep 2026, 10:05' },
  { id: 'a9', user: 'Dewi Larasati', action: 'Unggah dokumen', object: 'Perjanjian Kerja Sama Vendor Scanning', ip: '10.20.4.22', time: '20 Sep 2026, 09:41' },
  { id: 'a10', user: 'Fadhil Maulana', action: 'Unggah dokumen', object: 'Kontrak Sewa Gedung Cikarang 2026', ip: '10.20.4.11', time: '20 Sep 2026, 08:14' },
  { id: 'a11', user: 'Fadhil Maulana', action: 'Masuk ke sistem', object: '—', ip: '10.20.4.11', time: '20 Sep 2026, 08:02' },
]

const DOCS_KEY = 'doksli-persistent-docs'
const FOLDERS_KEY = 'doksli-persistent-folders'
const AUDIT_KEY = 'doksli-persistent-audit'
const PERMS_KEY = 'doksli-persistent-folder-perms'

export const useDocumentsStore = defineStore('documents', () => {
  const authStore = useAuthStore()

  function loadStored<T>(key: string, fallback: T): T {
    try {
      const s = localStorage.getItem(key)
      if (s) {
        const parsed = JSON.parse(s)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as T
      }
    } catch {
      // fallback
    }
    return fallback
  }

  const folders = ref<Folder[]>(loadStored<Folder[]>(FOLDERS_KEY, initialFolders))
  const documents = ref<Doc[]>(loadStored<Doc[]>(DOCS_KEY, initialDocuments))
  const auditLog = ref<Audit[]>(loadStored<Audit[]>(AUDIT_KEY, initialAuditLog))
  const folderPermissions = ref<FolderPermission[]>(loadStored<FolderPermission[]>(PERMS_KEY, initialFolderPermissions))

  function persist() {
    try {
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders.value))
      localStorage.setItem(DOCS_KEY, JSON.stringify(documents.value))
      localStorage.setItem(AUDIT_KEY, JSON.stringify(auditLog.value))
      localStorage.setItem(PERMS_KEY, JSON.stringify(folderPermissions.value))
    } catch {
      // ignore
    }
  }

  function todayStr(): string {
    const now = new Date()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`
  }

  function nowTimeStr(): string {
    const now = new Date()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${hh}:${mm}`
  }

  function logAudit(action: string, object: string) {
    const userName = authStore.user?.name || 'Fadhil Maulana'
    const newEntry: Audit = {
      id: 'a' + Date.now(),
      user: userName,
      action,
      object,
      ip: '10.20.4.11',
      time: nowTimeStr(),
    }
    auditLog.value.unshift(newEntry)
    persist()
  }

  const activeDocs = computed(() => documents.value.filter(d => !d.deletedAt))
  const trashedDocs = computed(() => documents.value.filter(d => !!d.deletedAt))
  const totalKB = computed(() => activeDocs.value.reduce((acc, d) => acc + d.size, 0))
  const todayCount = computed(() => {
    const today = todayStr()
    return auditLog.value.filter(a => a.time.startsWith(today)).length
  })
  const recentActivities = computed(() => auditLog.value.slice(0, 6))

  function fmtSize(kb: number): string {
    return kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.round(kb) + ' KB'
  }

  function addFolder(name: string, unitId: string, restricted: boolean = false): Folder {
    const id = 'f' + (folders.value.length + 1)
    const newFolder: Folder = { id, name, unitId, restricted }
    folders.value.push(newFolder)
    logAudit('Membuat folder baru', `${name} (${unitId})`)
    persist()
    return newFolder
  }

  function uploadDocument(payload: {
    name: string
    folderId: string
    category: string
    tags: string[]
    note?: string
    size?: number
  }): Doc {
    const currentUser = authStore.user?.name || 'Fadhil Maulana'
    const size = payload.size || (150 + Math.round(Math.random() * 3200))
    const date = todayStr()
    const id = 'd' + (documents.value.length + 1)
    const newDoc: Doc = {
      id,
      name: payload.name,
      folderId: payload.folderId,
      category: payload.category,
      owner: currentUser,
      date,
      size,
      tags: payload.tags,
      versions: [
        {
          v: 1,
          date,
          uploader: currentUser,
          size,
          note: payload.note || 'Unggahan awal',
        }
      ],
      deletedAt: null,
    }
    documents.value.unshift(newDoc)
    logAudit('Unggah dokumen', newDoc.name)
    persist()
    return newDoc
  }

  function uploadVersion(docId: string, note: string, size?: number) {
    const doc = documents.value.find(d => d.id === docId)
    if (!doc) return
    const currentUser = authStore.user?.name || 'Fadhil Maulana'
    const lastV = doc.versions[doc.versions.length - 1]
    const nextV = (lastV?.v || 0) + 1
    const newSize = size || Math.max(80, (lastV?.size || 500) + Math.round((Math.random() - 0.3) * 400))
    const date = todayStr()

    doc.versions.push({
      v: nextV,
      date,
      uploader: currentUser,
      size: newSize,
      note: note || `Pembaruan dokumen v${nextV}`,
    })
    doc.size = newSize
    doc.date = date

    logAudit('Unggah versi baru', `${doc.name} v${nextV}`)
    persist()
  }

  function revertVersion(docId: string, vnum: number) {
    const doc = documents.value.find(d => d.id === docId)
    if (!doc) return
    const old = doc.versions.find(v => v.v === vnum)
    if (!old) return
    const currentUser = authStore.user?.name || 'Fadhil Maulana'
    const nextV = doc.versions[doc.versions.length - 1].v + 1
    const date = todayStr()

    doc.versions.push({
      v: nextV,
      date,
      uploader: currentUser,
      size: old.size,
      note: `Dipulihkan dari v${vnum}`,
    })
    doc.size = old.size
    doc.date = date

    logAudit('Jadikan versi aktif', `${doc.name} v${nextV} (dari v${vnum})`)
    persist()
  }

  function trashDocument(docId: string) {
    const doc = documents.value.find(d => d.id === docId)
    if (!doc) return
    doc.deletedAt = todayStr()
    logAudit('Pindahkan ke tempat sampah', doc.name)
    persist()
  }

  function restoreDocument(docId: string) {
    const doc = documents.value.find(d => d.id === docId)
    if (!doc) return
    doc.deletedAt = null
    logAudit('Pulihkan dari tempat sampah', doc.name)
    persist()
  }

  function purgeDocument(docId: string) {
    const doc = documents.value.find(d => d.id === docId)
    if (!doc) return
    const name = doc.name
    documents.value = documents.value.filter(d => d.id !== docId)
    logAudit('Hapus permanen', name)
    persist()
  }

  function downloadDocument(docId: string) {
    const doc = documents.value.find(d => d.id === docId)
    if (!doc) return
    logAudit('Unduh dokumen', doc.name)
    persist()
  }

  function grantFolderPermission(payload: {
    folderId: string
    subjectType: 'user' | 'group'
    subjectId: string
    subjectName: string
    level: 'view' | 'edit' | 'manage'
  }) {
    const f = folders.value.find(x => x.id === payload.folderId)
    const granter = authStore.user?.name || 'Fadhil Maulana'
    const existing = folderPermissions.value.find(
      p => p.folderId === payload.folderId && p.subjectType === payload.subjectType && p.subjectId === payload.subjectId
    )

    if (existing) {
      existing.level = payload.level
      existing.grantedBy = granter
      existing.grantedAt = todayStr()
    } else {
      folderPermissions.value.push({
        id: 'fp' + (folderPermissions.value.length + 1),
        folderId: payload.folderId,
        subjectType: payload.subjectType,
        subjectId: payload.subjectId,
        subjectName: payload.subjectName,
        level: payload.level,
        grantedBy: granter,
        grantedAt: todayStr(),
      })
    }

    const levelLabels: Record<string, string> = { view: 'Lihat', edit: 'Edit', manage: 'Kelola' }
    const typeLabels: Record<string, string> = { user: 'Pengguna', group: 'Grup' }
    logAudit(
      `Memberikan akses folder (${levelLabels[payload.level]}, ${typeLabels[payload.subjectType]})`,
      `${f ? f.name : payload.folderId} -> ${payload.subjectName}`
    )
    persist()
  }

  function revokeFolderPermission(permId: string) {
    const p = folderPermissions.value.find(x => x.id === permId)
    if (!p) return
    const f = folders.value.find(x => x.id === p.folderId)
    folderPermissions.value = folderPermissions.value.filter(x => x.id !== permId)
    logAudit('Mencabut akses folder', `${f ? f.name : p.folderId} -> ${p.subjectName}`)
    persist()
  }

  return {
    folders,
    documents,
    auditLog,
    folderPermissions,
    activeDocs,
    trashedDocs,
    totalKB,
    todayCount,
    recentActivities,
    todayStr,
    fmtSize,
    logAudit,
    addFolder,
    uploadDocument,
    uploadVersion,
    revertVersion,
    trashDocument,
    restoreDocument,
    purgeDocument,
    downloadDocument,
    grantFolderPermission,
    revokeFolderPermission,
  }
})
