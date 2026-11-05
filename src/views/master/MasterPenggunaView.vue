<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Paginator from 'primevue/paginator'
import ProgressSpinner from 'primevue/progressspinner'
import Icon from '../../components/Icon.vue'
import api from '../../services/api'
import { useAppConfirm } from '../../composables/useAppConfirm'
import { useAuthStore } from '../../stores/auth'

interface RoleItem {
  id: string
  name: string
  description?: string
}

interface UnitItem {
  id: string
  name: string
  description?: string
}

interface UserItem {
  id: string
  name: string
  email: string
  status?: 'active' | 'suspended'
  role?: RoleItem | string
  unit?: UnitItem | string
  role_id?: string
  unit_id?: string
  created_at?: string
}

const { confirmDelete } = useAppConfirm()
const authStore = useAuthStore()

const myUnitId = computed(() => {
  if (typeof authStore.user?.unit === 'object' && authStore.user?.unit?.id) {
    return authStore.user.unit.id
  }
  return authStore.user?.unit_id || ''
})

const myUnitName = computed(() => {
  if (typeof authStore.user?.unit === 'object' && authStore.user?.unit?.name) {
    return authStore.user.unit.name
  }
  const u = unitsList.value.find(item => item.id === myUnitId.value)
  return u?.name || 'Unit Anda'
})

function canManageUser(targetUser: UserItem): boolean {
  const targetRole = getUserRole(targetUser).toLowerCase()
  if (targetRole === 'admin') return false

  if (authStore.isAdmin) return true

  if (authStore.isPengelola) {
    if (targetRole !== 'pengguna') return false
    const targetUnitId = targetUser.unit_id || (typeof targetUser.unit === 'object' ? targetUser.unit?.id : '')
    if (!myUnitId.value || !targetUnitId) return false
    return myUnitId.value === targetUnitId
  }

  return false
}

const usersList = ref<UserItem[]>([])
const rolesList = ref<RoleItem[]>([])
const unitsList = ref<UnitItem[]>([])

const loading = ref(false)
const submitting = ref(false)
const isModalOpen = ref(false)
const isEditMode = ref(false)
const editingUserId = ref<string | null>(null)
const toastMessage = ref('')
const toastVisible = ref(false)

const first = ref(0)
const rows = 10
const paginatedUsers = computed(() => usersList.value.slice(first.value, first.value + rows))

const form = ref({
  name: '',
  email: '',
  role_id: '',
  unit_id: '',
  password: 'password123',
})

function showToast(msg: string) {
  toastMessage.value = msg
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, 3000)
}

function getErrorMessage(err: any, fallback: string): string {
  if (err.response?.status === 401) {
    return 'Sesi login telah berakhir (Unauthenticated). Silakan login kembali.'
  }
  if (err.response?.status === 403) {
    return err.response?.data?.message || 'Akses ditolak: Anda tidak memiliki izin untuk mengelola pengguna ini.'
  }
  return err.response?.data?.message || fallback
}

async function fetchUsers() {
  loading.value = true
  try {
    const res = await api.get('/v1/users')
    usersList.value = res.data?.data ?? []
    if (first.value >= usersList.value.length) {
      first.value = 0
    }
  } catch (err: any) {
    showToast(getErrorMessage(err, 'Gagal memuat daftar pengguna'))
  } finally {
    loading.value = false
  }
}

async function fetchRolesAndUnits() {
  try {
    const [rolesRes, unitsRes] = await Promise.all([
      api.get('/v1/roles'),
      api.get('/v1/units'),
    ])
    // Filter role admin karena admin hanya 1 dari seeder
    const allRoles: RoleItem[] = rolesRes.data?.data ?? []
    rolesList.value = allRoles.filter(r => r.name.toLowerCase() !== 'admin')
    unitsList.value = unitsRes.data?.data ?? []
  } catch {
    // fallback
  }
}

onMounted(() => {
  Promise.allSettled([
    fetchUsers(),
    fetchRolesAndUnits(),
  ])
})

function getUserRole(user: UserItem): string {
  if (!user.role) return 'Pengguna'
  if (typeof user.role === 'string') return user.role
  return user.role.name || 'Pengguna'
}

