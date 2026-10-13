<script setup lang="ts">
import DataTable from 'primevue/datatable'

const recent: Record<string, string>[] = []
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="stats">
      <div class="stat">
        <div class="label">Total Dokumen</div>
        <div class="value">0</div>
        <div class="hint">pada folder yang bisa Anda lihat</div>
      </div>
      <div class="stat">
        <div class="label">Penyimpanan Terpakai</div>
        <div class="value">0 KB</div>
        <div class="hint">pada folder yang bisa Anda lihat</div>
      </div>
      <div class="stat">
        <div class="label">Tempat Sampah</div>
        <div class="value">0</div>
        <div class="hint">dokumen terhapus</div>
      </div>
      <div class="stat">
        <div class="label">Aktivitas Hari Ini</div>
        <div class="value">0</div>
        <div class="hint">aksi tercatat</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>Aktivitas Terbaru</h2>
      </div>
      <div class="panel-body p-0">
        <DataTable :value="recent" class="dash-table">
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
