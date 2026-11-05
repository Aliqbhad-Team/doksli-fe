<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Paginator from 'primevue/paginator'
import ProgressSpinner from 'primevue/progressspinner'
import api from '../services/api'
import { useDocumentsStore, type Doc } from '../stores/documents'
import { useAppConfirm } from '../composables/useAppConfirm'
import { useCategoryBadge } from '../composables/useCategoryBadge'

const store = useDocumentsStore()
const { confirmDelete, confirmAction } = useAppConfirm()
const { getCategoryBadge } = useCategoryBadge()

// Filter states
const q = ref('')
const selectedCategory = ref<string>('')
const selectedFolder = ref<string>('')
const includeTrash = ref(false)

// Drawer state
const selectedDoc = ref<Doc | null>(null)
const isDrawerOpen = ref(false)

const categories = ref<string[]>(['Kontrak', 'Keuangan', 'SDM', 'Legal', 'Korespondensi'])

onMounted(async () => {
  await Promise.allSettled([
    store.fetchDocuments(),
    store.fetchFolders(),
    store.fetchCategories(),
  ])
  try {
    const res = await api.get('/v1/categories')
    if (res.data?.data && Array.isArray(res.data.data)) {
      const fromApi = res.data.data.map((c: any) => c.name)
      categories.value = Array.from(new Set([...fromApi, ...categories.value]))
    }
  } catch {
    // fallback
  }
})

// Filtered documents
const searchResults = computed(() => {
  const query = q.value.toLowerCase().trim()
  const cat = selectedCategory.value
  const fId = selectedFolder.value

  const baseList = includeTrash.value ? store.documents : store.activeDocs

  return baseList.filter(doc => {
    // text query match name or tags
    if (query) {
      const matchName = (doc.name || '').toLowerCase().includes(query)
      const matchTag = doc.tags?.some((t: any) => {
        const tagName = typeof t === 'string' ? t : (t?.name ?? '')
        return tagName.toLowerCase().includes(query)
      })
      if (!matchName && !matchTag) return false
    }

    // category match
    const docCategory = doc.category?.name || doc.categoryName || (typeof doc.category === 'string' ? doc.category : '')
    if (cat && docCategory !== cat && doc.category_id !== cat) return false

    // folder match
    const docFolder = doc.folderId || doc.folder_id
    if (fId && docFolder !== fId) return false

    return true
  })
})

const first = ref(0)
const rows = 10
const paginatedSearchResults = computed(() => searchResults.value.slice(first.value, first.value + rows))

watch([q, selectedCategory, selectedFolder, includeTrash], () => {
  first.value = 0
})

function getFolderName(folderId?: string): string {
  if (!folderId) return '-'
  const f = store.folders.find(x => x.id === folderId)
  return f ? f.name : folderId
}

function getCategoryName(doc: Doc): string {
  return doc.category?.name || doc.categoryName || (typeof doc.category === 'string' ? doc.category : '-')
}

function getOwnerName(doc: Doc): string {
  return doc.owner?.name || doc.ownerName || (typeof doc.owner === 'string' ? doc.owner : '-')
}

function isDocTrashed(doc: Doc): boolean {
  return !!doc.deleted_at || doc.status === 'trashed' || !!doc.deletedAt
}



function getCurrentVersion(doc: Doc): any {
  if (doc.latest_version) {
    return {
      v: doc.latest_version.version_number,
      size: doc.latest_version.size_bytes,
      uploader: doc.latest_version.uploader?.name || 'Admin',
      note: doc.latest_version.note,
    }
  }
  if (!doc.versions || doc.versions.length === 0) return { v: 1, size: doc.size || 0 }
  const last = doc.versions[doc.versions.length - 1]
  return {
    v: last.version_number ?? (last as any).v ?? 1,
    size: last.size_bytes ?? (last as any).size ?? 0,
    uploader: last.uploader?.name ?? (last as any).uploader ?? 'Admin',
    note: last.note,
  }
}

function openDocDetail(doc: Doc) {
  selectedDoc.value = doc
  isDrawerOpen.value = true
}

function closeDrawer() {
  isDrawerOpen.value = false
}

function handleDownload(doc: Doc) {
  store.downloadDocument(doc.id)
}

function handleTrash(doc: Doc) {
  confirmDelete({
    title: 'Pindahkan ke Tempat Sampah',
    message: `Apakah Anda yakin ingin memindahkan "${doc.name}" ke tempat sampah?`,
    submessage: 'Dokumen dapat dipulihkan kapan saja dari tab Tempat Sampah.',
    confirmLabel: 'Pindahkan ke Sampah',
    onAccept: async () => {
      await store.trashDocument(doc.id)
      if (selectedDoc.value?.id === doc.id) closeDrawer()
    },
  })
}

