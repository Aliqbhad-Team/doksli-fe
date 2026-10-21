export type PermissionLevel = 'view' | 'edit' | 'manage'

export type User = {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Pengelola' | 'Pengguna'
  unit?: string
  password?: string
}

export type Folder = {
  id: string
  name: string
  unitId: string
  description?: string
}

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
  level: PermissionLevel
  grantedBy: string
  grantedAt: string
}

export type DocumentPermission = {
  id: string
  documentId: string
  subjectType: 'user' | 'group'
  subjectId: string
  level: PermissionLevel
  grantedBy: string
  grantedAt: string
}

export type Group = {
  id: string
  name: string
  memberIds: string[]
}

export type Unit = {
  name: string
  description: string
}

export type Category = {
  id: string
  name: string
}

export type Tag = {
  id: string
  name: string
}

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
  { id: 'f1', name: 'Kontrak', unitId: 'Kontrak', description: 'Folder kontrak dan perjanjian' },
  { id: 'f2', name: 'Keuangan', unitId: 'Keuangan', description: 'Folder dokumen keuangan' },
  { id: 'f3', name: 'SDM', unitId: 'SDM', description: 'Folder SDM dan karyawan' },
  { id: 'f4', name: 'Legal', unitId: 'Legal', description: 'Folder legal dan hukum' },
  { id: 'f5', name: 'Korespondensi', unitId: 'Korespondensi', description: 'Folder surat menyurat' },
]

export const units: Unit[] = [
  { name: 'Kontrak', description: 'Unit pengelola kontrak' },
  { name: 'Keuangan', description: 'Unit keuangan dan akuntansi' },
  { name: 'SDM', description: 'Sumber daya manusia' },
  { name: 'Legal', description: 'Hukum dan kepatuhan' },
  { name: 'Korespondensi', description: 'Administrasi surat menyurat' },
]

export const groups: Group[] = [
  { id: 'g1', name: 'Tim Proyek Alpha', memberIds: ['u5', 'u6'] },
  { id: 'g2', name: 'Audit Internal', memberIds: ['u2', 'u3'] },
]

export const categories: Category[] = [
  { id: 'c1', name: 'Kontrak' },
  { id: 'c2', name: 'Keuangan' },
  { id: 'c3', name: 'SDM' },
  { id: 'c4', name: 'Legal' },
  { id: 'c5', name: 'Korespondensi' },
]

export const tags: Tag[] = [
  { id: 't1', name: 'penting' },
  { id: 't2', name: 'rahasia' },
  { id: 't3', name: 'arsip' },
  { id: 't4', name: 'referensi' },
]

export const documents: Doc[] = [
  {
    id: 'd1',
    name: 'Kontrak Sewa Gedung Cikarang 2026',
    folderId: 'f1',
    category: 'Kontrak',
    owner: 'Taufik Nugraha',
    date: '2026-01-15',
    size: 2450,
    tags: ['penting', 'kontrak'],
    versions: [
      { v: 1, date: '2026-01-15', uploader: 'Taufik Nugraha', size: 2450, note: 'Unggahan awal' },
      { v: 2, date: '2026-02-10', uploader: 'Taufik Nugraha', size: 2520, note: 'Perbaikan pasal 4' },
    ],
    deletedAt: null,
  },
  {
    id: 'd2',
    name: 'MOU Kerjasama Mitra Bisnis',
    folderId: 'f1',
    category: 'Kontrak',
    owner: 'Dewi Larasati',
    date: '2026-02-20',
    size: 1890,
    tags: ['mo', 'mitra'],
    versions: [
      { v: 1, date: '2026-02-20', uploader: 'Dewi Larasati', size: 1890, note: 'Draft awal' },
    ],
    deletedAt: null,
  },
  {
    id: 'd3',
    name: 'Laporan Keuangan Triwulan I 2026',
    folderId: 'f2',
    category: 'Keuangan',
    owner: 'Anas',
    date: '2026-03-31',
    size: 3120,
    tags: ['laporan', 'triwulan'],
    versions: [
      { v: 1, date: '2026-03-31', uploader: 'Anas', size: 3120, note: 'Final Q1' },
    ],
    deletedAt: null,
  },
  {
    id: 'd4',
    name: 'Kebijakan Cuti Tahunan 2026',
    folderId: 'f3',
    category: 'SDM',
    owner: 'Nurhasan',
    date: '2026-01-10',
    size: 890,
    tags: ['sdm', 'kebijakan'],
    versions: [
      { v: 1, date: '2026-01-10', uploader: 'Nurhasan', size: 890, note: 'Versi resmi' },
    ],
    deletedAt: null,
  },
  {
    id: 'd5',
    name: 'Surat Kuasa Pengacara',
    folderId: 'f4',
    category: 'Legal',
    owner: 'Fadhil Maulana',
    date: '2026-03-05',
    size: 560,
    tags: ['legal', 'kuasa'],
    versions: [
      { v: 1, date: '2026-03-05', uploader: 'Fadhil Maulana', size: 560, note: 'Resmi' },
    ],
    deletedAt: null,
  },
  {
    id: 'd6',
    name: 'Surat Masuk Undangan Rapat',
    folderId: 'f5',
    category: 'Korespondensi',
    owner: 'Clara Hutagalung',
    date: '2026-04-01',
    size: 320,
    tags: ['surat', 'undangan'],
    versions: [
      { v: 1, date: '2026-04-01', uploader: 'Clara Hutagalung', size: 320, note: 'Diterima' },
    ],
    deletedAt: null,
  },
]

export const folderPermissions: FolderPermission[] = []
export const documentPermissions: DocumentPermission[] = []

export const auditLog: Audit[] = [
  { id: 'a1', user: 'Fadhil Maulana', action: 'Login', object: 'Sistem', ip: '192.168.1.10', time: '2026-10-19 08:30' },
  { id: 'a2', user: 'Taufik Nugraha', action: 'Unggah dokumen', object: 'Kontrak Sewa Gedung Cikarang 2026', ip: '192.168.1.15', time: '2026-10-19 09:15' },
  { id: 'a3', user: 'Dewi Larasati', action: 'Pindahkan ke tempat sampah', object: 'Draft Laporan Q3', ip: '192.168.1.20', time: '2026-10-19 10:00' },
  { id: 'a4', user: 'Anas', action: 'Unduh dokumen', object: 'Laporan Keuangan Triwulan I 2026', ip: '192.168.1.25', time: '2026-10-19 11:30' },
  { id: 'a5', user: 'System', action: 'Membuat folder baru', object: 'Arsip Legal 2026', ip: '127.0.0.1', time: '2026-10-19 14:00' },
  { id: 'a6', user: 'Nurhasan', action: 'Pulihkan dari tempat sampah', object: 'MOU Kerjasama Mitra Bisnis', ip: '192.168.1.30', time: '2026-10-19 15:45' },
  { id: 'a7', user: 'Clara Hutagalung', action: 'Edit metadata', object: 'Kebijakan Cuti Tahunan 2026', ip: '192.168.1.35', time: '2026-10-19 16:20' },
]

export const fmtSize = (kb: number) => kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.round(kb) + ' KB'

export const totalSize = () => documents.reduce((sum, d) => sum + d.size, 0)