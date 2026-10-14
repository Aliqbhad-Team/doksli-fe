<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'
import { useTheme } from '../composables/useTheme'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const { theme, toggle } = useTheme()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMsg.value = 'Email dan password harus diisi'
    return
  }

  isLoading.value = true
  errorMsg.value = ''

  try {
    await authStore.login(email.value, password.value)
    router.push('/dashboard')
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : 'Login gagal'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4" :style="{ background: 'var(--bg)' }">
    <!-- Theme Toggle -->
    <div class="absolute top-4 right-4">
      <button @click="toggle" class="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition hover:opacity-90" :style="{ background: 'var(--accent)', color: 'var(--accent-contrast)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }">
        <Icon :name="theme === 'light' ? 'moon' : 'sun'" :size="16" />
        <span>{{ theme === 'light' ? 'Dark' : 'Light' }}</span>
      </button>
    </div>

    <!-- Login Card -->
    <div class="w-full max-w-96">
      <!-- Header -->
      <div class="mb-8 text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3" :style="{ background: 'var(--accent)' }">
          <Icon name="lock" :size="24" style="color: var(--accent-contrast)" />
        </div>
        <h1 class="text-2xl font-bold" :style="{ color: 'var(--text)' }">DoksliApps</h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--text-muted)' }">Sistem arsip dokumen terintegrasi</p>
      </div>

      <!-- Form Card -->
      <div class="rounded-lg border p-6" :style="{ background: 'var(--surface)', borderColor: 'var(--border)' }">
        <!-- Error -->
        <div v-if="errorMsg" class="mb-4 p-3 rounded-lg text-sm flex items-start gap-2" :style="{ background: 'var(--danger-soft)', color: 'var(--danger)' }">
          <Icon name="alert-circle" :size="18" class="shrink-0 mt-px" />
          <span>{{ errorMsg }}</span>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Email -->
          <div>
            <label class="text-sm font-medium block mb-1.5" :style="{ color: 'var(--text)' }">Email</label>
            <input v-model="email" type="email" placeholder="admin@gmail.com" class="w-full px-3 py-2 rounded-lg border text-sm outline-none transition" :style="{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }" @focus="(e) => e.target.style.borderColor = 'var(--accent)'" @blur="(e) => e.target.style.borderColor = 'var(--border)'" />
          </div>

          <!-- Password -->
          <div>
            <label class="text-sm font-medium block mb-1.5" :style="{ color: 'var(--text)' }">Password</label>
            <input v-model="password" type="password" placeholder="••••••••" class="w-full px-3 py-2 rounded-lg border text-sm outline-none transition" :style="{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }" @focus="(e) => e.target.style.borderColor = 'var(--accent)'" @blur="(e) => e.target.style.borderColor = 'var(--border)'" />
          </div>

          <!-- Submit -->
          <button type="submit" :disabled="isLoading" class="w-full py-2.5 rounded-lg font-medium text-sm transition" :style="{ background: 'var(--accent)', color: 'var(--accent-contrast)', opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }">
            {{ isLoading ? 'Memproses...' : 'Masuk' }}
          </button>
        </form>
      </div>

      <!-- Demo Hint -->
      <div class="mt-4 text-center text-xs p-3 rounded-lg" :style="{ background: 'var(--accent-soft)', color: 'var(--accent)' }">
        Demo: admin@gmail.com / admin123
      </div>
    </div>
  </div>
</template>