function handleRestore(doc: Doc) {
  confirmAction({
    title: 'Pulihkan Dokumen',
    message: `Pulihkan "${doc.name}" ke dokumen aktif?`,
    confirmLabel: 'Pulihkan',
    onAccept: async () => {
      await store.restoreDocument(doc.id)
      if (selectedDoc.value?.id === doc.id) closeDrawer()
    },
  })
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Search and Filter Form -->
    <div class="panel">
      <div class="panel-body flex flex-col gap-3">
        <div class="searchbar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            v-model="q"
            type="text"
            placeholder="Cari nama dokumen atau tag (#sewa, #gedung)..."
          />
          <button v-if="q" class="iconbtn sm" style="border:none; background:none" @click="q = ''">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="filters flex flex-wrap items-center gap-3">
          <Select 
            v-model="selectedCategory" 
            :options="['', ...categories]" 
            placeholder="Semua Kategori"
            class="min-w-[170px]"
            size="small"
          >
            <template #value="slotProps">
              <span>{{ slotProps.value || 'Semua Kategori' }}</span>
            </template>
            <template #option="slotProps">
              <span>{{ slotProps.option || 'Semua Kategori' }}</span>
            </template>
          </Select>

          <Select 
            v-model="selectedFolder" 
            :options="[{ id: '', name: 'Semua Folder' }, ...store.folders]" 
            optionLabel="name"
            optionValue="id"
            placeholder="Semua Folder"
            class="min-w-[180px]"
            size="small"
          />

          <!-- Checkbox Sertakan Tempat Sampah yang Jelas & Responsif -->
          <label class="flex items-center gap-2 cursor-pointer ml-auto select-none p-1.5 px-3 rounded-lg border border-border bg-surface-2 hover:bg-surface-hover transition-colors">
            <input
              type="checkbox"
              v-model="includeTrash"
              class="w-4 h-4 cursor-pointer accent-blue-600 rounded"
            />
            <span
              class="text-xs font-semibold"
              :class="{ 'text-blue-400': includeTrash, 'text-muted': !includeTrash }"
            >
              Sertakan tempat sampah
            </span>
            <span v-if="includeTrash" class="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold">
              AKTIF
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Results Panel -->
    <div class="panel">
      <div class="panel-head flex items-center justify-between">
        <h2>{{ searchResults.length }} hasil ditemukan</h2>
        <span v-if="includeTrash" class="text-xs text-muted">
          (Termasuk dokumen di tempat sampah)
        </span>
      </div>

      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Nama Dokumen</th>
              <th>Kategori</th>
              <th>Folder</th>
              <th>Versi</th>
              <th>Ukuran</th>
              <th>Pemilik</th>
              <th>Tanggal</th>
              <th style="text-align: right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="8" style="text-align: center; padding: 32px;" class="muted">
                <div class="flex flex-col items-center justify-center gap-2">
                  <ProgressSpinner style="width: 32px; height: 32px" strokeWidth="4" />
                  <span>Memuat data dokumen...</span>
                </div>
              </td>
            </tr>

            <tr v-else-if="searchResults.length === 0">
              <td colspan="8">
                <div class="empty">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="10.5" cy="10.5" r="6.5"/><line x1="20" y1="20" x2="15.4" y2="15.4"/>
                  </svg>
                  <div>Tidak ada dokumen yang cocok dengan filter pencarian.</div>
                </div>
              </td>
            </tr>

            <tr
              v-else
              v-for="doc in paginatedSearchResults"
              :key="doc.id"
              class="clickable"
              @click="openDocDetail(doc)"
            >
              <td>
                <div class="docname">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/>
                  </svg>
                  <span class="truncate" :title="doc.name">{{ doc.name }}</span>
                  <span
                    v-if="isDocTrashed(doc)"
                    class="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-bold ml-1.5 inline-block"
                  >
                    TEMPAT SAMPAH
                  </span>
                </div>
              </td>
              <td>
                <Tag
                  rounded
                  class="category-pill"
                  :style="{
                    background: getCategoryBadge(getCategoryName(doc)).bg,
                    color: getCategoryBadge(getCategoryName(doc)).text,
                    border: getCategoryBadge(getCategoryName(doc)).border,
                  }"
                >
                  <span
                    class="dot"
                    :style="{ background: getCategoryBadge(getCategoryName(doc)).dot }"
                  ></span>
                  {{ getCategoryName(doc) }}
                </Tag>
              </td>
              <td class="muted text-xs">{{ getFolderName(doc.folderId || doc.folder_id) }}</td>
              <td><span class="num">v{{ getCurrentVersion(doc)?.v || 1 }}</span></td>
              <td><span class="num">{{ store.fmtSize(doc.size) }}</span></td>
              <td class="muted text-xs font-semibold">{{ getOwnerName(doc) }}</td>
              <td><span class="num muted text-xs">{{ doc.date }}</span></td>
              <td style="text-align: right" @click.stop>
                <div class="flex items-center justify-end gap-1">
                  <button
                    class="iconbtn"
                    title="Unduh dokumen"
                    @click="handleDownload(doc)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </button>
                  <button
                    class="iconbtn"
                    title="Detail dokumen"
                    @click="openDocDetail(doc)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Numeric Pagination (PrimeVue) -->
      <div class="border-t border-[var(--border)] p-2 flex justify-center">
        <Paginator
          v-model:first="first"
          :rows="rows"
          :totalRecords="searchResults.length"
          :alwaysShow="true"
          @page="(e) => first = e.first"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
        />
      </div>
    </div>

    <!-- Scrim & Drawer -->
    <div class="scrim" :class="{ open: isDrawerOpen }" @click="closeDrawer"></div>
    <div class="drawer" :class="{ open: isDrawerOpen }">
      <template v-if="selectedDoc">
        <div class="drawer-head">
          <div class="flex flex-col gap-1 pr-4">
            <h3 class="font-bold text-sm leading-snug">{{ selectedDoc.name }}</h3>
            <div class="flex items-center gap-2">
              <Tag
                rounded
                class="category-pill"
                :style="{
                  background: getCategoryBadge(getCategoryName(selectedDoc)).bg,
                  color: getCategoryBadge(getCategoryName(selectedDoc)).text,
                  border: getCategoryBadge(getCategoryName(selectedDoc)).border,
                }"
              >
                <span
                  class="dot"
                  :style="{ background: getCategoryBadge(getCategoryName(selectedDoc)).dot }"
                ></span>
                {{ getCategoryName(selectedDoc) }}
              </Tag>
              <span class="text-xs text-text-muted">Folder: {{ getFolderName(selectedDoc.folderId || selectedDoc.folder_id) }}</span>
            </div>
          </div>
          <button class="iconbtn" @click="closeDrawer" title="Tutup">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="drawer-body">
          <div>
            <div class="section-title">Informasi Dokumen</div>
            <div class="field-grid">
              <div class="field">
                <span class="k">Ukuran File</span>
                <span class="v num">{{ store.fmtSize(selectedDoc.size) }}</span>
              </div>
              <div class="field">
                <span class="k">Versi Aktif</span>
                <span class="v num">v{{ getCurrentVersion(selectedDoc)?.v || 1 }}</span>
              </div>
              <div class="field">
                <span class="k">Pemilik</span>
                <span class="v">{{ getOwnerName(selectedDoc) }}</span>
              </div>
              <div class="field">
                <span class="k">Tanggal</span>
                <span class="v num text-xs">{{ selectedDoc.date }}</span>
              </div>
            </div>
          </div>

          <div>
            <div class="section-title">Riwayat Versi ({{ selectedDoc.versions?.length || 1 }})</div>
            <div class="flex flex-col">
              <div
                v-for="(ver, idx) in (selectedDoc.versions || [getCurrentVersion(selectedDoc)])"
                :key="idx"
                class="vrow"
                :class="{ current: idx === (selectedDoc.versions?.length || 1) - 1 }"
              >
                <div class="vnum">v{{ ver.version_number ?? (ver as any).v ?? 1 }}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-xs">{{ ver.uploader?.name ?? (ver as any).uploader ?? 'Admin' }}</span>
                    <span class="num text-[11px] text-text-muted">{{ store.fmtSize(ver.size_bytes ?? (ver as any).size) }}</span>
                    <span v-if="idx === (selectedDoc.versions?.length || 1) - 1" class="text-[10px] bg-accent-soft text-accent px-1.5 py-0.5 rounded font-bold">AKTIF</span>
                  </div>
                  <div class="text-[11.5px] text-text-muted truncate">{{ ver.note }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="btnrow pt-3 border-t border-border mt-auto">
            <button class="btn primary flex-1 justify-center" @click="handleDownload(selectedDoc)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Unduh File
            </button>
            <button
              v-if="!isDocTrashed(selectedDoc)"
              class="btn danger"
              @click="handleTrash(selectedDoc)"
            >
              Pindahkan ke Sampah
            </button>
            <button
              v-else
              class="btn success"
              style="color: var(--success); font-weight: 600"
              @click="handleRestore(selectedDoc)"
            >
              Pulihkan Dokumen
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
