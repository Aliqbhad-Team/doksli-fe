<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Paginator from 'primevue/paginator'
import ProgressSpinner from 'primevue/progressspinner'
import { useDocumentsStore, type Audit } from '../stores/documents'
import { useAuthStore } from '../stores/auth'

const store = useDocumentsStore()
const authStore = useAuthStore()

const first = ref(0)
const rows = 10
const totalRecords = ref(0)
const loadingActivities = ref(false)
const activitiesList = ref<Audit[]>([])

async function fetchActivities(page = 1) {
  loadingActivities.value = true
  try {
    const res = await store.fetchAuditLogs({ page, per_page: rows })
    activitiesList.value = res.data ?? []
    totalRecords.value = res.meta?.total ?? activitiesList.value.length
  } catch {
    // fallback to store mock audit log
    activitiesList.value = store.auditLog.slice(first.value, first.value + rows)
    totalRecords.value = store.auditLog.length
  } finally {
    loadingActivities.value = false
  }
}

function onPageChange(event: { page: number; first: number }) {
  first.value = event.first
  const targetPage = event.page + 1
  fetchActivities(targetPage)
}

onMounted(async () => {
  await Promise.allSettled([
    store.fetchDocuments(),
    store.fetchFolders(),
    store.fetchCategories(),
    fetchActivities(1),
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
        <RouterLink v-if="!authStore.isPengguna" to="/audit" class="btn sm ghost" style="color: var(--accent); font-weight: 600">
          Lihat semua di Log Audit &rarr;
        </RouterLink>
      </div>

      <div class="panel-body p-0">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th style="width: 140px">Waktu</th>
                <th style="width: 170px">Pengguna</th>
                <th>Aktivitas</th>
                <th style="width: 120px">IP Address</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loadingActivities">
                <td colspan="4" style="text-align: center; padding: 32px;" class="muted">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <ProgressSpinner style="width: 32px; height: 32px" strokeWidth="4" />
                    <span>Memuat aktivitas terbaru...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="activitiesList.length === 0">
                <td colspan="4">
                  <div class="empty">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>
                    </svg>
                    <div>Belum ada aktivitas tercatat.</div>
                  </div>
                </td>
              </tr>
              <tr v-else v-for="act in activitiesList" :key="act.id">
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

        <!-- Numeric Pagination (PrimeVue) -->
        <div class="border-t border-[var(--border)] p-2 flex justify-center">
          <Paginator
            v-model:first="first"
            :rows="rows"
            :totalRecords="totalRecords"
            :alwaysShow="true"
            @page="onPageChange"
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat {
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.stat .label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}

.stat .value {
  font-size: 24px;
  font-weight: 700;
  margin: 6px 0 2px;
  color: var(--text);
}

.stat .hint {
  font-size: 11.5px;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .stats {
    grid-template-columns: 1fr;
  }
}
</style>