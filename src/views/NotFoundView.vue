<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import Icon from '../components/Icon.vue'
</script>

<template>
  <div class="not-found">
    <div class="not-found-content">
      <Icon name="alert-circle" :size="64" style="color: var(--warning); margin-bottom: 16px;" />
      <h1 style="font-size: 32px; font-weight: 700; color: var(--text); margin: 0 0 8px;">Halaman Tidak Ditemukan</h1>
      <p style="color: var(--text-muted); font-size: 15px; margin: 0 0 24px; max-width: 360px;">
        Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <RouterLink to="/dashboard">
        <Button label="Kembali ke Dashboard" icon="pi pi-home" severity="primary" />
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 24px;
}
.not-found-content {
  text-align: center;
}
</style>