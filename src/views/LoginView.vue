<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
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
  } catch (err: any) {
    errorMsg.value = err?.message || 'Login gagal. Silakan periksa kembali email dan password Anda.'
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
      <button 
        @click="toggle"
        class="theme-icon-btn"
        :title="theme === 'light' ? 'Ganti ke Mode Gelap' : 'Ganti ke Mode Terang'"
      >
        <Icon :name="theme === 'dark' ? 'moon' : 'sun'" :size="18" />
      </button>
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
        <!-- Error Notification Banner -->
        <transition name="shake">
          <div v-if="errorMsg" class="login-alert-banner" role="alert">
            <div class="alert-icon-box">
              <Icon name="alert-circle" :size="18" />
            </div>
            <div class="alert-content">
              <span class="alert-title">Gagal Masuk</span>
              <span class="alert-desc">{{ errorMsg }}</span>
            </div>
            <button 
              type="button" 
              class="alert-close-btn" 
              @click="errorMsg = ''" 
              title="Tutup pesan"
            >
              <Icon name="x" :size="14" />
            </button>
          </div>
        </transition>

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
              :invalid="!!errorMsg"
              @input="errorMsg = ''"
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
              :invalid="!!errorMsg"
              @input="errorMsg = ''"
            />
          </div>

          <!-- Submit -->
          <Button 
            type="submit" 
            :label="isLoading ? '' : 'Masuk'" 
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

.theme-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-icon-btn:hover {
  background: var(--surface-2);
  border-color: var(--accent);
}

.theme-icon-btn:active {
  transform: scale(0.95);
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

.login-alert-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--danger-soft);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: var(--danger);
  margin-bottom: 16px;
  animation: alertShake 0.4s ease-in-out;
}

.alert-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.alert-title {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

.alert-desc {
  font-size: 12px;
  opacity: 0.95;
  line-height: 1.4;
}

.alert-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--danger);
  opacity: 0.7;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.15s;
}

.alert-close-btn:hover {
  opacity: 1;
  background: rgba(239, 68, 68, 0.15);
}

@keyframes alertShake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

</style>
