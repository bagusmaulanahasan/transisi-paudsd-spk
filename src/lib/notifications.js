import { writable } from 'svelte/store';

let idBerikut = 1;
export const toasts = writable([]);

export function notify(pesan, tipe = 'error') {
  const id = idBerikut++;
  toasts.update((daftar) => [...daftar, { id, pesan, tipe }]);
  setTimeout(() => tutupToast(id), 4000);
}

export function tutupToast(id) {
  toasts.update((daftar) => daftar.filter((toast) => toast.id !== id));
}

export const notifySuccess = (pesan) => notify(pesan, 'success');
export const notifyError = (pesan) => notify(pesan, 'error');
