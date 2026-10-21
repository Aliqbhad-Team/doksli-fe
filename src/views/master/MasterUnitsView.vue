<script setup lang="ts">
import { ref, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { users, folders, units } from '../../data/sampleData'

const unitDialog = ref(false)
const editingUnit = ref<any | null>(null)
const form = ref({ name: '', description: '' })

const unitStats = computed(() => units.map(u => {
  const pengelola = users.filter(x => x.role === 'Pengelola' && x.unit === u.name).length
  const pengguna = users.filter(x => x.role === 'Pengguna' && x.unit === u.name).length
  const nFolders = folders.filter(f => f.unitId === u.name).length
  return { ...u, pengelola, pengguna, nFolders, inUse: pengelola + pengguna + nFolders > 0 }
}))

const openAddUnit = () => {
  editingUnit.value = null
  form.value = { name: '', description: '' }
  unitDialog.value = true
}

const saveUnit = () => {
  if (!form.value.name.trim()) { alert('Nama unit wajib diisi'); return }
  if (units.some(u => u.name.toLowerCase() === form.value.name.toLowerCase() && u !== editingUnit.value)) {
    alert('Unit dengan nama itu sudah ada'); return
  }
  if (editingUnit.value) {
    Object.assign(editingUnit.value, form.value)
  } else {
    units.push({ name: form.value.name, description: form.value.description })
  }
  unitDialog.value = false
}

const deleteUnit = (name: string) => {
  const stat = unitStats.value.find(s => s.name === name)
  if (!stat) return
  if (stat.inUse) { alert('Unit "' + name + '" masih dipakai dan tidak bisa dihapus'); return }
  if (!confirm('Hapus unit "' + name + '"?')) return
  const idx = units.findIndex(x => x.name === name)
  if (idx >= 0) units.splice(idx, 1)
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="panel">
      <div class="panel-head">
        <h2>Master Unit</h2>
        <Button label="Tambah Unit" icon="pi pi-plus" class="p-button-sm" @click="openAddUnit" />
      </div>
      <div class="panel-body">
        <DataTable :value="unitStats" :paginator="true" :rows="10" responsiveLayout="scroll">
          <Column field="name" header="Nama Unit" style="min-width: 180px">
            <template #body="slotProps"><b>{{ slotProps.data.name }}</b></template>
          </Column>
          <Column field="description" header="Deskripsi" style="min-width: 250px">
            <template #body="slotProps"><span class="muted">{{ slotProps.data.description || '—' }}</span></template>
          </Column>
          <Column field="pengelola" header="Pengelola" style="width: 100px" headerStyle="text-align:center">
            <template #body="slotProps"><span class="num">{{ slotProps.data.pengelola }}</span></template>
          </Column>
          <Column field="pengguna" header="Pengguna" style="width: 100px" headerStyle="text-align:center">
            <template #body="slotProps"><span class="num">{{ slotProps.data.pengguna }}</span></template>
          </Column>
          <Column field="nFolders" header="Folder" style="width: 100px" headerStyle="text-align:center">
            <template #body="slotProps"><span class="num">{{ slotProps.data.nFolders }}</span></template>
          </Column>
          <Column header="" style="width: 60px">
            <template #body="slotProps">
              <Button
                icon="pi pi-trash"
                severity="secondary"
                outlined
                size="small"
                :disabled="slotProps.data.inUse"
                :title="slotProps.data.inUse ? 'Tidak bisa dihapus — masih dipakai' : 'Hapus unit'"
                @click="deleteUnit(slotProps.data.name)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <Dialog v-model:visible="unitDialog" :header="editingUnit ? 'Edit Unit' : 'Tambah Unit'" :style="{ width: '480px' }" :modal="true">
      <div class="flex flex-col gap-3">
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text)">Nama Unit</label>
          <InputText v-model="form.name" placeholder="mis. Pengadaan" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text)">Deskripsi</label>
          <Textarea v-model="form.description" placeholder="Opsional" rows="3" />
        </div>
      </div>
      <template #footer>
        <Button label="Batal" text @click="unitDialog = false" />
        <Button :label="editingUnit ? 'Simpan' : 'Tambah'" @click="saveUnit" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
.panel-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.panel-head h2 { margin: 0; font-size: 15px; font-weight: 600; color: var(--text); }
.panel-body { padding: 0; }
.num { display: inline-flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 13px; }
.muted { color: var(--text-muted); }
</style>