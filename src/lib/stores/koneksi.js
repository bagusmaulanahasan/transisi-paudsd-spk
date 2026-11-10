import { readable } from 'svelte/store';

/**
 * Status koneksi perangkat. Bernilai true saat SSR, lalu mengikuti
 * event online/offline browser setelah komponen berlangganan.
 */
export const online = readable(true, (set) => {
  if (typeof window === 'undefined') return;

  const perbarui = () => set(navigator.onLine);
  perbarui();

  window.addEventListener('online', perbarui);
  window.addEventListener('offline', perbarui);

  return () => {
    window.removeEventListener('online', perbarui);
    window.removeEventListener('offline', perbarui);
  };
});
