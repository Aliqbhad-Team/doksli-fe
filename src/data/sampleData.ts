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

export const fmtSize = (kb: number) => kb >= 1024 ? (kb/1024).toFixed(1)+' MB' : Math.round(kb)+' KB'
export const totalSize = () => 0
