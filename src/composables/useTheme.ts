import { ref } from 'vue'

type Theme = 'light' | 'dark'
const THEME_KEY = 'doksli-theme'
const theme = ref<Theme>('light')

export function useTheme() {
  function init() {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    if (saved === 'dark' || saved === 'light') {
      theme.value = saved
    } else {
      theme.value = 'light'
    }
    apply(theme.value)
  }
  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    apply(theme.value)
  }
  function set(t: Theme) {
    theme.value = t
    apply(t)
  }
  function apply(t: Theme) {
    document.documentElement.setAttribute('data-theme', t)
    if (t === 'dark') {
      document.documentElement.classList.add('p-dark')
    } else {
      document.documentElement.classList.remove('p-dark')
    }
    localStorage.setItem(THEME_KEY, t)
  }
  return { theme, init, toggle, set }
}

export const themeState = theme
