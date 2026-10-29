<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import Icon from '../../components/Icon.vue'
import api from '../../services/api'
import { users as sampleUsers } from '../../data/sampleData'
import { useAppConfirm } from '../../composables/useAppConfirm'

interface UserItem {
  id: string
  name: string
  email: string
  role?: string | { id?: string; name: string }
  unit?: string | { id?: string; name: string }
}

interface GroupItem {
  id?: string
  name: string
  description?: string
  users_count?: number
  users?: UserItem[]
  memberIds?: string[]
}

const { confirmDelete } = useAppConfirm()
const groupsList = ref<GroupItem[]>([])
const allUsers = ref<UserItem[]>([])
const groupMemberIds = ref<string[]>([])

const loading = ref(false)
const submitting = ref(false)
const loadingMembers = ref(false)

const isFormModalOpen = ref(false)
const isEditing = ref(false)
const editingGroupId = ref<string | null>(null)

const isMemberModalOpen = ref(false)
const selectedGroup = ref<GroupItem | null>(null)

const toastMessage = ref('')
const toastVisible = ref(false)

const form = ref({
  name: '',
  description: '',
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
    return 'Akses ditolak: Hanya Admin yang dapat mengelola grup akses.'
  }
  return err.response?.data?.message || fallback
}

async function fetchGroups() {
  loading.value = true
  try {
    const res = await api.get('/v1/groups')
    groupsList.value = res.data?.data ?? []
  } catch (err: any) {
    showToast(getErrorMessage(err, 'Gagal memuat daftar grup'))
  } finally {
    loading.value = false
  }
}

async function fetchUsers() {
  try {
    const res = await api.get('/v1/users')
    allUsers.value = res.data?.data ?? []
  } catch {
    // fallback to sampleUsers if users endpoint unavailable
    allUsers.value = sampleUsers as any
  }
}

onMounted(() => {
  fetchGroups()
  fetchUsers()
})

function memberSummary(group: GroupItem): string {
  if (typeof group.users_count === 'number' && group.users_count > 0) {
    return `${group.users_count} anggota terdaftar`
  }
  if (group.users && group.users.length > 0) {
    return group.users.map(u => u.name).join(', ')
  }
  return 'Belum ada anggota'
}

function openAddModal() {
  isEditing.value = false
  editingGroupId.value = null
  form.value = { name: '', description: '' }
  isFormModalOpen.value = true
}

function openEditModal(group: GroupItem) {
  isEditing.value = true
  editingGroupId.value = group.id ?? null
  form.value = {
    name: group.name,
    description: group.description || '',
  }
  isFormModalOpen.value = true
}

function closeFormModal() {
  isFormModalOpen.value = false
}

async function submitGroup() {
  const name = form.value.name.trim()
  const description = form.value.description.trim()

  if (!name) {
    showToast('Nama grup wajib diisi')
    return
  }

  submitting.value = true
  try {
    if (isEditing.value && editingGroupId.value) {
      await api.put(`/v1/groups/${editingGroupId.value}`, {
        name,
        description,
      })
      showToast(`Grup "${name}" berhasil diperbarui`)
    } else {
      await api.post('/v1/groups', {
        name,
        description,
      })
      showToast(`Grup "${name}" berhasil dibuat`)
    }
    closeFormModal()
    await fetchGroups()
  } catch (err: any) {
    const defaultErr = isEditing.value ? 'Gagal memperbarui grup' : 'Gagal membuat grup'
    showToast(getErrorMessage(err, defaultErr))
    if (err.response?.status === 401) {
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    }
  } finally {
    submitting.value = false
  }
}

function deleteGroup(group: GroupItem) {
  if (!group.id) {
    showToast('ID grup tidak valid')
    return
  }

  confirmDelete({
    title: 'Hapus Grup Akses',
    message: `Apakah Anda yakin ingin menghapus grup "${group.name}"?`,
    submessage: 'Anggota yang tergabung dalam grup ini akan dilepaskan secara otomatis.',
    confirmLabel: 'Hapus Grup',
    onAccept: async () => {
      try {
        await api.delete(`/v1/groups/${group.id}`)
        showToast(`Grup "${group.name}" dihapus`)
        await fetchGroups()
      } catch (err: any) {
        showToast(getErrorMessage(err, 'Gagal menghapus grup'))
        if (err.response?.status === 401) {
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
        }
      }
    },
  })
}

async function openMemberModal(group: GroupItem) {
  selectedGroup.value = group
  groupMemberIds.value = []
  isMemberModalOpen.value = true
  loadingMembers.value = true

  if (!allUsers.value || allUsers.value.length === 0) {
    await fetchUsers()
  }

  if (group.id) {
    try {
      const res = await api.get(`/v1/groups/${group.id}/users`)
      const members: UserItem[] = res.data?.data ?? []
      groupMemberIds.value = members.map(m => String(m.id))
    } catch {
      // fallback
      groupMemberIds.value = group.memberIds ?? []
    } finally {
      loadingMembers.value = false
    }
  } else {
    loadingMembers.value = false
  }
}

function closeMemberModal() {
  selectedGroup.value = null
  isMemberModalOpen.value = false
}

function isMember(userId: string | number) {
  return groupMemberIds.value.includes(String(userId))
}

