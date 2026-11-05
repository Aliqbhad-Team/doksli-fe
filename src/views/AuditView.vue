<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Paginator from 'primevue/paginator'
import ProgressSpinner from 'primevue/progressspinner'
import { useDocumentsStore } from '../stores/documents'

const store = useDocumentsStore()

const selectedUser = ref<string>('')
const selectedAction = ref<string>('')

const first = ref(0)
const rows = 10

watch([selectedUser, selectedAction], () => {
  first.value = 0
})

// Unique users from audit log
const availableUsers = computed(() => {
  const set = new Set<string>()
  store.auditLog.forEach(l => {
    if (l.user) set.add(l.user)
  })
  return Array.from(set).sort()
})

// Unique actions from audit log
const availableActions = computed(() => {
  const set = new Set<string>()
  store.auditLog.forEach(l => {
    if (l.action) set.add(l.action)
  })
  return Array.from(set).sort()
})

// Filtered logs
const filteredLogs = computed(() => {
  return store.auditLog.filter(log => {
    if (selectedUser.value && log.user !== selectedUser.value) return false
    if (selectedAction.value && log.action !== selectedAction.value) return false
    return true
  })
})

const paginatedLogs = computed(() => {
  return filteredLogs.value.slice(first.value, first.value + rows)
})

// Export CSV handler
function exportCsv() {
  const rows = [
    ['Waktu', 'Pengguna', 'Aksi', 'Objek', 'IP'],
    ...filteredLogs.value.map(l => [
      `"${l.time}"`,
      `"${l.user}"`,
      `"${l.action}"`,
      `"${l.object.replace(/"/g, '""')}"`,
      `"${l.ip}"`,
    ]),
  ]

  const csvContent = rows.map(e => e.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `log-audit-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Filter bar -->
    <div class="panel">
      <div class="panel-body">
        <div class="filters flex items-center justify-between gap-3 w-full flex-wrap">
          <div class="flex items-center gap-3 flex-wrap">
            <Select 
              v-model="selectedUser" 
              :options="['', ...availableUsers]" 
              placeholder="Semua pengguna"
              class="min-w-[180px]"
              size="small"
            >
              <template #value="slotProps">
                <span>{{ slotProps.value || 'Semua pengguna' }}</span>
              </template>
              <template #option="slotProps">
                <span>{{ slotProps.option || 'Semua pengguna' }}</span>
              </template>
            </Select>

            <Select 
              v-model="selectedAction" 
              :options="['', ...availableActions]" 
              placeholder="Semua aksi"
              class="min-w-[160px]"
              size="small"
            >
              <template #value="slotProps">
                <span>{{ slotProps.value || 'Semua aksi' }}</span>
              </template>
              <template #option="slotProps">
                <span>{{ slotProps.option || 'Semua aksi' }}</span>
              </template>
            </Select>
          </div>

          <Button 
            label="Ekspor CSV"
            icon="pi pi-download"
            severity="secondary" 
            text 
            size="small" 
            class="export-btn shrink-0 whitespace-nowrap ml-auto"
            @click="exportCsv"
          />
        </div>
      </div>
    </div>

    <!-- Audit Log Table Panel -->
    <div class="panel">
      <div class="table-scroll">
        <table class="audit-table">
          <thead>
            <tr>
              <th style="width: 190px">WAKTU</th>
              <th style="width: 180px">PENGGUNA</th>
              <th style="width: 220px">AKSI</th>
              <th>OBJEK</th>
              <th style="width: 130px">IP</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="5" style="text-align: center; padding: 32px;" class="muted">
                <div class="flex flex-col items-center justify-center gap-2">
                  <ProgressSpinner style="width: 32px; height: 32px" strokeWidth="4" />
                  <span>Memuat data log audit...</span>
                </div>
              </td>
            </tr>

            <tr v-else-if="filteredLogs.length === 0">
              <td colspan="5">
                <div class="empty">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>
                  </svg>
                  <div>Tidak ada catatan yang cocok.</div>
                </div>
              </td>
            </tr>

            <tr v-else v-for="log in paginatedLogs" :key="log.id">
              <td class="num">{{ log.time }}</td>
              <td class="audit-user">{{ log.user }}</td>
              <td class="audit-action">{{ log.action }}</td>
              <td class="muted audit-object">{{ log.object }}</td>
              <td class="num">{{ log.ip }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Numeric Pagination (PrimeVue) -->
      <div class="border-t border-[var(--border)] p-2 flex justify-center">
        <Paginator
          v-model:first="first"
          :rows="rows"
          :totalRecords="filteredLogs.length"
          :alwaysShow="true"
          @page="(e) => first = e.first"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.export-btn {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  font-weight: 600 !important;
  font-size: 13px !important;
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
}

.audit-table th {
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--text-muted);
  font-weight: 600;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.audit-table td {
  padding: 13px 16px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  font-size: 13.5px;
}

.audit-table tr:last-child td {
  border-bottom: none;
}

.audit-user {
  color: var(--text);
  font-weight: 500;
  white-space: nowrap;
}

.audit-action {
  color: var(--text);
  white-space: nowrap;
}

.audit-object {
  color: var(--text-muted);
}
</style>
