<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Message from 'primevue/message'
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

const fillDemo = (demoEmail: string, demoPassword: string) => {
  email.value = demoEmail
  password.value = demoPassword
  errorMsg.value = ''
}
</script>

<template>
  <div class="login-page">
    <!-- Theme Toggle -->
    <div class="theme-toggle-wrap">
      <Button 
        severity="secondary"
        size="small"
        @click="toggle"
        class="theme-btn"
      >
        <template #icon>
          <Icon :name="theme === 'light' ? 'moon' : 'sun'" :size="15" />
        </template>
        <span>{{ theme === 'light' ? 'Dark' : 'Light' }}</span>
      </Button>
    </div>

    <!-- Login Container -->
    <div class="login-box">
      <!-- Header -->
      <div class="login-head">
        <div class="login-brand-icon">
          <Icon name="lock" :size="24" style="color: var(--accent-contrast)" />
        </div>
        <h1 class="login-brand-title">DoksliApps</h1>
        <p class="login-brand-subtitle">Sistem arsip dokumen terintegrasi</p>
      </div>

      <!-- Form Card -->
      <div class="login-card">
        <!-- Error -->
        <Message v-if="errorMsg" severity="error" :closable="false" class="mb-4">
          {{ errorMsg }}
        </Message>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="login-form">
          <!-- Email -->
          <div class="form-field">
            <label for="login-email" class="field-label">Email</label>
            <InputText 
              id="login-email" 
              v-model="email" 
              type="email" 
              placeholder="admin@gmail.com" 
              fluid 
              required
            />
          </div>

          <!-- Password -->
          <div class="form-field">
            <label for="login-password" class="field-label">Password</label>
            <Password 
              id="login-password" 
              v-model="password" 
              :feedback="false" 
              toggleMask 
              placeholder="••••••••" 
              fluid 
              required
            />
          </div>

          <!-- Submit -->
          <Button 
            type="submit" 
            label="Masuk" 
            :loading="isLoading" 
            fluid 
            class="submit-btn"
          />
        </form>
      </div>

      <!-- Demo Accounts Section -->
      <div class="demo-section">
        <div class="demo-head">
          <span>AKUN DEMO (KLIK UNTUK ISI CEPAT)</span>
          <span class="demo-badge">Tersedia di BE</span>
        </div>

        <div class="demo-list">
          <!-- Card 1: Admin (Red / Danger) -->
          <div 
            @click="fillDemo('admin@gmail.com', 'admin123')"
            class="demo-card danger"
            title="Klik untuk gunakan akun Admin"
          >
            <div class="demo-card-left">
              <span class="demo-dot bg-danger"></span>
              <div>
                <div class="demo-role text-danger">Admin (Sistem)</div>
                <div class="demo-email text-danger">admin@gmail.com</div>
              </div>
            </div>
            <span class="demo-pwd text-danger">admin123</span>
          </div>

          <!-- Card 2: Pengelola (Blue / Accent) -->
          <div 
            @click="fillDemo('pengelola.legal@gmail.com', 'pengelola123')"
            class="demo-card accent"
            title="Klik untuk gunakan akun Pengelola Legal"
          >
            <div class="demo-card-left">
              <span class="demo-dot bg-accent"></span>
              <div>
                <div class="demo-role text-accent">Pengelola (Unit Legal)</div>
                <div class="demo-email text-accent">pengelola.legal@gmail.com</div>
              </div>
            </div>
            <span class="demo-pwd text-accent">pengelola123</span>
          </div>

          <!-- Card 3: Pengguna (Green / Success) -->
          <div 
            @click="fillDemo('pengguna@gmail.com', 'pengguna123')"
            class="demo-card success"
            title="Klik untuk gunakan akun Pengguna"
          >
            <div class="demo-card-left">
              <span class="demo-dot bg-success"></span>
              <div>
                <div class="demo-role text-success">Pengguna (Unit Legal)</div>
                <div class="demo-email text-success">pengguna@gmail.com</div>
              </div>
            </div>
            <span class="demo-pwd text-success">pengguna123</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  background: var(--bg);
  position: relative;
}

.theme-toggle-wrap {
  position: absolute;
  top: 16px;
  right: 16px;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  border-radius: 8px;
}

.login-box {
  width: 100%;
  max-width: 420px;
}

.login-head {
  margin-bottom: 24px;
  text-align: center;
}

.login-brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  margin-bottom: 12px;
  background: var(--accent);
}

.login-brand-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
  margin: 0;
}

.login-brand-subtitle {
  font-size: 13.5px;
  margin-top: 4px;
  color: var(--text-muted);
}

.login-card {
  border-radius: 14px;
  border: 1px solid var(--border);
  padding: 24px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.submit-btn {
  margin-top: 4px;
  font-weight: 600;
  border-radius: 8px;
}

.demo-section {
  margin-top: 20px;
}

.demo-head {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-muted);
}

.demo-badge {
  font-size: 10.5px;
  opacity: 0.8;
}

.demo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.demo-card {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid;
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.demo-card:hover {
  transform: translateY(-1px);
  filter: brightness(0.98);
}

.demo-card.danger {
  background: var(--danger-soft);
  border-color: rgba(239, 68, 68, 0.25);
}

.demo-card.accent {
  background: var(--accent-soft);
  border-color: rgba(59, 130, 246, 0.25);
}

.demo-card.success {
  background: var(--success-soft);
  border-color: rgba(34, 197, 94, 0.25);
}

.demo-card-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.demo-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.bg-danger { background: #ef4444; }
.bg-accent { background: #3b82f6; }
.bg-success { background: #22c55e; }

.demo-role {
  font-size: 12px;
  font-weight: 700;
}

.demo-email {
  font-size: 11px;
  font-family: ui-monospace, monospace;
  opacity: 0.85;
}

.demo-pwd {
  font-size: 11px;
  font-family: ui-monospace, monospace;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.4);
}

:root.p-dark .demo-pwd {
  background: rgba(0, 0, 0, 0.25);
}

.text-danger { color: var(--danger); }
.text-accent { color: var(--accent); }
.text-success { color: var(--success); }
</style>
