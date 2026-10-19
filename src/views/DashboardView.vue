<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const recent: Record<string, string>[] = [
  {
    time: '2026-10-19 14:32',
    user: 'Ahmad Ridho',
    action: 'Unggah dokumen',
    object: 'Kontrak Pemeliharaan HVAC 2026'
  },
  {
    time: '2026-10-19 13:15',
    user: 'Dewi Kusuma',
    action: 'Pindahkan ke tempat sampah',
    object: 'Draft Laporan Q3'
  },
  {
    time: '2026-10-19 11:45',
    user: 'Ahmad Ridho',
    action: 'Unduh dokumen',
    object: 'Laporan Audit Triwulan III'
  },
  {
    time: '2026-10-19 10:20',
    user: 'System',
    action: 'Membuat folder baru',
    object: 'Arsip Legal 2026'
  },
  {
    time: '2026-10-18 16:55',
    user: 'Siti Nurhaliza',
    action: 'Pulihkan dari tempat sampah',
    object: 'MOU Kerjasama Gedung'
  },
  {
    time: '2026-10-18 14:30',
    user: 'Budi Santoso',
    action: 'Edit metadata',
    object: 'Kontrak Sewa Lokasi'
  }
]
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="stats">
      <div class="stat">
        <div class="label">Total Dokumen</div>
        <div class="value">28</div>
        <div class="hint">pada folder yang bisa Anda lihat</div>
      </div>
      <div class="stat">
        <div class="label">Penyimpanan Terpakai</div>
        <div class="value">45.2 MB</div>
        <div class="hint">pada folder yang bisa Anda lihat</div>
      </div>
      <div class="stat">
        <div class="label">Tempat Sampah</div>
        <div class="value">3</div>
        <div class="hint">dokumen terhapus</div>
      </div>
      <div class="stat">
        <div class="label">Aktivitas Hari Ini</div>
        <div class="value">12</div>
        <div class="hint">aksi tercatat</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>Aktivitas Terbaru</h2>
      </div>
      <div class="panel-body p-0">
        <DataTable :value="recent" class="dash-table">
          <Column field="time" header="Waktu" style="width: 160px" />
          <Column>
            <template #body="slotProps">
              <div>
                <strong>{{ slotProps.data.user }}</strong> — {{ slotProps.data.action }}
                <span v-if="slotProps.data.object" class="dot"> · {{ slotProps.data.object }}</span>
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="empty">Belum ada aktivitas.</div>
          </template>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.dash-table .p-datatable-thead) { display: none !important; }
:deep(.dash-table .p-datatable-emptymessage > td) { padding: 0 !important; border: none !important; }
</style>