<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../composables/useTheme'
import { usePermission } from '../composables/usePermission'
import ToggleSwitch from 'primevue/toggleswitch'
import Icon from '../components/Icon.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { theme, init, set } = useTheme()
const { isAdmin, currentUser } = usePermission()

const isDark = ref(false)
const masterOpen = ref(false)

const navItems = computed(() => [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', to: '/dashboard' },
  { id: 'documents', label: 'Dokumen', icon: 'folder', to: '/dokumen' },
  { id: 'search', label: 'Pencarian', icon: 'search', to: '/pencarian' },
])

const adminNavItems = computed(() => [
  { id: 'audit', label: 'Log Audit', icon: 'clock', to: '/audit' },
])

const masterItems = [
  { id: 'pengguna', label: 'Pengguna', to: '/master/pengguna' },
  { id: 'units', label: 'Units', to: '/master/units' },
  { id: 'grup', label: 'Grup', to: '/master/grup' },
  { id: 'categories', label: 'Categories', to: '/master/categories' },
  { id: 'tags', label: 'Tags', to: '/master/tags' },
]

onMounted(() => {
  init()
  isDark.value = theme.value === 'dark'
})

watch(isDark, (val) => {
  set(val ? 'dark' : 'light')
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const toggleMaster = () => {
  masterOpen.value = !masterOpen.value
}

function getCurrentPageTitle(): string {
  const path = route.path
  const allItems = [...navItems.value, ...adminNavItems.value, ...masterItems]
  const match = allItems.find(item => path === item.to || path.startsWith(item.to + '/'))
  return match?.label || 'Dashboard'
}
</script>

<template>
  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        <span class="mark">
          <Icon name="archive" :size="18" />
        </span>
        <div>
          <div class="name">DoksliApp</div>
        </div>
      </div>

      <nav id="nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.id"
          :to="item.to"
          class="navlink"
          :class="{ active: route.path === item.to || route.path.startsWith(item.to + '/') }"
        >
          <Icon :name="item.icon" :size="16" />
          <span>{{ item.label }}</span>
        </RouterLink>

        <RouterLink
          v-for="item in adminNavItems"
          :key="item.id"
          :to="item.to"
          class="navlink"
          :class="{ active: route.path === item.to || route.path.startsWith(item.to + '/') }"
        >
          <Icon :name="item.icon" :size="16" />
          <span>{{ item.label }}</span>
        </RouterLink>

        <!-- Master Dropdown (Admin only) -->
        <template v-if="isAdmin">
          <div class="nav-section">
            <button
              class="navlink master-toggle"
              @click="toggleMaster"
              :class="{ 'master-open': masterOpen }"
              type="button"
            >
              <Icon name="settings" :size="16" />
              <span>Master</span>
              <Icon :name="masterOpen ? 'chevron-up' : 'chevron-down'" :size="14" class="chevron" />
            </button>
            <div class="master-dropdown" v-show="masterOpen">
              <RouterLink
                v-for="item in masterItems"
                :key="item.id"
                :to="item.to"
                class="master-item"
                :class="{ active: route.path === item.to || route.path.startsWith(item.to + '/') }"
                @click="masterOpen = false"
              >
                <span>{{ item.label }}</span>
              </RouterLink>
            </div>
          </div>
        </template>
      </nav>

      <div class="sidebar-footer">
        <div class="theme-box">
          <div class="theme-row">
            <span class="theme-label">
              <Icon :name="isDark ? 'moon' : 'sun'" :size="14" />
              {{ isDark ? 'Mode Gelap' : 'Mode Terang' }}
            </span>
            <ToggleSwitch v-model="isDark" />
          </div>
        </div>

        <!-- User Persona & Logout -->
        <div class="user-persona" v-if="currentUser">
          <div class="user-avatar">
            <Icon name="user" :size="20" />
          </div>
          <div class="user-info">
            <div class="user-name">{{ currentUser.name }}</div>
            <div class="user-role">{{ currentUser.role?.name }}</div>
          </div>
          <button class="logout-btn" @click="handleLogout" title="Keluar">
            <Icon name="log-out" :size="16" />
          </button>
        </div>
      </div>
    </aside>

    <main>
      <div class="topbar">
        <h1>{{ getCurrentPageTitle() }}</h1>
      </div>

      <div id="view">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
}

.sidebar {
  width: 224px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 16px 12px;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 12px;
  border-bottom: 1px solid var(--border);
}

.mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--accent);
  color: var(--accent-contrast);
}

.name {
  font-weight: 700;
  font-size: 14px;
  color: var(--text);
  letter-spacing: -0.02em;
}

#nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  overflow-y: auto;
}

.navlink {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
  background: transparent;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.navlink:hover {
  background: var(--surface-2);
  color: var(--text);
}

.navlink.active {
  background: var(--accent-soft);
  color: var(--accent);
}

.navlink svg {
  flex-shrink: 0;
}

.nav-section {
  display: flex;
  flex-direction: column;
}

.master-toggle {
  justify-content: space-between;
}

.master-toggle .chevron {
  transition: transform 0.2s ease;
  color: var(--text-muted);
}

.master-toggle.master-open .chevron {
  transform: rotate(180deg);
}

.master-dropdown {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
  padding-left: 8px;
  border-left: 2px solid var(--accent);
  animation: slideDown 0.15s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.master-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 6px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 12.5px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.master-item:hover {
  background: var(--surface-2);
  color: var(--text);
}

.master-item.active {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.theme-box {
  padding: 10px 12px;
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

.user-persona {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--surface-2);
  border: 1px solid var(--border);
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--accent-soft);
  color: var(--accent);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: capitalize;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.logout-btn:hover {
  background: var(--danger-soft);
  border-color: var(--danger);
  color: var(--danger);
}

main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.topbar h1 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

#view {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>