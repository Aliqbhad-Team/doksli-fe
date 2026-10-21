import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { folders as allFolders } from '../data/sampleData'
import { documents } from '../data/sampleData'

interface UserRole {
  id: string
  name: string
}

interface CurrentUser {
  id: string
  name: string
  email: string
  role: UserRole
  unit_id?: string
  unit?: string
}

export function usePermission() {
  const authStore = useAuthStore()

  const currentUser = computed<CurrentUser | null>(() => authStore.user)

  const isAdmin = computed(() => currentUser.value?.role?.name === 'Admin')
  const isPengelola = computed(() => currentUser.value?.role?.name === 'Pengelola')
  const isPengguna = computed(() => currentUser.value?.role?.name === 'Pengguna')

  // Helper: get folder unitId from doc or folder object
  const getFolderUnitId = (doc: any, folder?: any): string | undefined => {
    if (folder?.unitId) return folder.unitId
    if (doc?.folderId) {
      const f = allFolders.find(x => x.id === doc.folderId)
      return f?.unitId
    }
    if (doc?.folder) {
      const f = allFolders.find(x => x.name === doc.folder)
      return f?.unitId
    }
    return undefined
  }

  // Folder visibility per role
  const filterVisibleFolders = computed(() => {
    if (!currentUser.value) return []
    if (isAdmin.value) return allFolders
    return allFolders.filter(f => f.unitId === currentUser.value?.unit)
  })

  // Document visibility per role
  const filterVisibleDocuments = computed(() => {
    if (!currentUser.value) return []
    if (isAdmin.value) return documents
    const userFolders = filterVisibleFolders.value.map(f => f.id)
    return documents.filter(d => userFolders.includes(d.folderId))
  })

  // Permission checks
  const canTrashDoc = computed(() => (doc: any, folder?: any) => {
    if (!currentUser.value) return false
    if (isAdmin.value) return true
    if (isPengelola.value) {
      const folderUnitId = getFolderUnitId(doc, folder)
      return folderUnitId === currentUser.value?.unit
    }
    return false
  })

  const canUploadVersionDoc = computed(() => (doc: any, folder?: any) => {
    if (!currentUser.value) return false
    if (isAdmin.value) return true
    if (isPengelola.value) {
      const folderUnitId = getFolderUnitId(doc, folder)
      return folderUnitId === currentUser.value?.unit
    }
    if (isPengguna.value) {
      const folderUnitId = getFolderUnitId(doc, folder)
      return folderUnitId === currentUser.value?.unit
    }
    return false
  })

  const canManageAccess = computed(() => (folderId: string) => {
    if (!currentUser.value) return false
    if (isAdmin.value) return true
    if (isPengelola.value) {
      const folder = allFolders.find(f => f.id === folderId)
      return folder?.unitId === currentUser.value?.unit
    }
    return false
  })

  const canManageDocAccess = computed(() => (doc: any, folder?: any) => {
    if (!currentUser.value) return false
    if (isAdmin.value) return true
    if (isPengelola.value) {
      const folderUnitId = getFolderUnitId(doc, folder)
      return folderUnitId === currentUser.value?.unit
    }
    return false
  })

  const canDownloadDoc = computed(() => (doc: any, folder?: any) => {
    if (!currentUser.value) return false
    if (isAdmin.value) return true
    const folderUnitId = getFolderUnitId(doc, folder)
    if (isPengelola.value) return folderUnitId === currentUser.value?.unit
    if (isPengguna.value) return folderUnitId === currentUser.value?.unit
    return false
  })

  const canEditDoc = computed(() => (doc: any, folder?: any) => {
    if (!currentUser.value) return false
    if (isAdmin.value) return true
    if (isPengelola.value) {
      const folderUnitId = getFolderUnitId(doc, folder)
      return folderUnitId === currentUser.value?.unit
    }
    if (isPengguna.value) {
      const folderUnitId = getFolderUnitId(doc, folder)
      return folderUnitId === currentUser.value?.unit
    }
    return false
  })

  const canRestoreDoc = computed(() => (doc: any, folder?: any) => {
    if (!currentUser.value) return false
    if (isAdmin.value) return true
    if (isPengelola.value) {
      const folderUnitId = getFolderUnitId(doc, folder)
      return folderUnitId === currentUser.value?.unit
    }
    return false
  })

  const canManageFolderAccess = computed(() => (folderId: string) => {
    if (!currentUser.value) return false
    if (isAdmin.value) return true
    if (isPengelola.value) {
      const folder = allFolders.find(f => f.id === folderId)
      return folder?.unitId === currentUser.value?.unit
    }
    return false
  })

  const canManageAnyFolder = computed(() => {
    if (!currentUser.value) return false
    if (isAdmin.value) return true
    if (isPengelola.value) return true
    return false
  })

  const creatableRoles = computed(() => {
    if (isAdmin.value) return ['Pengelola', 'Pengguna']
    if (isPengelola.value) return ['Pengguna']
    return []
  })

  const canToggleStatus = computed(() => (user: any) => {
    if (!currentUser.value) return false
    if (isAdmin.value) return user.id !== currentUser.value.id
    if (isPengelola.value) return user.unit === currentUser.value?.unit && user.role === 'Pengguna' && user.id !== currentUser.value.id
    return false
  })

  return {
    currentUser,
    isAdmin,
    isPengelola,
    isPengguna,
    filterVisibleFolders,
    filterVisibleDocuments,
    canTrashDoc,
    canUploadVersionDoc,
    canManageAccess,
    canManageDocAccess,
    canDownloadDoc,
    canEditDoc,
    canRestoreDoc,
    canManageFolderAccess,
    canManageAnyFolder,
    creatableRoles,
    canToggleStatus,
  }
}