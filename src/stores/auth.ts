import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import api from '../services/api'

export interface User {
  id: number
  name: string
  email: string
}

const TOKEN_KEY = 'doksli-token'

// Setup store: ref -> state, computed -> getters, function -> actions
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const loading = ref(false)
  const isAuthenticated = computed(() => !!token.value)

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
  }

  return { 
    // State (Varuabel)
    user
    , token
    , loading
    , isAuthenticated
    
    // Function
    , login
    , logout }
})
