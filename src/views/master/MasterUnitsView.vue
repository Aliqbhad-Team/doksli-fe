<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Icon from '../../components/Icon.vue'
import api from '../../services/api'
import { users, folders } from '../../data/sampleData'
import { useAppConfirm } from '../../composables/useAppConfirm'

interface UnitItem {
  id?: string
  name: string
  description?: string
  users_count?: number
}

const { confirmDelete } = useAppConfirm()
const unitsList = ref<UnitItem[]>([])
const loading = ref(false)
const submitting = ref(false)
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingUnitId = ref<string | null>(null)

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
    return 'Akses ditolak: Hanya Admin yang dapat mengelola unit kerja.'
  }
  return err.response?.data?.message || fallback
}

async function fetchUnits() {
  loading.value = true
  try {
    const res = await api.get('/v1/units')
    unitsList.value = res.data?.data ?? []
  } catch (err: any) {
    showToast(getErrorMessage(err, 'Gagal memuat daftar unit kerja'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUnits()
})

function getUnitFoldersCount(name: string): number {
  return folders.filter(
    f => f.name.toLowerCase() === name.toLowerCase() || (f as any).unit?.toLowerCase() === name.toLowerCase()
  ).length
}

function getUnitUsersCount(unit: UnitItem): number {
  if (typeof unit.users_count === 'number') {
    return unit.users_count
  }
  return users.filter(u => u.unit?.toLowerCase() === unit.name.toLowerCase()).length
}

function openAddModal() {
  isEditing.value = false
  editingUnitId.value = null
  form.value = {
    name: '',
    description: '',
  }
  isModalOpen.value = true
}

function openEditModal(unit: UnitItem) {
  isEditing.value = true
  editingUnitId.value = unit.id ?? null
  form.value = {
    name: unit.name,
    description: unit.description || '',
  }
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

async function submitUnit() {
  const name = form.value.name.trim()
  const description = form.value.description.trim()

  if (!name) {
    showToast('Nama unit wajib diisi')
    return
  }

  submitting.value = true
  try {
    if (isEditing.value && editingUnitId.value) {
      await api.put(`/v1/units/${editingUnitId.value}`, {
        name,
        description,
      })
      showToast(`Unit "${name}" berhasil diperbarui`)
    } else {
      await api.post('/v1/units', {
        name,
        description,
      })
      showToast(`Unit "${name}" berhasil ditambahkan`)
    }
    closeModal()
    await fetchUnits()
  } catch (err: any) {
    const defaultErr = isEditing.value ? 'Gagal memperbarui unit' : 'Gagal menambahkan unit'
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

function deleteUnit(unit: UnitItem) {
  if (!unit.id) {
    showToast('ID unit tidak valid')
    return
  }

  confirmDelete({
    title: 'Hapus Unit Kerja',
    message: `Apakah Anda yakin ingin menghapus unit "${unit.name}"?`,
    submessage: 'Unit tidak dapat dihapus jika masih digunakan oleh pengguna atau folder.',
    confirmLabel: 'Hapus Unit',
    onAccept: async () => {
      try {
        await api.delete(`/v1/units/${unit.id}`)
        showToast(`Unit "${unit.name}" telah dihapus`)
        await fetchUnits()
      } catch (err: any) {
        showToast(getErrorMessage(err, 'Gagal menghapus unit'))
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
  <div class="flex flex-col gap-5">
    <div class="panel">
      <div class="panel-head">
        <h2>Master Unit Kerja</h2>
        <Button size="small" @click="openAddModal" class="gap-1.5 font-medium">
          <Icon name="plus" :size="14" />
          <span>Tambah Unit</span>
        </Button>
      </div>

      <div class="panel-body">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th style="width: 200px;">Nama Unit</th>
                <th>Deskripsi</th>
                <th style="width: 120px; text-align: center;">Pengguna</th>
                <th style="width: 120px; text-align: center;">Folder</th>
                <th style="width: 90px; text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="5" style="text-align: center; padding: 28px;" class="muted">
                  Memuat data unit kerja...
                </td>
              </tr>
              <tr v-for="unit in unitsList" :key="unit.id || unit.name">
                <td>
                  <b>{{ unit.name }}</b>
                </td>
                <td class="muted">{{ unit.description || '—' }}</td>
                <td class="num" style="text-align: center;">{{ getUnitUsersCount(unit) }}</td>
                <td class="num" style="text-align: center;">{{ getUnitFoldersCount(unit.name) }}</td>
                <td style="text-align: right;">
                  <div style="display: inline-flex; gap: 4px; align-items: center; justify-content: flex-end;">
                    <button 
                      class="iconbtn" 
                      title="Edit Unit"
                      @click="openEditModal(unit)"
                    >
                      <Icon name="edit" :size="14" />
                    </button>
                    <button 
                      class="iconbtn" 
                      title="Hapus Unit"
                      @click="deleteUnit(unit)"
                    >
                      <Icon name="trash" :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!loading && unitsList.length === 0">
                <td colspan="5" class="empty">
                  <Icon name="building" :size="28" />
                  <div>Belum ada unit kerja terdaftar</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PrimeVue Dialog Tambah / Edit Unit -->
    <Dialog
      v-model:visible="isModalOpen"
      modal
      :header="isEditing ? 'Edit Unit Kerja' : 'Tambah Unit Kerja Baru'"
      :style="{ width: '440px' }"
    >
      <form @submit.prevent="submitUnit" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="unit-name" class="text-xs font-semibold" style="color: var(--text-muted)">
            Nama Unit
          </label>
          <InputText 
            id="unit-name"
            v-model="form.name" 
            placeholder="mis. Pengadaan & Logistik" 
            fluid 
            required 
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="unit-desc" class="text-xs font-semibold" style="color: var(--text-muted)">
            Deskripsi
          </label>
          <Textarea 
            id="unit-desc"
            v-model="form.description" 
            placeholder="Penjelasan tugas unit kerja ini (opsional)" 
            rows="3" 
            fluid 
            autoResize 
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
            :label="submitting ? 'Menyimpan...' : (isEditing ? 'Perbarui Unit' : 'Simpan Unit')" 
            :loading="submitting"
          >
            <template #icon>
              <Icon :name="isEditing ? 'check' : 'plus'" :size="14" />
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
