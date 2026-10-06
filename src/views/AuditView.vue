<script setup lang="ts">
import { ref } from 'vue'
import Select from 'primevue/select'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const logs: Record<string, string>[] = []

const user = ref<string | null>(null)
const action = ref<string | null>(null)
const users = ['Bhadriko', 'Admin', 'Pengelola']
const actions = ['Unggah', 'Unduh', 'Hapus', 'Pulihkan', 'Edit', 'Lihat']

function exportCsv() {
  // simulate export like prototype exportAudit()
  const blob = new Blob(['Waktu,Pengguna,Aksi,Objek,IP\n'], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'log-audit.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="panel">
      <div class="panel-body">
        <div class="filters" style="align-items:center">
          <Select v-model="user" :options="users" placeholder="Semua pengguna" showClear class="min-w-[170px]" />
          <Select v-model="action" :options="actions" placeholder="Semua aksi" showClear class="min-w-[170px]" />
          <Button
            label="Ekspor CSV"
            icon="pi pi-download"
            severity="secondary"
            text
            class="export-btn"
            style="margin-left:auto"
            @click="exportCsv"
          />
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-body p-0">
        <DataTable :value="logs">
          <template #empty>
            <div class="empty">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>
              </svg>
              <div>Belum ada log.</div>
            </div>
          </template>
          <Column field="time" header="Waktu"></Column>
          <Column field="user" header="Pengguna"></Column>
          <Column field="action" header="Aksi"></Column>
          <Column field="object" header="Objek"></Column>
          <Column field="ip" header="IP Address"></Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.export-btn) {
  font-weight: 600 !important;
  font-size: 13px !important;
}
</style>
