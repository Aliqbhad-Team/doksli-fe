<script setup lang="ts">
import { ref, computed } from 'vue'
import Select from 'primevue/select'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { auditLog } from '../data/sampleData'

const user = ref<string | null>(null)
const action = ref<string | null>(null)
const users = [...new Set(auditLog.map(l => l.user))].sort()
const actions = [...new Set(auditLog.map(l => l.action))].sort()

const filteredLogs = computed(() => {
  let logs = auditLog
  if (user.value) logs = logs.filter(l => l.user === user.value)
  if (action.value) logs = logs.filter(l => l.action === action.value)
  return logs
})

function exportCsv() {
  const csv = 'Waktu,Pengguna,Aksi,Objek,IP\n' + filteredLogs.value
    .map(r => `"${r.time}","${r.user}","${r.action}","${r.object}","${r.ip}"`)
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="panel">
      <div class="panel-body">
        <div class="filters" style="align-items:center">
          <Select
            v-model="user"
            :options="users"
            placeholder="Semua pengguna"
            showClear
            class="min-w-[170px]"
          />
          <Select
            v-model="action"
            :options="actions"
            placeholder="Semua aksi"
            showClear
            class="min-w-[170px]"
          />
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
        <DataTable :value="filteredLogs" :paginator="true" :rows="10" responsiveLayout="scroll">
          <template #empty>
            <div class="empty">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>
              </svg>
              <div>Belum ada log.</div>
            </div>
          </template>
          <Column field="time" header="Waktu" style="width: 150px"></Column>
          <Column field="user" header="Pengguna" style="width: 140px"></Column>
          <Column field="action" header="Aksi" style="width: 160px"></Column>
          <Column field="object" header="Objek" style="width: auto"></Column>
          <Column field="ip" header="IP" style="width: 130px"></Column>
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
.filters { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.filters :deep(.p-select) { min-width: 170px; }
:deep(.p-datatable-thead > tr > th) {
  background: var(--surface) !important;
  color: var(--text-muted) !important;
  font-size: 11px !important;
  text-transform: uppercase !important;
  letter-spacing: .04em !important;
  font-weight: 600 !important;
  padding: 8px 10px !important;
  border-bottom: 1px solid var(--border) !important;
  white-space: nowrap !important;
}
:deep(.p-datatable-tbody > tr > td) {
  padding: 10px !important;
  border-bottom: 1px solid var(--border) !important;
  font-size: 13px !important;
  vertical-align: middle !important;
  background: var(--surface) !important;
}
:deep(.p-datatable-tbody > tr:last-child > td) { border-bottom: none !important; }
:deep(.p-datatable-emptymessage > td) { padding: 0 !important; border: none !important; }
.empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px; color: var(--text-muted); text-align: center; }
.empty svg { opacity: 0.4; }
</style>