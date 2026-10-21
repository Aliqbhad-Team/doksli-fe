import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { units as sampleUnits } from '../data/sampleData'

const API_BASE = 'http://127.0.0.1:8000/api/v1'
const TOKEN_KEY = 'doksli-token'
const USER_KEY = 'doksli-user'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: { id: string; name: string }
  unit_id?: string
  unit?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(localStorage.getItem(USER_KEY) ? JSON.parse(localStorage.getItem(USER_KEY)!) : null)
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const loading = ref(false)
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  const setupAxiosInterceptor = () => {
    axios.interceptors.request.use(config => {
      if (token.value) {
        config.headers.Authorization = `Bearer ${token.value}`
      }
      return config
    })
  }

  const resolveUnitName = (unitId?: string): string | undefined => {
    if (!unitId) return undefined
    const u = sampleUnits.find(x => x.name === unitId)
    return u?.name
  }

  const login = async (email: string, password: string) => {
    loading.value = true
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password,
      })

      const { token: newToken, user: userData } = response.data

      // resolve unit name from unit_id
      const unitName = resolveUnitName(userData.unit_id)
      user.value = { ...userData, unit: unitName }
      token.value = newToken

      setupAxiosInterceptor()

      localStorage.setItem(TOKEN_KEY, newToken)
      localStorage.setItem(USER_KEY, JSON.stringify(user.value))
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
    login,
    logout,
  }
})