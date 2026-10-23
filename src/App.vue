<script setup lang="ts">
import ConfirmDialog from 'primevue/confirmdialog'
import Icon from './components/Icon.vue'
</script>

<template>
  <ConfirmDialog>
    <template #container="{ message, acceptCallback, rejectCallback }">
      <div class="confirm-modal-box" role="dialog" aria-modal="true">
        <div class="confirm-modal-head">
          <div class="confirm-modal-icon-badge" :class="message.severity === 'info' ? 'info' : 'danger'">
            <Icon :name="message.icon || (message.severity === 'info' ? 'info' : 'trash')" :size="20" />
          </div>
          <div style="flex: 1; min-width: 0;">
            <h3 class="confirm-modal-title">{{ message.header || 'Konfirmasi Tindakan' }}</h3>
            <p class="confirm-modal-desc">{{ message.message }}</p>
            <p v-if="message.submessage" class="confirm-modal-subdesc">{{ message.submessage }}</p>
          </div>
        </div>
        <div class="confirm-modal-foot">
          <button type="button" class="btn" @click="rejectCallback">
            {{ message.rejectLabel || 'Batal' }}
          </button>
          <button 
            type="button" 
            :class="['btn', message.severity === 'info' ? 'primary' : 'danger-solid']" 
            @click="acceptCallback"
          >
            <Icon :name="message.acceptIcon || (message.severity === 'info' ? 'check' : 'trash')" :size="14" />
            <span>{{ message.acceptLabel || (message.severity === 'info' ? 'Lanjutkan' : 'Hapus') }}</span>
          </button>
        </div>
      </div>
    </template>
  </ConfirmDialog>
  <RouterView />
</template>
