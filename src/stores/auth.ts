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

// Setup store: ref -> state, computed -> getters, function -> actions
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
        throw new Error(error.response?.data?.message ?? 'Login gagal')
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
    login,
    logout,
  }
})
