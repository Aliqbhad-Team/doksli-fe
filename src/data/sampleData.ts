export type PermissionLevel = 'view' | 'edit' | 'manage'

export type User = { 
  id: string; name: string; email: string; role: 'Admin' | 'Pengelola' | 'Pengguna'
  unit?: string; password?: string
}

export type Folder = { id: string; name: string; unit: string }

export type DocVersion = { v: number; date: string; uploader: string; size: number; note: string }

export type Doc = {
  id: string; name: string; folderId: string; category: string
  owner: string; date: string; size: number; tags: string[]
  versions: DocVersion[]; deletedAt: string | null
}

export type Audit = { id: string; user: string; action: string; object: string; ip: string; time: string }

// Master users (seeder)
export const users: User[] = [
  { id: 'u1', name: 'Fadhil Maulana', email: 'admin@gmail.com', role: 'Admin', password: 'admin123' },
  { id: 'u2', name: 'Taufik Nugraha', email: 'pengelola.legal@gmail.com', role: 'Pengelola', unit: 'Legal', password: 'pengelola123' },
  { id: 'u3', name: 'Dewi Larasati', email: 'pengelola.kontrak@gmail.com', role: 'Pengelola', unit: 'Kontrak', password: 'pengelola123' },
  { id: 'u4', name: 'Anas', email: 'pengelola.keuangan@gmail.com', role: 'Pengelola', unit: 'Keuangan', password: 'pengelola123' },
  { id: 'u5', name: 'Nurhasan', email: 'pengguna.legal@gmail.com', role: 'Pengguna', unit: 'Legal', password: 'pengguna123' },
  { id: 'u6', name: 'Clara Hutagalung', email: 'pengguna.sdm@gmail.com', role: 'Pengguna', unit: 'SDM', password: 'pengguna123' },
]

export const folders: Folder[] = [
  { id: 'f1', name: 'Kontrak', unit: 'Kontrak' },
  { id: 'f2', name: 'Keuangan', unit: 'Keuangan' },
  { id: 'f3', name: 'SDM', unit: 'SDM' },
  { id: 'f4', name: 'Legal', unit: 'Legal' },
  { id: 'f5', name: 'Korespondensi', unit: 'Korespondensi' },
]

export const documents: Doc[] = []
export const auditLog: Audit[] = []

export const fmtSize = (kb: number) => kb >= 1024 ? (kb/1024).toFixed(1)+' MB' : Math.round(kb)+' KB'
export const totalSize = () => 0
