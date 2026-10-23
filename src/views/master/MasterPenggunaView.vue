<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Icon from '../../components/Icon.vue'
import api from '../../services/api'
import { useAppConfirm } from '../../composables/useAppConfirm'

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

const usersList = ref<UserItem[]>([])
const rolesList = ref<RoleItem[]>([])
const unitsList = ref<UnitItem[]>([])

const loading = ref(false)
const submitting = ref(false)
const isModalOpen = ref(false)
const toastMessage = ref('')
const toastVisible = ref(false)

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
    return 'Akses ditolak: Hanya Admin yang dapat mengelola pengguna.'
  }
  return err.response?.data?.message || fallback
}

async function fetchUsers() {
  loading.value = true
  try {
    const res = await api.get('/v1/users')
    usersList.value = res.data?.data ?? []
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
  fetchUsers()
  fetchRolesAndUnits()
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
  form.value = {
    name: '',
    email: '',
    role_id: rolesList.value[0]?.id || '',
    unit_id: unitsList.value[0]?.id || '',
    password: 'password123',
  }
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

async function submitAddUser() {
  if (!form.value.name.trim() || !form.value.email.trim()) {
    showToast('Nama dan email wajib diisi')
    return
  }

  if (form.value.password.length < 8) {
    showToast('Password minimal 8 karakter')
    return
  }

  submitting.value = true
  try {
    await api.post('/v1/users', {
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      password: form.value.password,
      role_id: form.value.role_id,
      unit_id: form.value.unit_id || undefined,
      status: 'active',
    })

    showToast(`Pengguna "${form.value.name}" berhasil ditambahkan`)
    closeModal()
    await fetchUsers()
  } catch (err: any) {
    showToast(getErrorMessage(err, 'Gagal menambahkan pengguna'))
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
                <th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="7" style="text-align: center; padding: 28px;" class="muted">
                  Memuat data pengguna...
                </td>
              </tr>
              <tr v-for="user in usersList" :key="user.id">
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
                <td>
                  <div v-if="getUserRole(user).toLowerCase() !== 'admin'" class="flex items-center gap-2">
                    <button
                      type="button"
                      class="btn-toggle-action"
                      @click="toggleStatus(user)"
                    >
                      {{ user.status === 'active' ? 'Nonaktifkan' : 'Aktifkan' }}
                    </button>
                    <button
                      class="iconbtn"
                      title="Hapus Pengguna"
                      @click="deleteUser(user)"
                    >
                      <Icon name="trash" :size="14" />
                    </button>
                  </div>
                  <span v-else class="text-muted">—</span>
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
      </div>
    </div>

    <!-- PrimeVue Dialog Tambah Pengguna -->
    <Dialog
      v-model:visible="isModalOpen"
      modal
      header="Tambah Pengguna Baru"
      :style="{ width: '460px' }"
    >
      <form @submit.prevent="submitAddUser" class="flex flex-col gap-4">
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
          <Select 
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
          <Select 
            id="usr-unit"
            v-model="form.unit_id" 
            :options="unitsList" 
            optionLabel="name" 
            optionValue="id" 
            placeholder="Pilih unit kerja"
            fluid 
            required 
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="usr-pwd" class="text-xs font-semibold" style="color: var(--text-muted)">
            Password Awal
          </label>
          <InputText 
            id="usr-pwd"
            v-model="form.password" 
            placeholder="Min. 8 karakter" 
            fluid 
            required 
            minlength="8" 
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
            :label="submitting ? 'Menyimpan...' : 'Simpan Pengguna'" 
            :loading="submitting"
          >
            <template #icon>
              <Icon name="plus" :size="14" />
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
