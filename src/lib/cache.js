/**
 * Cache memori + IndexedDB dengan strategi stale-while-revalidate.
 * Data langsung ditampilkan dari cache, lalu diperbarui dari server di latar belakang.
 */
import { getCache, setCache, deleteCache, clearCacheByPrefix } from './db';

// Semua cache data halaman memakai prefix ini agar bisa dibersihkan sekaligus saat data berubah.
const PREFIX_DATA = 'data:';

// Cache di memori supaya perpindahan halaman dalam satu sesi terasa instan.
const memoryCache = new Map();

// Menyimpan proses refresh yang sedang berjalan agar tidak ada request ganda untuk key yang sama.
const refreshBerjalan = new Map();

/**
 * Mengambil data dari memori saja (sinkron) untuk render awal tanpa loading.
 * @param {string} name - Nama cache tanpa prefix.
 * @returns {any|null}
 */
export function peekMemoryCache(name) {
  const key = PREFIX_DATA + name;
  return memoryCache.has(key) ? memoryCache.get(key) : null;
}

/**
 * Mengambil data cache dari memori atau IndexedDB tanpa menyentuh jaringan.
 * @param {string} key - Key cache lengkap.
 * @returns {Promise<any|null>}
 */
export async function peekCache(key) {
  if (memoryCache.has(key)) return memoryCache.get(key);

  try {
    const value = await getCache(key);
    if (value !== null && value !== undefined) {
      memoryCache.set(key, value);
      return value;
    }
  } catch (error) {
    console.warn('Gagal membaca cache lokal:', key, error);
  }

  return null;
}

/**
 * Mengubah hasil query Supabase ({ data, error }) menjadi data mentah.
 * Melempar error bila query gagal agar hasil gagal tidak ikut disimpan ke cache.
 * @param {any} hasil
 * @returns {any}
 */
function ambilData(hasil) {
  if (hasil && typeof hasil === 'object' && 'data' in hasil && 'error' in hasil) {
    if (hasil.error) throw hasil.error;
    return hasil.data;
  }
  return hasil;
}

/**
 * Mengambil data terbaru dari server, menyimpannya ke cache, lalu memanggil onUpdate.
 * @param {string} key - Key cache lengkap.
 * @param {Function} fetchFn - Fungsi async pengambil data.
 * @param {Function} [onUpdate] - Dipanggil saat data baru tiba.
 * @returns {Promise<any|null>}
 */
function refreshCache(key, fetchFn, onUpdate) {
  if (refreshBerjalan.has(key)) return refreshBerjalan.get(key);

  const tugas = (async () => {
    try {
      const data = ambilData(await fetchFn());
      if (data === undefined) return null;

      memoryCache.set(key, data);
      setCache(key, data).catch(() => {});
      if (onUpdate) onUpdate(data);
      return data;
    } catch (error) {
      console.warn('Gagal memperbarui data dari server:', key, error);
      return null;
    } finally {
      refreshBerjalan.delete(key);
    }
  })();

  refreshBerjalan.set(key, tugas);
  return tugas;
}

/**
 * Mengambil data dengan strategi stale-while-revalidate.
 * Bila cache tersedia, hasil cache dikembalikan seketika dan server dicek di latar belakang.
 * Bila belum ada cache, fungsi menunggu server seperti biasa.
 * @param {string} name - Nama cache tanpa prefix.
 * @param {Function} fetchFn - Fungsi async pengambil data dari Supabase.
 * @param {Function} [onUpdate] - Dipanggil saat data terbaru dari server tiba.
 * @param {{ prefix?: string }} [options] - Prefix cache khusus (misalnya '' untuk profil).
 * @returns {Promise<any|null>}
 */
export async function cachedFetch(name, fetchFn, onUpdate, options) {
  const key = (options?.prefix ?? PREFIX_DATA) + name;
  const cached = await peekCache(key);

  if (cached !== null) {
    // Data lama langsung dipakai; pembaruan berjalan tanpa menahan halaman.
    refreshCache(key, fetchFn, onUpdate).catch(() => {});
    return cached;
  }

  return refreshCache(key, fetchFn, onUpdate);
}

/**
 * Mengubah isi cache yang sudah ada tanpa menghapusnya (write-through).
 * Dipakai setelah pengguna mengubah data agar halaman lain tetap instan.
 * @param {string} name - Nama cache tanpa prefix.
 * @param {Function} updater - Menerima data lama, mengembalikan data baru.
 * @returns {Promise<void>}
 */
export async function mutateCache(name, updater) {
  const key = PREFIX_DATA + name;

  try {
    const lama = await peekCache(key);
    if (lama === null) return;

    const baru = updater(lama);
    memoryCache.set(key, baru);
    await setCache(key, baru);
  } catch (error) {
    console.warn('Gagal memperbarui cache:', key, error);
  }
}

/**
 * Menghapus satu cache data berdasarkan nama (tanpa prefix).
 * @param {string} name
 * @returns {Promise<void>}
 */
export async function invalidateCache(name) {
  const key = PREFIX_DATA + name;
  memoryCache.delete(key);
  try {
    await deleteCache(key);
  } catch (error) {
    console.warn('Gagal menghapus cache:', key, error);
  }
}

/**
 * Menghapus seluruh cache data halaman. Dipanggil setelah tambah/ubah/hapus data
 * agar halaman lain tidak menampilkan data lama. Cache profil tidak ikut terhapus.
 * @returns {Promise<void>}
 */
export async function invalidateDataCache() {
  for (const key of [...memoryCache.keys()]) {
    if (key.startsWith(PREFIX_DATA)) memoryCache.delete(key);
  }

  try {
    await clearCacheByPrefix(PREFIX_DATA);
  } catch (error) {
    console.warn('Gagal membersihkan cache data:', error);
  }
}
