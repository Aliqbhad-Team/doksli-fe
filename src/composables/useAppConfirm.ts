import { useConfirm } from 'primevue/useconfirm'

export interface ConfirmDialogOptions {
  title?: string
  message: string
  submessage?: string
  confirmLabel?: string
  cancelLabel?: string
  icon?: string
  acceptIcon?: string
  severity?: 'danger' | 'info'
  onAccept: () => void | Promise<void>
  onReject?: () => void
}

export function useAppConfirm() {
  const confirm = useConfirm()

  function confirmDelete(options: ConfirmDialogOptions) {
    confirm.require({
      header: options.title || 'Konfirmasi Hapus',
      message: options.message,
      icon: options.icon || 'trash',
      severity: options.severity || 'danger',
      submessage: options.submessage ?? 'Tindakan ini tidak dapat dibatalkan.',
      acceptLabel: options.confirmLabel || 'Hapus',
      rejectLabel: options.cancelLabel || 'Batal',
      acceptIcon: options.acceptIcon || 'trash',
      accept: options.onAccept,
      reject: options.onReject,
    } as any)
  }

  function confirmAction(options: ConfirmDialogOptions) {
    confirm.require({
      header: options.title || 'Konfirmasi Tindakan',
      message: options.message,
      icon: options.icon || 'info',
      severity: options.severity || 'info',
      submessage: options.submessage,
      acceptLabel: options.confirmLabel || 'Ya, Lanjutkan',
      rejectLabel: options.cancelLabel || 'Batal',
      acceptIcon: options.acceptIcon || 'check',
      accept: options.onAccept,
      reject: options.onReject,
    } as any)
  }

  return {
    confirm,
    confirmDelete,
    confirmAction,
  }
}
