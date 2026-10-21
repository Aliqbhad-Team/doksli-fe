<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePermission } from '../composables/usePermission'
import { folders, documents, auditLog, users } from '../data/sampleData'
import { fmtSize, totalSize } from '../data/sampleData'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Icon from '../components/Icon.vue'

usePermission()

const showBanner = ref(true)
const dismissBanner = () => { showBanner.value = false }

const totalFolders = computed(() => folders.length)
const totalDocs = computed(() => documents.filter(d => !d.deletedAt).length)
const totalSizeVal = computed(() => fmtSize(totalSize()))
const activeUsers = computed(() => users.filter(u => u.role !== 'Admin').length)

const recentActivity = computed(() => auditLog.slice(0, 5).map(a => ({
  time: a.time.split(' ')[1] || a.time,
  actor: a.user,
  action: a.action,
  object: a.object
})))

function actionClass(action: string) {
  if (action.includes('Unggah') || action.includes('Membuat')) return 'badge-success'
  if (action.includes('Unduh')) return 'badge-primary'
  if (action.includes('Sampah') || action.includes('Hapus')) return 'badge-danger'
  if (action.includes('Pulihkan')) return 'badge-warning'
  if (action.includes('Edit')) return 'badge-warning'
  return 'badge-default'
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Banner Dismissible -->
    <div v-if="showBanner" class="banner" role="alert">
      <div class="banner-content">
        <strong>Selamat datang di DoksliApp.</strong>
        <span>Kelola dokumen organisasi dengan struktur folder per unit, kontrol akses berbasis peran, dan riwayat versi lengkap.</span>
      </div>
      <Button text icon="pi pi-times" @click="dismissBanner" aria-label="Tutup" />
    </div>

    <!-- Summary Cards -->
    <div class="grid-summary">
      <Card class="summary-card">
        <div class="summary-icon folder"><Icon name="folder" :size="20" /></div>
        <div class="summary-info">
          <div class="summary-value">{{ totalFolders }}</div>
          <div class="summary-label">Total Folder</div>
        </div>
      </Card>
      <Card class="summary-card">
        <div class="summary-icon doc"><Icon name="file" :size="20" /></div>
        <div class="summary-info">
          <div class="summary-value">{{ totalDocs }}</div>
          <div class="summary-label">Dokumen Aktif</div>
        </div>
      </Card>
      <Card class="summary-card">
        <div class="summary-icon size"><Icon name="database" :size="20" /></div>
        <div class="summary-info">
          <div class="summary-value">{{ totalSizeVal }}</div>
          <div class="summary-label">Total Ukuran</div>
        </div>
      </Card>
      <Card class="summary-card">
        <div class="summary-icon user"><Icon name="user" :size="20" /></div>
        <div class="summary-info">
          <div class="summary-value">{{ activeUsers }}</div>
          <div class="summary-label">Pengguna Aktif</div>
        </div>
      </Card>
    </div>

    <!-- Recent Activity Panel -->
    <div class="panel">
      <div class="panel-head">
        <h2>Aktivitas Terbaru</h2>
        <span class="muted">{{ auditLog.length }} total log</span>
      </div>
      <div class="panel-body p-0">
        <table class="activity-table">
          <thead>
            <tr>
              <th style="width: 70px">Waktu</th>
              <th style="width: 140px">Pelaku</th>
              <th style="width: 130px">Aksi</th>
              <th>Objek</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in recentActivity" :key="a.time + a.actor">
              <td><span class="time">{{ a.time }}</span></td>
              <td><span class="actor">{{ a.actor }}</span></td>
              <td><span class="badge" :class="actionClass(a.action)">{{ a.action }}</span></td>
              <td class="muted">{{ a.object }}</td>
            </tr>
            <tr v-if="recentActivity.length === 0">
              <td colspan="4" class="empty">Belum ada aktivitas.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--accent-soft);
  border: 1px solid var(--accent);
  color: var(--accent);
  font-size: 13px;
  line-height: 1.6;
  animation: slideDown 0.2s ease;
}
@keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
.banner-content { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.banner-content strong { font-weight: 600; }
.banner-content span { opacity: 0.9; }
.banner :deep(.p-button-text) { color: var(--accent); opacity: 0.7; }
.banner :deep(.p-button-text:hover) { opacity: 1; background: var(--accent); color: var(--accent-contrast); }

.grid-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.summary-card { padding: 16px !important; border: 1px solid var(--border) !important; background: var(--surface) !important; }
.summary-icon { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 10px; margin-bottom: 10px; }
.summary-icon.folder { background: var(--primary-soft); color: var(--primary); }
.summary-icon.doc { background: var(--success-soft); color: var(--success); }
.summary-icon.size { background: var(--warning-soft); color: var(--warning); }
.summary-icon.user { background: var(--purple-soft); color: var(--purple); }
.summary-value { font-size: 24px; font-weight: 700; color: var(--text); line-height: 1.2; }
.summary-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

.panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
.panel-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.panel-head h2 { margin: 0; font-size: 15px; font-weight: 600; color: var(--text); }
.panel-head .muted { font-size: 12px; color: var(--text-muted); }
.panel-body { padding: 16px; }
.panel-body.p-0 { padding: 0; }

.activity-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.activity-table th { text-align: left; padding: 10px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); border-bottom: 1px solid var(--border); background: var(--surface); }
.activity-table td { padding: 10px 16px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
.activity-table tbody tr:last-child td { border-bottom: none; }
.activity-table tbody tr:hover td { background: var(--surface-2); }
.activity-table .time { font-variant-numeric: tabular-nums; color: var(--text-muted); font-size: 12px; }
.activity-table .actor { font-weight: 600; color: var(--text); }
.activity-table .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
.activity-table .badge-success { background: var(--success-soft); color: var(--success); }
.activity-table .badge-primary { background: var(--primary-soft); color: var(--primary); }
.activity-table .badge-danger { background: var(--danger-soft); color: var(--danger); }
.activity-table .badge-warning { background: var(--warning-soft); color: var(--warning); }
.activity-table .badge-default { background: var(--surface-2); color: var(--text); }
.activity-table .empty { text-align: center; padding: 24px; color: var(--text-muted); }
.muted { color: var(--text-muted); }
</style>