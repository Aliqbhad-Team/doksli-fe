<script setup lang="ts">
import { ref, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { categories, documents } from '../../data/sampleData'

const catDialog = ref(false)
const editingCat = ref<any | null>(null)
const form = ref({ name: '' })

const catStats = computed(() => categories.map(c => {
  const count = documents.filter(d => d.category === c.name).length
  return { ...c, count }
}))

const openAddCat = () => {
  editingCat.value = null
  form.value = { name: '' }
  catDialog.value = true
}

const saveCat = () => {
  if (!form.value.name.trim()) { alert('Nama kategori wajib diisi'); return }
  if (categories.some(c => c.name.toLowerCase() === form.value.name.toLowerCase() && c !== editingCat.value)) {
    alert('Kategori dengan nama itu sudah ada'); return
  }
  if (editingCat.value) {
    const oldName = editingCat.value.name
    editingCat.value.name = form.value.name
    documents.filter(d => d.category === oldName).forEach(d => d.category = form.value.name)
  } else {
    categories.push({ id: 'c' + Date.now(), name: form.value.name })
  }
  catDialog.value = false
}

const deleteCat = (catId: string) => {
  const c = categories.find(x => x.id === catId)
  if (!c) return
  if (documents.some(d => d.category === c.name)) { alert('Kategori "' + c.name + '" masih dipakai dokumen'); return }
  if (!confirm('Hapus kategori "' + c.name + '"?')) return
  const idx = categories.findIndex(x => x.id === catId)
  if (idx >= 0) categories.splice(idx, 1)
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="panel">
      <div class="panel-head">
        <h2>Master Categories</h2>
        <Button label="Tambah Kategori" icon="pi pi-plus" class="p-button-sm" @click="openAddCat" />
      </div>
      <div class="panel-body">
        <DataTable :value="catStats" :paginator="true" :rows="10" responsiveLayout="scroll">
          <Column field="name" header="Nama Kategori" style="min-width: 250px" />
          <Column field="count" header="Jumlah Dokumen" style="width: 160px" headerStyle="text-align:center">
            <template #body="slotProps"><span class="num">{{ slotProps.data.count }}</span></template>
          </Column>
          <Column header="" style="width: 60px">
            <template #body="slotProps">
              <Button icon="pi pi-trash" severity="danger" outlined size="small" @click="deleteCat(slotProps.data.id)" />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <Dialog v-model:visible="catDialog" :header="editingCat ? 'Edit Kategori' : 'Tambah Kategori'" :style="{ width: '480px' }" :modal="true">
      <div class="flex flex-col gap-3">
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text)">Nama Kategori</label>
          <InputText v-model="form.name" placeholder="mis. Legal" />
        </div>
      </div>
      <template #footer>
        <Button label="Batal" text @click="catDialog = false" />
        <Button :label="editingCat ? 'Simpan' : 'Tambah'" @click="saveCat" />
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