import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import { useAuthStore } from './auth'

// ─── Types ───
export type DocTag = {
  id: string
  name: string
}

export type DocVersion = {
  id: string
  document_id: string
  version_number: number
  file_url: string
  checksum: string
  size_bytes: number
  note: string | null
  uploaded_by: string | null
  uploader?: { id: string; name: string }
  created_at: string
  // Legacy / prototype compatibility:
  v?: number
  size?: number
  date?: string
}

export type Doc = {
  id: string
  name: string
  folder_id: string
  category_id: string
  owner_id: string
  status: string
  deleted_at: string | null
  created_at: string
  folder?: { id: string; name: string }
  category?: { id: string; name: string }
  owner?: { id: string; name: string }
  categoryName?: string
  ownerName?: string
  tags?: DocTag[]
  latest_version?: DocVersion
  versions?: DocVersion[]
  // Legacy / prototype compatibility:
  folderId?: string
  date?: string
  size?: number
  deletedAt?: string | null
}

export type Folder = {
  id: string
  name: string
  unit_id?: string
  unitId?: string
  unit?: { id: string; name: string }
  restricted?: boolean
}

export type Category = {
  id: string
  name: string
}

export type Unit = {
  id: string
  name: string
}

export type Audit = {
  id: string
  user: string
  action: string
  object: string
  ip: string
  time: string
}

const AUDIT_KEY = 'doksli-persistent-audit'

export const initialAuditLog: Audit[] = [
  { id: 'a1', user: 'Clara Hutagalung', action: 'Lihat dokumen', object: 'Data Cuti Tahunan 2026', ip: '10.20.4.18', time: '21 Sep 2026, 08:01' },
  { id: 'a2', user: 'Nurhasan', action: 'Unduh dokumen', object: 'Surat Keluar Konfirmasi Audit ANRI', ip: '10.20.4.44', time: '21 Sep 2026, 07:35' },
  { id: 'a3', user: 'Admin', action: 'Masuk ke sistem', object: '—', ip: '10.20.4.11', time: '21 Sep 2026, 07:12' },
  { id: 'a4', user: 'Dewi Larasati', action: 'Pindahkan ke tempat sampah', object: 'Draft Lama Kontrak Vendor (dibatalkan)', ip: '10.20.4.22', time: '18 Sep 2026, 11:03' },
  { id: 'a5', user: 'Taufik Nugraha', action: 'Lihat dokumen', object: 'Somasi Sengketa Lahan Bekasi', ip: '10.20.4.15', time: '20 Sep 2026, 15:12' },
  { id: 'a6', user: 'Anas', action: 'Unggah versi baru', object: 'Laporan Keuangan Kuartal I 2026 v3', ip: '10.20.4.30', time: '20 Sep 2026, 14:47' },
  { id: 'a7', user: 'Anas', action: 'Unggah versi baru', object: 'Laporan Keuangan Kuartal I 2026 v2', ip: '10.20.4.30', time: '20 Sep 2026, 10:22' },
  { id: 'a8', user: 'Anas', action: 'Lihat dokumen', object: 'Laporan Keuangan Kuartal I 2026', ip: '10.20.4.30', time: '20 Sep 2026, 10:05' },
  { id: 'a9', user: 'Dewi Larasati', action: 'Unggah dokumen', object: 'Perjanjian Kerja Sama Vendor Scanning', ip: '10.20.4.22', time: '20 Sep 2026, 09:41' },
  { id: 'a10', user: 'Admin', action: 'Unggah dokumen', object: 'Kontrak Sewa Gedung Kantor Pusat 2026', ip: '10.20.4.11', time: '20 Sep 2026, 08:14' },
]

