<script setup lang="ts">
import { ref, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { users, groups } from '../../data/sampleData'

const groupDialog = ref(false)
const memberDialog = ref(false)
const editingGroup = ref<any | null>(null)
const form = ref({ name: '' })
const selectedGroup = ref<any | null>(null)

const eligibleMembers = computed(() => users.filter(u => u.role === 'Pengelola' || u.role === 'Pengguna'))

const groupStats = computed(() => groups.map(g => {
  const names = g.memberIds.map(id => { const u = users.find(x => x.id === id); return u ? u.name + ' (' + u.unit + ')' : '?'; }).join(', ')
  return { ...g, names, memberCount: g.memberIds.length }
}))

const openAddGroup = () => {
  editingGroup.value = null
  form.value = { name: '' }
  groupDialog.value = true
}

const saveGroup = () => {
  if (!form.value.name.trim()) { alert('Nama grup wajib diisi'); return }
  if (groups.some(g => g.name.toLowerCase() === form.value.name.toLowerCase() && g !== editingGroup.value)) {
    alert('Grup dengan nama itu sudah ada'); return
  }
  if (editingGroup.value) {
    Object.assign(editingGroup.value, form.value)
  } else {
    groups.push({ id: 'g' + Date.now(), name: form.value.name, memberIds: [] })
  }
  groupDialog.value = false
}

const openMembers = (group: any) => {
  selectedGroup.value = group
  memberDialog.value = true
}

const toggleMember = (group: any, userId: string) => {
  if (group.memberIds.includes(userId)) group.memberIds = group.memberIds.filter((id: string) => id !== userId)
  else group.memberIds.push(userId)
}

const deleteGroup = (groupId: string) => {
  const g = groups.find(x => x.id === groupId)
  if (!g) return
  if (!confirm('Hapus grup "' + g.name + '"?')) return
  const idx = groups.findIndex(x => x.id === groupId)
  if (idx >= 0) groups.splice(idx, 1)
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="panel">
      <div class="panel-head">
        <h2>Grup Akses</h2>
        <Button label="Tambah Grup" icon="pi pi-plus" class="p-button-sm" @click="openAddGroup" />
      </div>
      <div class="panel-body">
        <DataTable :value="groupStats" :paginator="true" :rows="10" responsiveLayout="scroll">
          <Column field="name" header="Nama Grup" style="min-width: 200px">
            <template #body="slotProps"><b>{{ slotProps.data.name }}</b></template>
          </Column>
          <Column field="names" header="Anggota" style="min-width: 250px">
            <template #body="slotProps"><span class="muted">{{ slotProps.data.names || '—' }}</span></template>
          </Column>
          <Column field="memberCount" header="Jumlah" style="width: 100px" headerStyle="text-align:center">
            <template #body="slotProps"><span class="muted">{{ slotProps.data.memberCount }}</span></template>
          </Column>
          <Column header="" style="width: 160px">
            <template #body="slotProps">
              <div style="display:flex;gap:6px;justify-content:flex-end">
                <Button label="Kelola Anggota" severity="secondary" outlined size="small" @click="openMembers(slotProps.data)" />
                <Button icon="pi pi-trash" severity="danger" outlined size="small" @click="deleteGroup(slotProps.data.id)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <Dialog v-model:visible="groupDialog" :header="editingGroup ? 'Edit Grup' : 'Tambah Grup'" :style="{ width: '480px' }" :modal="true">
      <div class="flex flex-col gap-3">
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text)">Nama Grup</label>
          <InputText v-model="form.name" placeholder="mis. Tim Pengadaan Lintas Unit" />
        </div>
        <p class="muted" style="margin: 0; font-size: 12px">Anggota ditambahkan setelah grup dibuat, lewat "Kelola Anggota".</p>
      </div>
      <template #footer>
        <Button label="Batal" text @click="groupDialog = false" />
        <Button :label="editingGroup ? 'Simpan' : 'Tambah'" @click="saveGroup" />
      </template>
    </Dialog>

    <Dialog v-model:visible="memberDialog" :header="'Kelola Anggota — ' + (selectedGroup?.name || '')" :style="{ width: '520px' }" :modal="true">
      <div class="flex flex-col gap-3" style="max-height: 300px; overflow-y: auto;">
        <p class="muted" style="margin: 0; font-size: 12px">Anggota grup hanya boleh Pengelola atau Pengguna (lintas unit).</p>
        <div v-for="u in eligibleMembers" :key="u.id" class="chk" style="padding: 6px 8px; border: 1px solid var(--border); border-radius: 8px; display:flex;align-items:center;gap:8px">
          <input type="checkbox" :checked="selectedGroup?.memberIds?.includes(u.id)" @change="toggleMember(selectedGroup, u.id)" />
          <span>{{ u.name }} <span class="muted">({{ u.role }} — {{ u.unit }})</span></span>
        </div>
      </div>
      <template #footer>
        <Button label="Selesai" @click="memberDialog = false" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
.panel-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.panel-head h2 { margin: 0; font-size: 15px; font-weight: 600; color: var(--text); }
.panel-body { padding: 0; }
.muted { color: var(--text-muted); }
.chk { cursor: pointer; }
</style>