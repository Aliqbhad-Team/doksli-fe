<script setup lang="ts">
import { useTheme } from '../../composables/useTheme'
import Button from 'primevue/button'

const { theme, toggle } = useTheme()
</script>

<template>
  <aside class="sidebar">
    <nav>
      <slot name="menu" />
    </nav>

    <div class="sidebar-footer">
      <Button 
        :icon="theme === 'light' ? 'pi pi-moon' : 'pi pi-sun'"
        severity="secondary"
        text
        @click="toggle"
        :title="theme === 'light' ? 'Dark Mode' : 'Light Mode'"
      />
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 18px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-height: 100vh;
  position: sticky;
  top: 0;
  align-self: stretch;
  width: 224px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 4px;
}

.mark {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: var(--accent);
  color: var(--accent-contrast);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
}

.name {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.01em;
  color: var(--text);
}

nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.sidebar-footer {
  margin-top: auto;
  display: flex;
  justify-content: center;
}
</style>