// ─── Store ───
export const useDocumentsStore = defineStore('documents', () => {
  const authStore = useAuthStore()

  const documents = ref<Doc[]>([])
  const folders = ref<Folder[]>([])
  const categories = ref<Category[]>([])
  const units = ref<Unit[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<{ current_page: number; last_page: number; total: number } | null>(null)

  function loadStored<T>(key: string, fallback: T): T {
    try {
      const s = localStorage.getItem(key)
      if (s) {
        const parsed = JSON.parse(s)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as T
      }
    } catch {}
    return fallback
  }

  const auditLog = ref<Audit[]>(loadStored<Audit[]>(AUDIT_KEY, initialAuditLog))

  function persistAudit() {
    try {
      localStorage.setItem(AUDIT_KEY, JSON.stringify(auditLog.value))
    } catch {}
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
    const userName = authStore.user?.name || 'Admin'
    const newEntry: Audit = {
      id: 'a' + Date.now(),
      user: userName,
      action,
      object,
      ip: '127.0.0.1',
      time: nowTimeStr(),
    }
    auditLog.value.unshift(newEntry)
    persistAudit()
  }

  // ── Computed ──
  const activeDocs = computed(() => documents.value.filter(d => !d.deleted_at && d.status !== 'trashed'))
  const trashedDocs = computed(() => documents.value.filter(d => !!d.deleted_at || d.status === 'trashed'))

  const totalKB = computed(() => {
    return activeDocs.value.reduce((acc, d) => {
      const size = d.latest_version?.size_bytes || d.size || 0
      return acc + size
    }, 0)
  })

  const todayCount = computed(() => {
    const today = todayStr()
    return auditLog.value.filter(a => a.time.startsWith(today)).length
  })

  const recentActivities = computed(() => auditLog.value.slice(0, 6))

  // ── Normalize document for compatibility ──
  function normalizeDoc(raw: any): Doc {
    const catName = typeof raw.category === 'object' && raw.category !== null
      ? (raw.category.name ?? '')
      : String(raw.category ?? raw.category_id ?? '')

    const ownerName = typeof raw.owner === 'object' && raw.owner !== null
      ? (raw.owner.name ?? '')
      : String(raw.owner ?? raw.owner_id ?? '')

    const tagsArr: DocTag[] = Array.isArray(raw.tags)
      ? raw.tags.map((t: any) => (typeof t === 'string' ? { id: t, name: t } : t))
      : []

    return {
      ...raw,
      folderId: raw.folder_id ?? raw.folderId,
      category: typeof raw.category === 'object' && raw.category ? raw.category : { id: raw.category_id || '', name: catName },
      owner: typeof raw.owner === 'object' && raw.owner ? raw.owner : { id: raw.owner_id || '', name: ownerName },
      categoryName: catName,
      ownerName: ownerName,
      tags: tagsArr,
      date: raw.created_at ? new Date(raw.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : todayStr(),
      size: raw.latest_version?.size_bytes ?? 0,
      deletedAt: raw.deleted_at ?? (raw.status === 'trashed' ? 'trashed' : null),
    }
  }

  // ── Fetch documents ──
  async function fetchDocuments(params?: Record<string, string>) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/v1/documents', { params })
      const list = (data.data ?? []).map(normalizeDoc)
      documents.value = list
      meta.value = data.meta ?? null
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'Gagal memuat dokumen'
    } finally {
      loading.value = false
    }
  }

  // ── Fetch single document (with versions) ──
  async function fetchDocument(id: string): Promise<Doc | null> {
    try {
      const { data } = await api.get(`/v1/documents/${id}`)
      return normalizeDoc(data.data)
    } catch {
      return null
    }
  }

  // ── Fetch folders ──
  async function fetchFolders() {
    try {
      const { data } = await api.get('/v1/folders')
      folders.value = (data.data ?? []).map((f: any) => ({
        ...f,
        unitId: f.unit_id ?? f.unitId,
      }))
    } catch { /* ignore */ }
  }

  // ── Create Folder ──
  async function createFolder(payload: { name: string; unit_id?: string; parent_folder_id?: string }) {
    const { data } = await api.post('/v1/folders', payload)
    await fetchFolders()
    logAudit('Membuat folder baru', payload.name)
    return data.data
  }

  // ── Fetch categories ──
  async function fetchCategories() {
    try {
      const { data } = await api.get('/v1/categories')
      categories.value = data.data ?? []
    } catch { /* ignore */ }
  }

  // ── Fetch units ──
  async function fetchUnits() {
    try {
      const { data } = await api.get('/v1/units')
      units.value = data.data ?? []
    } catch { /* ignore */ }
  }

  // ── Upload document (with file + tags) ──
  async function uploadDocument(payload: {
    name: string
    folder_id: string
    category_id: string
    tags: string      // comma-separated
    file?: File | null
    note?: string
  }): Promise<Doc> {
    const formData = new FormData()
    formData.append('name', payload.name)
    formData.append('folder_id', payload.folder_id)
    formData.append('category_id', payload.category_id)
    if (payload.tags) formData.append('tags', payload.tags)
    if (payload.file) formData.append('file', payload.file)
    if (payload.note) formData.append('note', payload.note)

    const { data } = await api.post('/v1/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    const doc = normalizeDoc(data.data)
    logAudit('Unggah dokumen', doc.name)
    return doc
  }

  // ── Update document ──
  async function updateDocument(id: string, payload: Record<string, any>): Promise<Doc> {
    const { data } = await api.put(`/v1/documents/${id}`, payload)
    const doc = normalizeDoc(data.data)
    return doc
  }

  // ── Delete document ──
  async function deleteDocument(id: string) {
    const existing = documents.value.find(d => d.id === id)
    if (existing) {
      logAudit('Pindahkan ke tempat sampah', existing.name)
    }
    await api.delete(`/v1/documents/${id}`)
    documents.value = documents.value.filter(d => d.id !== id)
  }

  // ── Trash & Restore helpers ──
  async function trashDocument(docId: string) {
    const doc = documents.value.find(d => d.id === docId)
    logAudit('Pindahkan ke tempat sampah', doc?.name || 'Dokumen')
    await updateDocument(docId, { status: 'trashed' })
    await fetchDocuments()
  }

  async function restoreDocument(docId: string) {
    const doc = documents.value.find(d => d.id === docId)
    logAudit('Pulihkan dari tempat sampah', doc?.name || 'Dokumen')
    await updateDocument(docId, { status: 'active' })
    await fetchDocuments()
  }

  function downloadDocument(docId: string) {
    const doc = documents.value.find(d => d.id === docId)
    if (doc) {
      logAudit('Unduh dokumen', doc.name)
    }
  }

  // ── Upload new version ──
  async function uploadVersion(documentId: string, file: File, note?: string): Promise<DocVersion> {
    const formData = new FormData()
    formData.append('document_id', documentId)
    formData.append('file', file)
    if (note) formData.append('note', note)

    const { data } = await api.post('/v1/document-versions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    const doc = documents.value.find(d => d.id === documentId)
    logAudit('Unggah versi baru', `${doc?.name || 'Dokumen'} v${data.data?.version_number || ''}`)
    return data.data
  }

  // ── Delete version ──
  async function deleteVersion(id: string) {
    await api.delete(`/v1/document-versions/${id}`)
  }

  // ── Format helpers ──
  function fmtSize(bytes?: number): string {
    if (!bytes) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return {
    documents, folders, categories, units, loading, error, meta,
    auditLog, recentActivities, totalKB, todayCount,
    activeDocs, trashedDocs,
    fetchDocuments, fetchDocument,
    fetchFolders, createFolder, fetchCategories, fetchUnits,
    uploadDocument, updateDocument, deleteDocument,
    trashDocument, restoreDocument, downloadDocument,
    uploadVersion, deleteVersion,
    logAudit, fmtSize, todayStr,
  }
})
