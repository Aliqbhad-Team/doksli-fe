<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useDocumentsStore } from '../stores/documents'

const store = useDocumentsStore()

onMounted(async () => {
  await Promise.allSettled([
    store.fetchDocuments(),
    store.fetchFolders(),
    store.fetchCategories(),
  ])
})

const stats = computed(() => [
  {
    label: 'Total Dokumen',
    value: store.activeDocs?.length ?? 0,
    hint: 'pada folder yang bisa Anda lihat',
  },
  {
    label: 'Penyimpanan Terpakai',
    value: store.fmtSize(store.totalKB ?? 0),
    hint: 'pada folder yang bisa Anda lihat',
  },
  {
    label: 'Tempat Sampah',
    value: store.trashedDocs?.length ?? 0,
    hint: 'dokumen terhapus',
  },
  {
    label: 'Aktivitas Hari Ini',
    value: store.todayCount ?? 0,
    hint: 'aksi tercatat',
  },
])

const recentActivities = computed(() => store.recentActivities ?? [])
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Top 4 Stats Grid -->
    <div class="stats">
      <div v-for="stat in stats" :key="stat.label" class="stat">
        <div class="label">{{ stat.label }}</div>
        <div class="value">{{ stat.value }}</div>
        <div class="hint">{{ stat.hint }}</div>
      </div>
    </div>

    <!-- Recent Activities Panel -->
    <div class="panel">
      <div class="panel-head">
        <h2>Aktivitas Terbaru</h2>
        <RouterLink to="/audit" class="btn sm ghost" style="color: var(--accent); font-weight: 600">
          Lihat semua di Log Audit &rarr;
        </RouterLink>
      </div>

      <div class="panel-body p-0">
        <div v-if="recentActivities.length === 0" class="empty">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>
          </svg>
          <div>Belum ada aktivitas tercatat.</div>
        </div>

        <div v-else class="table-scroll">
          <table>
            <thead>
              <tr>
                <th style="width: 100px">Waktu</th>
                <th style="width: 160px">Pengguna</th>
                <th>Aktivitas</th>
                <th style="width: 120px">IP Address</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="act in recentActivities" :key="act.id">
                <td class="num muted">{{ act.time }}</td>
                <td style="font-weight: 600">{{ act.user }}</td>
                <td>
                  <span class="muted">{{ act.action }}:</span>
                  <strong style="margin-left: 6px">{{ act.object }}</strong>
                </td>
                <td class="num muted" style="font-size: 11.5px">{{ act.ip }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}
.stat {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat .label {
  font-size: 11.5px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: .05em;
  font-weight: 600;
}
.stat .value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.stat .hint {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 2px;
}
</style>
