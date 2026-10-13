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
    const html = document.documentElement
    // matikan transition sesaat biar gak kedip — Aura punya transition 0.2s di input/select/checkbox
    html.classList.add('theme-switching')
    html.setAttribute('data-theme', t)
    if (t === 'dark') html.classList.add('p-dark')
    else html.classList.remove('p-dark')
    localStorage.setItem(THEME_KEY, t)
    // force reflow lalu lepas class di frame berikutnya -> transisi balik normal tanpa kedip
    void html.offsetHeight
    requestAnimationFrame(() => {
      requestAnimationFrame(() => html.classList.remove('theme-switching'))
    })
  }
  return { theme, init, toggle, set }
}

export const themeState = theme
