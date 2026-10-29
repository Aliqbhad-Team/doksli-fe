<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Icon from '../../components/Icon.vue'
import api from '../../services/api'
import { useAppConfirm } from '../../composables/useAppConfirm'

interface CategoryItem {
  id?: string
  name: string
  created_by?: string
  created_dt?: string
}

const { confirmDelete } = useAppConfirm()
const categoriesList = ref<CategoryItem[]>([])
const loading = ref(false)
const submitting = ref(false)
const isModalOpen = ref(false)
const editingCategory = ref<CategoryItem | null>(null)
const catName = ref('')
const toastMessage = ref('')
const toastVisible = ref(false)

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
    return 'Akses ditolak: Hanya Admin yang dapat mengelola kategori.'
  }
  return err.response?.data?.message || fallback
}

async function fetchCategories() {
  loading.value = true
  try {
    const res = await api.get('/v1/categories')
    categoriesList.value = res.data?.data ?? []
  } catch (err: any) {
    showToast(getErrorMessage(err, 'Gagal memuat kategori'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCategories()
})

function categoryBadge(name: string) {
  const vars: Record<string, { bg: string; fg: string }> = {
    Kontrak: { bg: 'var(--accent-soft)', fg: 'var(--accent)' },
    Keuangan: { bg: 'var(--success-soft)', fg: 'var(--success)' },
    SDM: { bg: 'var(--warning-soft)', fg: 'var(--warning)' },
    Legal: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
    Korespondensi: { bg: 'var(--locked-soft)', fg: 'var(--locked)' },
  }
  return vars[name] || { bg: 'var(--surface-2)', fg: 'var(--text-muted)' }
}

function openAddModal() {
  editingCategory.value = null
  catName.value = ''
  isModalOpen.value = true
}

function openEditModal(cat: CategoryItem) {
  editingCategory.value = cat
  catName.value = cat.name
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingCategory.value = null
}

async function submitCategory() {
  const name = catName.value.trim()
  if (!name) {
    showToast('Nama kategori wajib diisi')
    return
  }

  submitting.value = true
  try {
    if (editingCategory.value?.id) {
      await api.put(`/v1/categories/${editingCategory.value.id}`, { name })
      showToast(`Kategori "${name}" berhasil diperbarui`)
    } else {
      await api.post('/v1/categories', { name })
      showToast(`Kategori "${name}" berhasil ditambahkan`)
    }
    closeModal()
    await fetchCategories()
  } catch (err: any) {
    const defaultErr = editingCategory.value ? 'Gagal memperbarui kategori' : 'Gagal menambahkan kategori'
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

function deleteCategory(cat: CategoryItem) {
  if (!cat.id) return

  confirmDelete({
    title: 'Hapus Kategori Dokumen',
    message: `Apakah Anda yakin ingin menghapus kategori "${cat.name}"?`,
    submessage: 'Dokumen yang menggunakan kategori ini mungkin perlu disesuaikan.',
    confirmLabel: 'Hapus Kategori',
    onAccept: async () => {
      try {
        await api.delete(`/v1/categories/${cat.id}`)
        showToast(`Kategori "${cat.name}" dihapus`)
        await fetchCategories()
      } catch (err: any) {
        showToast(getErrorMessage(err, 'Gagal menghapus kategori'))
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
        <h2>Master Kategori Dokumen</h2>
        <Button size="small" @click="openAddModal" class="gap-1.5 font-medium">
          <Icon name="plus" :size="14" />
          <span>Tambah Kategori</span>
        </Button>
      </div>

      <div class="panel-body">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th style="width: 240px;">Nama Kategori</th>
                <th>Pratinjau Label</th>
                <th style="width: 120px; text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="3" style="text-align: center; padding: 28px;" class="muted">
                  Memuat data kategori...
                </td>
              </tr>
              <tr v-for="cat in categoriesList" :key="cat.id">
                <td>
                  <b>{{ cat.name }}</b>
                </td>
                <td>
                  <span 
                    class="pill"
                    :style="{ background: categoryBadge(cat.name).bg, color: categoryBadge(cat.name).fg }"
                  >
                    <span class="dot" :style="{ background: categoryBadge(cat.name).fg }"></span>
                    {{ cat.name }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="flex items-center justify-end gap-2">
                    <Button 
                      label="Edit" 
                      severity="secondary" 
                      text 
                      size="small" 
                      @click="openEditModal(cat)" 
                    />
                    <button class="iconbtn" title="Hapus Kategori" @click="deleteCategory(cat)">
                      <Icon name="trash" :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!loading && categoriesList.length === 0">
                <td colspan="3" class="empty">
                  <Icon name="tag" :size="28" />
                  <div>Belum ada kategori terdaftar</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PrimeVue Dialog Tambah / Edit Kategori -->
    <Dialog
      v-model:visible="isModalOpen"
      modal
      :header="editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'"
      :style="{ width: '400px' }"
    >
      <form @submit.prevent="submitCategory" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="cat-name" class="text-xs font-semibold" style="color: var(--text-muted)">
            Nama Kategori
          </label>
          <InputText 
            id="cat-name"
            v-model="catName" 
            placeholder="mis. Kontrak, Keuangan, SDM" 
            fluid 
            required 
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
            :label="submitting ? 'Menyimpan...' : (editingCategory ? 'Perbarui' : 'Simpan')" 
            :loading="submitting"
          >
            <template #icon>
              <Icon :name="editingCategory ? 'check' : 'plus'" :size="14" />
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
