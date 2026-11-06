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

export const decodeJWT = (token: string): { exp?: number; [key: string]: any } | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
      base64 += '='
    }
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonStr)
  } catch {
    return null
  }
}

export const checkIsTokenExpired = (t: string | null): boolean => {
  if (!t) return true
  const payload = decodeJWT(t)
  if (!payload || typeof payload.exp !== 'number') return true
  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now
}

export const useAuthStore = defineStore('auth', () => {
  const getInitialToken = (): string | null => {
    try {
      const stored = localStorage.getItem(TOKEN_KEY)
      if (stored && !checkIsTokenExpired(stored)) {
        return stored
      }
      if (stored) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
      return null
    } catch {
      return null
    }
  }

  const getInitialUser = (): User | null => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      if (!storedToken || checkIsTokenExpired(storedToken)) {
        return null
      }
      const stored = localStorage.getItem(USER_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  const token = ref<string | null>(getInitialToken())
  const user = ref<User | null>(getInitialUser())
  const loading = ref(false)
  const isAuthenticated = computed(() => isTokenValid())

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
    return checkIsTokenExpired(token.value)
  }

  const isTokenValid = (): boolean => {
    if (!token.value) return false
    return !checkIsTokenExpired(token.value)
  }

  const checkAuth = async (): Promise<boolean> => {
    if (!token.value || isTokenExpired()) {
      logout()
      return false
    }
    try {
      const res = await api.get('/v1/auth/me')
      const userData = res.data?.data ?? res.data?.user ?? res.data
      if (userData) {
        user.value = userData
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
      }
      return true
    } catch {
      logout()
      return false
    }
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
    checkAuth,
    login,
    logout,
  }
})
