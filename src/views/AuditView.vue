<script setup lang="ts">
import { ref } from 'vue'
import Select from 'primevue/select'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const logs: Record<string, string>[] = [
  {
    time: '21 Oct 2026, 14:32',
    user: 'Ahmad Ridho',
    action: 'Unggah dokumen',
    object: 'Kontrak Pemeliharaan HVAC 2026',
    ip: '192.168.1.45'
  },
  {
    time: '21 Oct 2026, 13:15',
    user: 'Dewi Kusuma',
    action: 'Pindahkan ke tempat sampah',
    object: 'Draft Laporan Q3',
    ip: '192.168.1.78'
  },
  {
    time: '21 Oct 2026, 11:45',
    user: 'Ahmad Ridho',
    action: 'Unduh dokumen',
    object: 'Laporan Audit Triwulan III',
    ip: '192.168.1.45'
  },
  {
    time: '21 Oct 2026, 10:20',
    user: 'System',
    action: 'Membuat folder',
    object: 'Arsip Legal 2026',
    ip: '127.0.0.1'
  },
  {
    time: '20 Oct 2026, 16:55',
    user: 'Siti Nurhaliza',
    action: 'Pulihkan',
    object: 'MOU Kerjasama Gedung',
    ip: '192.168.1.102'
  },
  {
    time: '20 Oct 2026, 14:30',
    user: 'Budi Santoso',
    action: 'Edit metadata',
    object: 'Kontrak Sewa Lokasi',
    ip: '192.168.1.88'
  }
]

const user = ref<string | null>(null)
const action = ref<string | null>(null)
const users = ['Ahmad Ridho', 'Dewi Kusuma', 'Siti Nurhaliza', 'Budi Santoso', 'System']
const actions = ['Unggah dokumen', 'Unduh dokumen', 'Pindahkan ke tempat sampah', 'Pulihkan', 'Edit metadata', 'Membuat folder']

function exportCsv() {
  const csv = 'Waktu,Pengguna,Aksi,Objek,IP\n' + logs
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
  <div class="flex flex-col gap-3">
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
        <DataTable :value="logs">
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
</style>