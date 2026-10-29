<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme'
import { useAuthStore } from '../stores/auth'
import Icon from '../components/Icon.vue'
import ToggleSwitch from 'primevue/toggleswitch'

const route = useRoute()
const router = useRouter()
const { theme, init, set } = useTheme()
const authStore = useAuthStore()

const isDark = ref(false)

const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', to: '/dashboard' },
  { id: 'dokumen', label: 'Dokumen', icon: 'folder', to: '/dokumen' },
  { id: 'pencarian', label: 'Pencarian', icon: 'search', to: '/pencarian' },
  { id: 'audit', label: 'Log Audit', icon: 'clock', to: '/audit' },
]

const masterItems = [
  { id: 'pengguna', label: 'Pengguna', icon: 'user', to: '/master/pengguna' },
  { id: 'unit', label: 'Unit', icon: 'building', to: '/master/unit' },
  { id: 'grup', label: 'Grup', icon: 'group', to: '/master/grup' },
  { id: 'kategori', label: 'Kategori', icon: 'tag', to: '/master/kategori' },
]

const isMasterOpen = ref(route.path.startsWith('/master'))
const isMasterActive = computed(() => route.path.startsWith('/master'))

const pageTitle = computed(() => {
  if (route.path.startsWith('/dashboard')) return 'Dashboard'
  if (route.path.startsWith('/dokumen')) return 'Dokumen'
  if (route.path.startsWith('/pencarian')) return 'Pencarian'
  if (route.path.startsWith('/audit')) return 'Log Audit'
  if (route.path.startsWith('/master/pengguna')) return 'Manajemen Pengguna'
  if (route.path.startsWith('/master/unit')) return 'Master Unit'
  if (route.path.startsWith('/master/grup')) return 'Grup Akses'
  if (route.path.startsWith('/master/kategori')) return 'Master Kategori'
  return 'Dashboard'
})

onMounted(() => {
  init()
  isDark.value = theme.value === 'dark'
})

watch(isDark, (val) => {
  set(val ? 'dark' : 'light')
})

watch(() => route.path, (newPath) => {
  if (newPath.startsWith('/master')) {
    isMasterOpen.value = true
  }
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        <span class="mark">
          <Icon name="archive" :size="16" />
        </span>
        <div>
          <div class="name">DoksliApp</div>
          <div class="sub">Manajemen Arsip</div>
        </div>
      </div>
      
      <nav id="nav">
        <!-- Main Navigation Items -->
        <RouterLink 
          v-for="item in nav" 
          :key="item.id" 
          :to="item.to" 
          class="navlink"
          :class="{ active: route.path.startsWith(item.to) }"
        >
          <Icon :name="item.icon" :size="16" />
          <span>{{ item.label }}</span>
        </RouterLink>

        <!-- Master Dropdown (Khusus Role Admin) -->
        <div v-if="authStore.isAdmin" class="nav-dropdown">
          <button 
            type="button"
            class="navlink nav-dropdown-toggle"
            :class="{ active: isMasterActive && !isMasterOpen }"
            @click="isMasterOpen = !isMasterOpen"
          >
            <div class="flex items-center gap-2.5">
              <Icon name="database" :size="16" />
              <span>Master</span>
            </div>
            <Icon :name="isMasterOpen ? 'chevron-up' : 'chevron-down'" :size="14" class="opacity-70" />
          </button>

          <!-- Dropdown Sub-Items -->
          <div v-show="isMasterOpen" class="nav-submenu">
            <RouterLink
              v-for="sub in masterItems"
              :key="sub.id"
              :to="sub.to"
              class="navlink sublink"
              :class="{ active: route.path.startsWith(sub.to) }"
            >
              <Icon :name="sub.icon" :size="15" />
              <span>{{ sub.label }}</span>
            </RouterLink>
          </div>
        </div>
      </nav>

      <div class="theme-box">
        <button @click="handleLogout" class="logout-btn">
          <Icon name="logout" :size="16" />
          <span>Keluar</span>
        </button>
        <div class="theme-row">
          <span class="theme-label">
            <Icon :name="!isDark ? 'sun' : 'moon'" :size="14" />
            {{ isDark ? 'Mode Gelap' : 'Mode Terang' }}
          </span>
          <ToggleSwitch v-model="isDark" />
        </div>
      </div>
    </aside>

    <main>
      <div class="topbar">
        <h1>{{ pageTitle }}</h1>
        <div class="persona">
          Masuk sebagai <b>{{ authStore.user?.name || 'Admin' }}</b> · <span class="muted">{{ authStore.userRole || 'Admin' }}</span>
        </div>
      </div>
      
      <div id="view">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.brand .sub {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.nav-dropdown {
  display: flex;
  flex-direction: column;
}

.nav-dropdown-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
}

.nav-submenu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 10px;
  margin-top: 3px;
  margin-bottom: 4px;
  border-left: 2px solid var(--border);
  margin-left: 17px;
}

.sublink {
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 6px;
}

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
.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 10px;
  border: none;
  border-radius: 6px;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}
.logout-btn:hover {
  background: var(--danger);
  color: white;
}
</style>