function getUserUnit(user: UserItem): string {
  if (!user.unit) return '—'
  if (typeof user.unit === 'string') return user.unit
  return user.unit.name || '—'
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function openAddModal() {
  isEditMode.value = false
  editingUserId.value = null

  let defaultRoleId = rolesList.value[0]?.id || ''
  let defaultUnitId = unitsList.value[0]?.id || ''

  if (authStore.isPengelola) {
    const rolePengguna = rolesList.value.find(r => r.name.toLowerCase() === 'pengguna')
    if (rolePengguna) defaultRoleId = rolePengguna.id
    if (myUnitId.value) defaultUnitId = myUnitId.value
  }

  form.value = {
    name: '',
    email: '',
    role_id: defaultRoleId,
    unit_id: defaultUnitId,
    password: 'password123',
  }
  isModalOpen.value = true
}

function openEditModal(user: UserItem) {
  if (!canManageUser(user)) {
    showToast('Akses ditolak: Anda hanya dapat mengelola pengguna dari unit Anda')
    return
  }
  isEditMode.value = true
  editingUserId.value = user.id

  let roleId = user.role_id || ''
  if (!roleId && typeof user.role === 'object' && user.role?.id) {
    roleId = user.role.id
  }
  if (!roleId && rolesList.value.length > 0) {
    roleId = rolesList.value[0].id
  }

  let unitId = user.unit_id || ''
  if (!unitId && typeof user.unit === 'object' && user.unit?.id) {
    unitId = user.unit.id
  }

  if (authStore.isPengelola && myUnitId.value) {
    unitId = myUnitId.value
  }

  form.value = {
    name: user.name,
    email: user.email,
    role_id: roleId,
    unit_id: unitId,
    password: '',
  }
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  isEditMode.value = false
  editingUserId.value = null
}

async function submitUser() {
  if (!form.value.name.trim() || !form.value.email.trim()) {
    showToast('Nama dan email wajib diisi')
    return
  }

  if (!isEditMode.value && form.value.password.length < 8) {
    showToast('Password minimal 8 karakter')
    return
  }

  if (isEditMode.value && form.value.password.trim() && form.value.password.trim().length < 8) {
    showToast('Password baru minimal 8 karakter')
    return
  }

  submitting.value = true
  try {
    if (isEditMode.value && editingUserId.value) {
      const payload: Record<string, any> = {
        name: form.value.name.trim(),
        email: form.value.email.trim(),
        role_id: form.value.role_id,
        unit_id: form.value.unit_id || null,
      }
      if (form.value.password.trim()) {
        payload.password = form.value.password.trim()
      }
      await api.put(`/v1/users/${editingUserId.value}`, payload)
      showToast(`Data pengguna "${form.value.name}" berhasil diperbarui`)
    } else {
      await api.post('/v1/users', {
        name: form.value.name.trim(),
        email: form.value.email.trim(),
        password: form.value.password,
        role_id: form.value.role_id,
        unit_id: form.value.unit_id || undefined,
        status: 'active',
      })
      showToast(`Pengguna "${form.value.name}" berhasil ditambahkan`)
    }

    closeModal()
    await fetchUsers()
  } catch (err: any) {
    showToast(getErrorMessage(err, isEditMode.value ? 'Gagal memperbarui pengguna' : 'Gagal menambahkan pengguna'))
    if (err.response?.status === 401) {
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    }
  } finally {
    submitting.value = false
  }
}

async function toggleStatus(user: UserItem) {
  if (!canManageUser(user)) {
    showToast('Akses ditolak: Anda hanya dapat mengelola pengguna dari unit Anda')
    return
  }
  const newStatus = user.status === 'active' ? 'suspended' : 'active'
  try {
    await api.put(`/v1/users/${user.id}`, { status: newStatus })
    showToast(`Status "${user.name}" diubah menjadi ${newStatus === 'active' ? 'Aktif' : 'Nonaktif'}`)
    await fetchUsers()
  } catch (err: any) {
    showToast(getErrorMessage(err, 'Gagal memperbarui status pengguna'))
    if (err.response?.status === 401) {
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    }
  }
}

function deleteUser(user: UserItem) {
  if (!canManageUser(user)) {
    showToast('Akses ditolak: Anda hanya dapat mengelola pengguna dari unit Anda')
    return
  }
  confirmDelete({
    title: 'Hapus Pengguna',
    message: `Apakah Anda yakin ingin menghapus pengguna "${user.name}"?`,
    submessage: 'Pengguna yang dihapus tidak dapat lagi mengakses sistem ini.',
    confirmLabel: 'Hapus Pengguna',
    onAccept: async () => {
      try {
        await api.delete(`/v1/users/${user.id}`)
        showToast(`Pengguna "${user.name}" telah dihapus`)
        await fetchUsers()
      } catch (err: any) {
        showToast(getErrorMessage(err, 'Gagal menghapus pengguna'))
        if (err.response?.status === 401) {
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
        }
      }
    },
  })
}
</script>

<template>
  <div class="user-page">
    <div class="panel user-panel">
      <!-- Header -->
      <div class="panel-head">
        <h2>Daftar Pengguna</h2>
        <Button size="small" @click="openAddModal" class="gap-1.5 font-medium">
          <Icon name="userplus" :size="15" />
          <span>Tambah Pengguna</span>
        </Button>
      </div>

      <!-- Table Body -->
      <div class="panel-body p-0">
        <div class="table-scroll">
          <table class="user-table">
            <thead>
              <tr>
                <th>NAMA</th>
                <th>EMAIL</th>
                <th>PERAN</th>
                <th>UNIT</th>
                <th>DIBUAT PADA</th>
                <th>STATUS</th>
                <th style="text-align: right; width: 220px;">AKSI</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="7" style="text-align: center; padding: 32px;" class="muted">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <ProgressSpinner style="width: 32px; height: 32px" strokeWidth="4" />
                    <span>Memuat data pengguna...</span>
                  </div>
                </td>
              </tr>
              <tr v-else v-for="user in paginatedUsers" :key="user.id">
                <td>
                  <span class="user-name">{{ user.name }}</span>
                </td>
                <td>
                  <span class="user-email">{{ user.email }}</span>
                </td>
                <td>
                  <span
                    class="status-pill"
                    :class="{
                      'role-admin': getUserRole(user).toLowerCase() === 'admin',
                      'role-pengelola': getUserRole(user).toLowerCase() === 'pengelola',
                      'role-pengguna': getUserRole(user).toLowerCase() === 'pengguna',
                    }"
                  >
                    <span class="pill-dot"></span>
                    <span>{{ getUserRole(user) }}</span>
                  </span>
                </td>
                <td>
                  <span class="user-unit">{{ getUserUnit(user) }}</span>
                </td>
                <td>
                  <span class="user-creator">{{ formatDate(user.created_at) }}</span>
                </td>
                <td>
                  <span
                    class="status-pill"
                    :class="user.status === 'active' ? 'status-active' : 'status-suspended'"
                  >
                    <span class="pill-dot"></span>
                    <span>{{ user.status === 'active' ? 'Aktif' : 'Nonaktif' }}</span>
                  </span>
                </td>
                <td style="text-align: right;">
                  <div v-if="getUserRole(user).toLowerCase() !== 'admin'" class="flex items-center justify-end gap-2">
                    <Button 
                      :label="user.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'" 
                      severity="secondary" 
                      text 
                      size="small" 
                      :disabled="!canManageUser(user)"
                      :title="!canManageUser(user) ? 'Hanya dapat mengelola pengguna dari unit Anda' : (user.status === 'active' ? 'Nonaktifkan Akun' : 'Aktifkan Akun')"
                      @click="toggleStatus(user)" 
                    />
                    <Button 
                      label="Edit" 
                      severity="secondary" 
                      text 
                      size="small" 
                      :disabled="!canManageUser(user)"
                      :title="!canManageUser(user) ? 'Hanya dapat mengelola pengguna dari unit Anda' : 'Edit Pengguna'"
                      @click="openEditModal(user)" 
                    />
                    <button 
                      type="button"
                      class="iconbtn" 
                      title="Hapus Pengguna"
                      :disabled="!canManageUser(user)"
                      @click="deleteUser(user)"
                    >
                      <Icon name="trash" :size="14" />
                    </button>
                  </div>
                  <span v-else class="text-muted text-xs">—</span>
                </td>
              </tr>
              <tr v-if="!loading && usersList.length === 0">
                <td colspan="7" class="empty">
                  <Icon name="user" :size="28" />
                  <div>Belum ada data pengguna</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Numeric Pagination (PrimeVue) -->
        <div class="border-t border-[var(--border)] p-2 flex justify-center">
          <Paginator
            v-model:first="first"
            :rows="rows"
            :totalRecords="usersList.length"
            :alwaysShow="true"
            @page="(e) => first = e.first"
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          />
        </div>
      </div>
    </div>

    <!-- PrimeVue Dialog Tambah / Edit Pengguna -->
    <Dialog
      v-model:visible="isModalOpen"
      modal
      :header="isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna Baru'"
      :style="{ width: '460px' }"
    >
      <form @submit.prevent="submitUser" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="usr-name" class="text-xs font-semibold" style="color: var(--text-muted)">
            Nama Lengkap
          </label>
          <InputText 
            id="usr-name"
            v-model="form.name" 
            placeholder="mis. Budi Prasetyo" 
            fluid 
            required 
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="usr-email" class="text-xs font-semibold" style="color: var(--text-muted)">
            Email
          </label>
          <InputText 
            id="usr-email"
            v-model="form.email" 
            type="email" 
            placeholder="budi@kotakarsip.id" 
            fluid 
            required 
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="usr-role" class="text-xs font-semibold" style="color: var(--text-muted)">
            Peran Akun
          </label>
          <div v-if="authStore.isPengelola" class="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-sm flex items-center justify-between">
            <span class="font-medium">Pengguna</span>
            <span class="text-xs text-muted">(Khusus role Pengguna)</span>
          </div>
          <Select 
            v-else
            id="usr-role"
            v-model="form.role_id" 
            :options="rolesList" 
            optionLabel="name" 
            optionValue="id" 
            placeholder="Pilih peran akun"
            fluid 
            required 
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="usr-unit" class="text-xs font-semibold" style="color: var(--text-muted)">
            Unit Kerja
          </label>
          <div v-if="authStore.isPengelola" class="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-sm flex items-center justify-between">
            <span class="font-medium">{{ myUnitName }}</span>
            <span class="text-xs text-muted">(Otomatis unit Anda)</span>
          </div>
          <Select 
            v-else
            id="usr-unit"
            v-model="form.unit_id" 
            :options="unitsList" 
            optionLabel="name" 
            optionValue="id" 
            placeholder="Pilih unit kerja (opsional)"
            showClear
            fluid 
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="usr-pwd" class="text-xs font-semibold" style="color: var(--text-muted)">
            {{ isEditMode ? 'Password Baru (Opsional)' : 'Password Awal' }}
          </label>
          <InputText 
            id="usr-pwd"
            v-model="form.password" 
            :placeholder="isEditMode ? 'Kosongkan jika tidak ingin mengubah password' : 'Min. 8 karakter'" 
            fluid 
            :required="!isEditMode" 
            :minlength="isEditMode ? 0 : 8" 
          />
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button 
            type="button" 
            label="Batal" 
            severity="secondary" 
            text 
            @click="closeModal" 
          />
          <Button 
            type="submit" 
            :label="submitting ? 'Menyimpan...' : (isEditMode ? 'Perbarui Pengguna' : 'Simpan Pengguna')" 
            :loading="submitting"
          >
            <template #icon>
              <Icon :name="isEditMode ? 'check' : 'plus'" :size="14" />
            </template>
          </Button>
        </div>
      </form>
    </Dialog>

    <!-- Toast Notification -->
    <div v-if="toastVisible" class="toasts">
      <div class="toast">
        <Icon name="check" :size="16" />
        <span>{{ toastMessage }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.panel-head {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
}

.panel-head h2 {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}


.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th {
  padding: 14px 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.user-table td {
  padding: 16px 20px;
  font-size: 13.5px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.user-table tbody tr:last-child td {
  border-bottom: none;
}

.user-table tbody tr:hover td {
  background: var(--surface-2);
}

.user-name {
  font-weight: 600;
  color: var(--text);
}

.user-email,
.user-unit,
.user-creator {
  color: var(--text-muted);
}

/* Status Pill with Bullet Dot */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 3px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-pill .pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Role Badges */
.role-admin {
  background: var(--danger-soft);
  color: var(--danger);
}
.role-admin .pill-dot {
  background: var(--danger);
}

.role-pengelola {
  background: var(--accent-soft);
  color: var(--accent);
}
.role-pengelola .pill-dot {
  background: var(--accent);
}

.role-pengguna {
  background: var(--success-soft);
  color: var(--success);
}
.role-pengguna .pill-dot {
  background: var(--success);
}

/* Status Badges */
.status-active {
  background: var(--success-soft);
  color: var(--success);
}
.status-active .pill-dot {
  background: var(--success);
}

.status-suspended {
  background: var(--warning-soft);
  color: var(--warning);
}
.status-suspended .pill-dot {
  background: var(--warning);
}

/* Action Button */
.btn-toggle-action {
  background: none;
  border: none;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text);
  cursor: pointer;
  padding: 0;
  transition: opacity 0.18s;
}

.btn-toggle-action:hover {
  opacity: 0.75;
}
</style>