async function toggleMember(user: UserItem) {
  if (!selectedGroup.value?.id) return

  const userId = String(user.id)
  const groupId = selectedGroup.value.id
  const currentlyMember = isMember(userId)

  try {
    if (currentlyMember) {
      await api.delete(`/v1/users/${userId}/groups/${groupId}`)
      groupMemberIds.value = groupMemberIds.value.filter(id => id !== userId)
      showToast(`${user.name} dihapus dari ${selectedGroup.value.name}`)
    } else {
      await api.post(`/v1/users/${userId}/groups`, {
        group_ids: [groupId],
      })
      groupMemberIds.value.push(userId)
      showToast(`${user.name} ditambahkan ke ${selectedGroup.value.name}`)
    }

    if (selectedGroup.value) {
      selectedGroup.value.users_count = groupMemberIds.value.length
    }
    const targetInList = groupsList.value.find(g => g.id === groupId)
    if (targetInList) {
      targetInList.users_count = groupMemberIds.value.length
    }
  } catch (err: any) {
    showToast(getErrorMessage(err, 'Gagal memperbarui keanggotaan'))
  }
}

function getUserRoleName(u: UserItem): string {
  if (!u.role) return ''
  if (typeof u.role === 'string') return u.role
  return u.role.name || ''
}

function getUserUnitName(u: UserItem): string {
  if (!u.unit) return ''
  if (typeof u.unit === 'string') return u.unit
  return u.unit.name || ''
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="panel">
      <div class="panel-head">
        <h2>Grup Akses Dokumen</h2>
        <Button size="small" @click="openAddModal" class="gap-1.5 font-medium">
          <Icon name="plus" :size="14" />
          <span>Tambah Grup</span>
        </Button>
      </div>

      <div class="panel-body">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th style="width: 260px;">Nama Grup</th>
                <th>Anggota</th>
                <th style="width: 220px; text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="3" style="text-align: center; padding: 28px;" class="muted">
                  Memuat data grup akses...
                </td>
              </tr>
              <tr v-for="group in groupsList" :key="group.id || group.name">
                <td>
                  <b>{{ group.name }}</b>
                  <div v-if="group.description" class="muted" style="font-size: 11.5px; margin-top: 2px;">
                    {{ group.description }}
                  </div>
                </td>
                <td class="muted" style="font-size: 12.5px;">
                  {{ memberSummary(group) }}
                </td>
                <td style="text-align: right;">
                  <div class="flex items-center justify-end gap-2">
                    <Button 
                      label="Kelola Anggota" 
                      severity="secondary" 
                      text 
                      size="small" 
                      @click="openMemberModal(group)" 
                    />
                    <button class="iconbtn" title="Edit Grup" @click="openEditModal(group)">
                      <Icon name="edit" :size="14" />
                    </button>
                    <button class="iconbtn" title="Hapus Grup" @click="deleteGroup(group)">
                      <Icon name="trash" :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!loading && groupsList.length === 0">
                <td colspan="3" class="empty">
                  <Icon name="group" :size="28" />
                  <div>Belum ada grup akses terdaftar</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PrimeVue Dialog Tambah / Edit Grup -->
    <Dialog
      v-model:visible="isFormModalOpen"
      modal
      :header="isEditing ? 'Edit Grup Akses' : 'Tambah Grup Akses Baru'"
      :style="{ width: '450px' }"
    >
      <form @submit.prevent="submitGroup" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="group-name" class="text-xs font-semibold" style="color: var(--text-muted)">
            Nama Grup
          </label>
          <InputText 
            id="group-name"
            v-model="form.name" 
            placeholder="mis. Tim Audit Lintas Unit" 
            fluid 
            required 
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="group-desc" class="text-xs font-semibold" style="color: var(--text-muted)">
            Deskripsi
          </label>
          <Textarea 
            id="group-desc"
            v-model="form.description" 
            placeholder="Tujuan grup akses ini (opsional)" 
            rows="3" 
            fluid 
            autoResize 
          />
        </div>

        <p v-if="!isEditing" class="muted text-xs -mt-1 mb-0">
          Anggota grup dapat ditambahkan setelah grup dibuat melalui tombol "Kelola Anggota".
        </p>

        <div class="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button 
            type="button" 
            label="Batal" 
            severity="secondary" 
            text 
            @click="closeFormModal" 
          />
          <Button 
            type="submit" 
            :label="submitting ? 'Menyimpan...' : (isEditing ? 'Perbarui Grup' : 'Simpan Grup')" 
            :loading="submitting"
          >
            <template #icon>
              <Icon :name="isEditing ? 'check' : 'plus'" :size="14" />
            </template>
          </Button>
        </div>
      </form>
    </Dialog>

    <!-- PrimeVue Dialog Kelola Anggota -->
    <Dialog
      v-model:visible="isMemberModalOpen"
      modal
      :header="`Kelola Anggota: ${selectedGroup?.name || ''}`"
      :style="{ width: '500px' }"
    >
      <div v-if="loadingMembers" class="muted py-4 text-center">
        Memuat anggota grup...
      </div>
      <template v-else>
        <p class="muted text-xs mb-3">
          Pilih pengguna yang tergabung dalam grup akses ini:
        </p>
        <div class="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
          <div 
            v-for="u in allUsers.filter(x => getUserRoleName(x).toLowerCase() !== 'admin')" 
            :key="u.id"
            class="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] cursor-pointer transition"
            @click="toggleMember(u)"
          >
            <div>
              <div class="font-medium text-sm text-[var(--text)]">{{ u.name }}</div>
              <div class="text-xs text-[var(--text-muted)] mt-0.5">
                {{ u.email }} · {{ getUserUnitName(u) || getUserRoleName(u) }}
              </div>
            </div>
            <Checkbox 
              :modelValue="isMember(u.id)" 
              :binary="true"
              @click.stop="toggleMember(u)"
            />
          </div>
        </div>
      </template>

      <template #footer>
        <Button label="Selesai" @click="closeMemberModal" />
      </template>
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
