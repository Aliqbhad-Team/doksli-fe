import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import api from '../services/api'

export interface User {
  id: number | string
  name: string
  email: string
  role?: { id?: string; name: string } | string
  unit?: { id?: string; name: string } | string
  unit_id?: string
  status?: string
}

const TOKEN_KEY = 'doksli-token'
const USER_KEY = 'doksli-user'

const decodeJWT = (token: string): { exp?: number; [key: string]: any } | null => {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload))
    return decoded
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const getInitialUser = (): User | null => {
    try {
      const stored = localStorage.getItem(USER_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  const user = ref<User | null>(getInitialUser())
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const loading = ref(false)
  const isAuthenticated = computed(() => !!token.value)

  const userRole = computed(() => {
    if (!user.value) return 'Admin'
    const r = user.value.role
    if (typeof r === 'string') return r
    return r?.name || 'Admin'
  })

  const isAdmin = computed(() => {
    return userRole.value.toLowerCase() === 'admin'
  })

  const isPengelola = computed(() => {
    return userRole.value.toLowerCase() === 'pengelola'
  })

  const isPengguna = computed(() => {
    return userRole.value.toLowerCase() === 'pengguna'
  })

  const canManageFolder = computed(() => {
    return isAdmin.value || isPengelola.value
  })

  const isTokenExpired = (): boolean => {
    if (!token.value) return false
    const payload = decodeJWT(token.value)
    if (!payload || !payload.exp) return false
    const now = Math.floor(Date.now() / 1000)
    return payload.exp < now
  }

  const isTokenValid = (): boolean => {
    if (!token.value) return false
    return !isTokenExpired()
  }

  const login = async (email: string, password: string) => {
    loading.value = true
    try {
      const { data } = await api.post<{ token: string; user: User }>('/v1/auth/login', {
        email,
        password,
      })

      token.value = data.token
      user.value = data.user
      
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data
        if (data?.message) {
          throw new Error(data.message)
        }
        if (data?.errors) {
          const firstField = Object.keys(data.errors)[0]
          if (firstField && data.errors[firstField]?.[0]) {
            throw new Error(data.errors[firstField][0])
          }
        }
        if (error.response?.status === 401) {
          throw new Error('Email atau password salah. Silakan coba lagi.')
        }
        if (error.code === 'ERR_NETWORK') {
          throw new Error('Tidak dapat terhubung ke server backend. Pastikan server aktif.')
        }
        throw new Error('Login gagal. Silakan coba lagi.')
      }
      throw error
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return { 
    user,
    token,
    loading,
    isAuthenticated,
    userRole,
    isAdmin,
    isPengelola,
    isPengguna,
    canManageFolder,
    isTokenExpired,
    isTokenValid,
    login,
    logout,
  }
})
