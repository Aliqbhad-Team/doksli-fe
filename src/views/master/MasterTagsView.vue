<script setup lang="ts">
import { ref, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { tags, documents } from '../../data/sampleData'

const tagDialog = ref(false)
const editingTag = ref<any | null>(null)
const form = ref({ name: '' })

const tagStats = computed(() => tags.map(t => {
  const count = documents.filter(d => d.tags?.includes(t.name)).length
  return { ...t, count }
}))

const openAddTag = () => {
  editingTag.value = null
  form.value = { name: '' }
  tagDialog.value = true
}

const saveTag = () => {
  if (!form.value.name.trim()) { alert('Nama tag wajib diisi'); return }
  if (tags.some(t => t.name.toLowerCase() === form.value.name.toLowerCase() && t !== editingTag.value)) {
    alert('Tag dengan nama itu sudah ada'); return
  }
  if (editingTag.value) {
    const oldName = editingTag.value.name
    editingTag.value.name = form.value.name
    documents.forEach(d => {
      const idx = d.tags?.indexOf(oldName)
      if (idx !== undefined && idx >= 0) d.tags[idx] = form.value.name
    })
  } else {
    tags.push({ id: 't' + Date.now(), name: form.value.name })
  }
  tagDialog.value = false
}

const deleteTag = (tagId: string) => {
  const t = tags.find(x => x.id === tagId)
  if (!t) return
  if (documents.some(d => d.tags?.includes(t.name))) { alert('Tag "' + t.name + '" masih dipakai dokumen'); return }
  if (!confirm('Hapus tag "' + t.name + '"?')) return
  const idx = tags.findIndex(x => x.id === tagId)
  if (idx >= 0) tags.splice(idx, 1)
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="panel">
      <div class="panel-head">
        <h2>Master Tags</h2>
        <Button label="Tambah Tag" icon="pi pi-plus" class="p-button-sm" @click="openAddTag" />
      </div>
      <div class="panel-body">
        <DataTable :value="tagStats" :paginator="true" :rows="10" responsiveLayout="scroll">
          <Column field="name" header="Nama Tag" style="min-width: 250px" />
          <Column field="count" header="Jumlah Dokumen" style="width: 160px" headerStyle="text-align:center">
            <template #body="slotProps"><span class="num">{{ slotProps.data.count }}</span></template>
          </Column>
          <Column header="" style="width: 60px">
            <template #body="slotProps">
              <Button icon="pi pi-trash" severity="danger" outlined size="small" @click="deleteTag(slotProps.data.id)" />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <Dialog v-model:visible="tagDialog" :header="editingTag ? 'Edit Tag' : 'Tambah Tag'" :style="{ width: '480px' }" :modal="true">
      <div class="flex flex-col gap-3">
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text)">Nama Tag</label>
          <InputText v-model="form.name" placeholder="mis. rahasia" />
        </div>
      </div>
      <template #footer>
        <Button label="Batal" text @click="tagDialog = false" />
        <Button :label="editingTag ? 'Simpan' : 'Tambah'" @click="saveTag" />
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