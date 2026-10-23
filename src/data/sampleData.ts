export type Folder = { id: string; name: string; restricted: boolean }
export type DocVersion = { v: number; date: string; uploader: string; size: number; note: string }
export type Doc = {
  id: string; name: string; folderId: string; category: string
  owner: string; date: string; size: number; tags: string[]
  versions: DocVersion[]; deletedAt: string | null
}
export type Audit = { id: string; user: string; action: string; object: string; ip: string; time: string }

export const folders: Folder[] = [
  { id: 'f1', name: 'Kontrak', restricted: false },
  { id: 'f2', name: 'Keuangan', restricted: false },
  { id: 'f3', name: 'SDM', restricted: false },
  { id: 'f4', name: 'Legal', restricted: true },
  { id: 'f5', name: 'Korespondensi', restricted: false },
]

export const documents: Doc[] = []
export const auditLog: Audit[] = []

export type Unit = {
  id?: string
  name: string
  description?: string
}

export type Group = {
  id: string
  name: string
  description?: string
  memberIds: string[]
}

export type Category = {
  id: string
  name: string
}

export type UserRecord = {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Pengelola' | 'Pengguna'
  unit?: string
  status: 'active' | 'suspended'
  createdBy?: string
}

export const units: Unit[] = [
  { name: 'Legal', description: 'Urusan hukum, kontrak sengketa, dan opini legal.' },
  { name: 'Kontrak', description: 'Administrasi kontrak kerja sama dan vendor.' },
  { name: 'Keuangan', description: 'Laporan keuangan, invoice, dan rekonsiliasi.' },
  { name: 'SDM', description: 'Administrasi kepegawaian dan data karyawan.' },
  { name: 'Korespondensi', description: 'Surat masuk dan surat keluar organisasi.' },
]

export const groups: Group[] = [
  { id: 'g1', name: 'Tim Legal', description: 'Tim audit legal dan compliance', memberIds: ['u2', 'u5'] },
  { id: 'g2', name: 'Tim Audit Internal', description: 'Tim review dokumen legal', memberIds: ['u4', 'u5'] },
]

export const categories: Category[] = [
  { id: 'c1', name: 'Kontrak' },
  { id: 'c2', name: 'Keuangan' },
  { id: 'c3', name: 'SDM' },
  { id: 'c4', name: 'Legal' },
  { id: 'c5', name: 'Korespondensi' },
]

export const users: UserRecord[] = [
  { id: 'u1', name: 'Fadhil Maulana', email: 'admin@gmail.com', role: 'Admin', status: 'active' },
  { id: 'u2', name: 'Taufik Nugraha', email: 'taufik@kotakarsip.id', role: 'Pengelola', unit: 'Legal', status: 'active', createdBy: 'u1' },
  { id: 'u3', name: 'Dewi Larasati', email: 'dewi@kotakarsip.id', role: 'Pengelola', unit: 'Kontrak', status: 'active', createdBy: 'u1' },
  { id: 'u4', name: 'Anas', email: 'anas@kotakarsip.id', role: 'Pengelola', unit: 'Keuangan', status: 'active', createdBy: 'u1' },
  { id: 'u5', name: 'Nurhasan', email: 'nurhasan@kotakarsip.id', role: 'Pengguna', unit: 'Korespondensi', status: 'active', createdBy: 'u3' },
  { id: 'u6', name: 'Clara Hutagalung', email: 'clara@kotakarsip.id', role: 'Pengguna', unit: 'SDM', status: 'suspended', createdBy: 'u4' },
]

export const fmtSize = (kb: number) => kb >= 1024 ? (kb/1024).toFixed(1)+' MB' : Math.round(kb)+' KB'
export const totalSize = () => 0

