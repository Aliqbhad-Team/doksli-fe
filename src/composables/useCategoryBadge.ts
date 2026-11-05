// composables/useCategoryBadge.ts
// Sistem terpusat manajemen warna kategori dinamis (Merah, Kuning, Hijau, Biru, Ungu, Putih)

export interface CategoryColor {
  bg: string
  fg: string
  text: string
  dot: string
  border: string
  name: string
}

export const CATEGORY_PALETTE: CategoryColor[] = [
  // 0: Merah (Danger)
  {
    name: 'merah',
    bg: 'var(--danger-soft)',
    fg: 'var(--danger)',
    text: 'var(--danger)',
    dot: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.35)',
  },
  // 1: Kuning (Warning)
  {
    name: 'kuning',
    bg: 'var(--warning-soft)',
    fg: 'var(--warning)',
    text: 'var(--warning)',
    dot: '#f59e0b',
    border: '1px solid rgba(245, 158, 11, 0.35)',
  },
  // 2: Hijau (Success)
  {
    name: 'hijau',
    bg: 'var(--success-soft)',
    fg: 'var(--success)',
    text: 'var(--success)',
    dot: '#10b981',
    border: '1px solid rgba(16, 185, 129, 0.35)',
  },
  // 3: Biru (Accent / Info)
  {
    name: 'biru',
    bg: 'var(--accent-soft)',
    fg: 'var(--accent)',
    text: 'var(--accent)',
    dot: '#3b82f6',
    border: '1px solid rgba(59, 130, 246, 0.35)',
  },
  // 4: Ungu (Purple)
  {
    name: 'ungu',
    bg: 'rgba(168, 85, 247, 0.18)',
    fg: '#c084fc',
    text: '#c084fc',
    dot: '#a855f7',
    border: '1px solid rgba(168, 85, 247, 0.35)',
  },
  // 5: Putih (Light / Contrast)
  {
    name: 'putih',
    bg: 'rgba(255, 255, 255, 0.15)',
    fg: '#f8fafc',
    text: '#f8fafc',
    dot: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.35)',
  },
]

const STORAGE_KEY = 'doksli-category-color-registry'

// In-memory cache synced with localStorage
let colorMap: Record<string, number> = {}

function loadColorMap(): Record<string, number> {
  // Default seeding for known initial categories
  const defaults: Record<string, number> = {
    kontrak: 3, // Biru
    keuangan: 2, // Hijau
    sdm: 1, // Kuning
    legal: 0, // Merah
    korespondensi: 4, // Ungu
    proposal: 1, // Kuning
    'surat masuk': 3, // Biru
    'surat keluar': 4, // Ungu
    'notulen rapat': 4, // Ungu
    'berita acara': 2, // Hijau
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...defaults, ...parsed }
    }
  } catch {}

  return defaults
}

function saveColorMap() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colorMap))
  } catch {}
}

colorMap = loadColorMap()

export function useCategoryBadge() {
  function getCategoryBadge(categoryName?: string): CategoryColor {
    const name = (categoryName || '').trim().toLowerCase()
    if (!name) {
      return CATEGORY_PALETTE[5] // Putih/Netral fallback
    }

    // Cek apakah sudah pernah didaftarkan warnanya
    if (typeof colorMap[name] === 'number') {
      const idx = colorMap[name] % CATEGORY_PALETTE.length
      return CATEGORY_PALETTE[idx]
    }

    // Jika belum ada (kategori baru dibuat), tetapkan warna secara acak namun deterministik
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i)
      hash |= 0
    }
    const assignedIndex = Math.abs(hash) % CATEGORY_PALETTE.length
    colorMap[name] = assignedIndex
    saveColorMap()

    return CATEGORY_PALETTE[assignedIndex]
  }

  // Fungsi opsional untuk eksplisit assign warna saat kategori dibuat/disimpan
  function registerCategoryColor(categoryName: string, colorIndex?: number) {
    const name = categoryName.trim().toLowerCase()
    if (!name) return

    const idx = typeof colorIndex === 'number'
      ? colorIndex % CATEGORY_PALETTE.length
      : Math.floor(Math.random() * CATEGORY_PALETTE.length)

    colorMap[name] = idx
    saveColorMap()
  }

  return {
    CATEGORY_PALETTE,
    getCategoryBadge,
    registerCategoryColor,
  }
}

