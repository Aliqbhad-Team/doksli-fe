<script setup lang="ts">
import { ref, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import { usePermission } from '../../composables/usePermission'
import { users, units } from '../../data/sampleData'

const { currentUser, isAdmin, isPengelola, creatableRoles, canToggleStatus } = usePermission()

const userDialog = ref(false)
const editingUser = ref<any | null>(null)
const form = ref({
  name: '',
  email: '',
  role: '',
  unit: '',
})

const roleOptions = computed(() => creatableRoles.value.map(r => ({ label: r, value: r })))
const unitOptions = computed(() => {
  if (isAdmin.value) return units.map(u => ({ label: u.name, value: u.name }))
  return currentUser.value?.unit ? [{ label: currentUser.value.unit, value: currentUser.value.unit }] : []
})

const openAddUser = () => {
  editingUser.value = null
  form.value = { name: '', email: '', role: '', unit: currentUser.value?.unit || '' }
  userDialog.value = true
}

const saveUser = () => {
  if (!form.value.name || !form.value.email || !form.value.role || !form.value.unit) {
    alert('Semua field wajib diisi')
    return
  }
  if (users.some(u => u.email.toLowerCase() === form.value.email.toLowerCase() && u.id !== editingUser.value?.id)) {
    alert('Email sudah terdaftar')
    return
  }
  if (editingUser.value) {
    Object.assign(editingUser.value, form.value)
  } else {
    users.push({ id: 'u' + Date.now(), ...form.value, status: 'active' } as any)
  }
  userDialog.value = false
}

const toggleStatus = (user: any) => {
  if (!canToggleStatus.value(user)) return
  user.status = user.status === 'active' ? 'suspended' : 'active'
}

type RoleType = 'Admin' | 'Pengelola' | 'Pengguna'

const roleColors = computed<Record<RoleType, { bg: string; fg: string }>>(() => ({
  Admin: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  Pengelola: { bg: 'var(--accent-soft)', fg: 'var(--accent)' },
  Pengguna: { bg: 'var(--success-soft)', fg: 'var(--success)' },
}))

const statusColors = computed(() => ({
  active: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  suspended: { bg: 'var(--warning-soft)', fg: 'var(--warning)' },
}))

const getRolePillStyle = (role: string) => {
  const r = role as RoleType
  const c = roleColors.value[r] || { bg: 'var(--surface-2)', fg: 'var(--text-muted)' }
  return { background: c.bg, color: c.fg }
}

const getStatusPillStyle = (status: string) => {
  const isActive = status === 'active'
  const c = isActive ? statusColors.value.active : statusColors.value.suspended
  return { background: c.bg, color: c.fg }
}

const getStatusLabel = (status: string) => status === 'active' ? 'Aktif' : 'Nonaktif'
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="banner">
      <div>
        <strong>Tidak ada halaman registrasi mandiri.</strong>
        <span v-if="isAdmin"> Sebagai Admin, Anda bisa membuat akun dengan peran Pengelola atau Pengguna. Akun aktif langsung tanpa proses approval.</span>
        <span v-else-if="isPengelola"> Sebagai Pengelola, Anda hanya bisa membuat akun dengan peran Pengguna. Akun aktif langsung tanpa proses approval.</span>
        <span v-else> Semua akun dibuat langsung oleh Admin atau Pengelola — tidak ada pendaftaran mandiri.</span>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>Daftar Pengguna</h2>
        <Button v-if="creatableRoles.length > 0" label="Tambah Pengguna" icon="pi pi-user-plus" class="p-button-sm" @click="openAddUser" />
      </div>
      <div class="panel-body">
        <DataTable :value="users" :paginator="true" :rows="10" responsiveLayout="scroll">
          <Column field="name" header="Nama" style="min-width: 180px" />
          <Column field="email" header="Email" style="min-width: 220px">
            <template #body="slotProps">
              <span class="muted">{{ slotProps.data.email }}</span>
            </template>
          </Column>
          <Column field="role" header="Peran" style="width: 140px">
            <template #body="slotProps">
              <span class="pill" :style="getRolePillStyle(slotProps.data.role)">
                <span class="dot" :style="{ background: roleColors[slotProps.data.role as RoleType]?.fg || 'var(--text-muted)' }"></span>
                {{ slotProps.data.role }}
              </span>
            </template>
          </Column>
          <Column field="unit" header="Unit" style="width: 140px">
            <template #body="slotProps">
              <span class="muted">{{ slotProps.data.unit || '—' }}</span>
            </template>
          </Column>
          <Column field="createdBy" header="Dibuat oleh" style="width: 160px">
            <template #body="slotProps">
              <span class="muted">{{ slotProps.data.createdBy || '—' }}</span>
            </template>
          </Column>
          <Column header="Status" style="width: 120px">
            <template #body="slotProps">
              <span class="pill" :style="getStatusPillStyle(slotProps.data.status)">
                <span class="dot" :style="{ background: (slotProps.data.status === 'active' ? statusColors.active : statusColors.suspended).fg }"></span>
                {{ getStatusLabel(slotProps.data.status) }}
              </span>
            </template>
          </Column>
          <Column header="Aksi" style="width: 100px">
            <template #body="slotProps">
              <Button v-if="canToggleStatus(slotProps.data)" :label="slotProps.data.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'" severity="secondary" outlined size="small" @click="toggleStatus(slotProps.data)" />
              <span v-else class="muted" style="font-size: 12.5px">—</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Add/Edit User Dialog -->
    <Dialog v-model:visible="userDialog" :header="editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'" :style="{ width: '480px' }" :modal="true">
      <div class="flex flex-col gap-3">
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text)">Nama Lengkap</label>
          <InputText v-model="form.name" placeholder="mis. Siti Rahma" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text)">Email</label>
          <InputText v-model="form.email" type="email" placeholder="mis. siti@kotakarsip.id" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text)">Peran</label>
          <Dropdown v-model="form.role" :options="roleOptions" optionLabel="label" placeholder="Pilih peran" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text)">Unit</label>
          <Dropdown v-if="isAdmin" v-model="form.unit" :options="unitOptions" optionLabel="label" placeholder="Pilih unit" />
          <InputText v-else v-model="form.unit" disabled />
        </div>
        <p v-if="!isAdmin" class="muted" style="margin: 0; font-size: 12px">Sebagai Pengelola, akun baru otomatis berada di unit Anda sendiri ({{ currentUser?.unit }}).</p>
        <p class="muted" style="margin: 4px 0 0; font-size: 12.5px">Akun akan aktif langsung begitu dibuat — tidak ada langkah registrasi atau approval terpisah.</p>
      </div>
      <template #footer>
        <Button label="Batal" text @click="userDialog = false" />
        <Button :label="editingUser ? 'Simpan' : 'Tambah'" @click="saveUser" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--accent-soft);
  border: 1px solid var(--accent);
  color: var(--accent);
  font-size: 13px;
  line-height: 1.6;
}
.banner strong { display: block; margin-bottom: 4px; }
.panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
.panel-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.panel-head h2 { margin: 0; font-size: 15px; font-weight: 600; color: var(--text); }
.panel-body { padding: 0; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 600; }
.dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.muted { color: var(--text-muted); }
</style>