<script setup lang="ts">
defineProps<{ name: string; size?: number }>()
const icons: Record<string, string> = {
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  folder:'<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l1.7 2H19.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><line x1="20" y1="20" x2="15.4" y2="15.4"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  archive:'<rect x="3" y="4" width="18" height="4.2" rx="1"/><path d="M4.5 8.5v9a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-9"/><path d="M10 12.5h4"/>',
  sun:'<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
  moon:'<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  plus:'<path d="M12 5v14"/><path d="M5 12h14"/>',
  upload:'<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  download:'<path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  trash:'<path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12"/>',
  file:'<path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/>',
  chevron:'<path d="M9 6l6 6-6 6"/>',
  x:'<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
  check:'<path d="M20 6L9 17l-5-5"/>',
  lock:'<rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="17" r="1"/>',
  'alert-circle':'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  user:'<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2"/>',
  userplus:'<circle cx="9.5" cy="8" r="3.6"/><path d="M2.5 20c0-3.6 3.1-6.2 7-6.2 1.3 0 2.5.3 3.6.8"/><path d="M18 8.5v6"/><path d="M15 11.5h6"/>',
  building:'<rect x="4" y="3" width="16" height="18" rx="1.2"/><path d="M9 21v-4h6v4"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>',
  group:'<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9.2" r="2.6"/><path d="M2.3 20c0-3.3 2.6-5.8 5.9-5.8 2.1 0 3.9.9 5 2.4"/><path d="M13 15.6c.9-.6 2-1 3.3-1 2.9 0 5.2 2.2 5.4 5.1"/>',
  tag:'<path d="M12.6 3.4H6.4A2.4 2.4 0 0 0 4 5.8v6.2c0 .6.24 1.24.68 1.68l7.5 7.5a2.4 2.4 0 0 0 3.4 0l4.94-4.94a2.4 2.4 0 0 0 0-3.4l-7.5-7.5a2.4 2.4 0 0 0-.42-.34z"/><circle cx="8.6" cy="8.6" r="1.4"/>',
  database:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  'chevron-down':'<path d="M6 9l6 6 6-6"/>',
  'chevron-up':'<path d="M18 15l-6-6-6 6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.7" r="0.2" fill="currentColor" stroke-width="1.4"/>',
  edit:'<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  shield:'<path d="M12 3.2l7.5 2.8v5.6c0 4.6-3.2 8.1-7.5 9.2-4.3-1.1-7.5-4.6-7.5-9.2V6z"/><path d="M9 12l2.3 2.3L15.5 10"/>',
}
</script>
<template>
  <svg :width="size ?? 16" :height="size ?? 16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" v-html="icons[name] ?? ''" />
</template>
