import { writable } from 'svelte/store';

export const confirmState = writable({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Ya, Lanjutkan',
  cancelText: 'Batal',
  resolve: null
});

/**
 * Trigger programmatic confirmation modal
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.message
 * @param {string} [options.confirmText]
 * @param {string} [options.cancelText]
 * @returns {Promise<boolean>}
 */
export function confirmAction(options) {
  return new Promise((resolve) => {
    confirmState.set({
      isOpen: true,
      title: options.title || 'Konfirmasi',
      message: options.message || 'Apakah Anda yakin?',
      confirmText: options.confirmText || 'Ya, Lanjutkan',
      cancelText: options.cancelText || 'Batal',
      resolve
    });
  });
}
