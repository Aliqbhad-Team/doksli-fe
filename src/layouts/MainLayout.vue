<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useTheme } from '../composables/useTheme'
import ToggleSwitch from 'primevue/toggleswitch'

const route = useRoute()
const { theme, init, set } = useTheme()

const isDark = ref(false)

const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', to: '/dashboard' },
  { id: 'documents', label: 'Dokumen', icon: 'folder', to: '/dokumen' },
  { id: 'search', label: 'Pencarian', icon: 'search', to: '/pencarian' },
  { id: 'audit', label: 'Log Audit', icon: 'clock', to: '/audit' },
]

onMounted(() => {
  init()
  isDark.value = theme.value === 'dark'
})

watch(isDark, (val) => {
  set(val ? 'dark' : 'light')
})
</script>

<template>
  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        <span class="mark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="4.2" rx="1"/>
            <path d="M4.5 8.5v9a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-9"/>
            <path d="M10 12.5h4"/>
          </svg>
        </span>
        <div>
          <div class="name">DoksliApp</div>
        </div>
      </div>
      
      <nav id="nav">
        <RouterLink 
          v-for="item in nav" 
          :key="item.id" 
          :to="item.to" 
          class="navlink"
          :class="{ active: route.path.startsWith(item.to) }"
        >
          <svg v-if="item.icon === 'grid'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
          <svg v-else-if="item.icon === 'folder'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l1.7 2H19.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/>
          </svg>
          <svg v-else-if="item.icon === 'search'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="10.5" cy="10.5" r="6.5"/><line x1="20" y1="20" x2="15.4" y2="15.4"/>
          </svg>
          <svg v-else-if="item.icon === 'clock'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>
          </svg>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="theme-box">
        <div class="theme-row">
          <span class="theme-label">
            <!-- matahari = terangg , bulan = gelapp , ganti sesuai isDark -->
            <svg v-if="!isDark" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2.5 12h2M19.5 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            {{ isDark ? 'Mode Gelap' : 'Mode Terang' }}
          </span>
          <ToggleSwitch v-model="isDark" />
        </div>
      </div>
    </aside>

    <main>
      <div class="topbar">
        <h1>{{ nav.find(n => route.path.startsWith(n.to))?.label || 'Dashboard' }}</h1>
        <div class="persona">
          Masuk sebagai <b>Bhadriko Pramudyaa</b>
        </div>
      </div>
      
      <div id="view">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.theme-box {
  margin-top: auto;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-2);
}
.theme-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.theme-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}
.theme-label svg {
  flex-shrink: 0;
  color: var(--text-muted);
}
</style>
