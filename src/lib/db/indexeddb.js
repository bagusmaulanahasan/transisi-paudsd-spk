/**
 * Helper IndexedDB untuk cache lokal dan penyimpanan penilaian saat offline.
 */

const DB_NAME = "spk_paud_sd_db";
const DB_VERSION = 3;

/**
 * Membuka atau menginisialisasi database IndexedDB lokal.
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      // Tutup koneksi lama saat versi naik agar upgrade berikutnya tidak tertahan.
      db.onversionchange = () => db.close();
      resolve(db);
    };

    // Terjadi bila tab lain masih memegang koneksi versi lama.
    request.onblocked = () => {
      console.warn("Upgrade IndexedDB tertahan oleh koneksi lain. Tutup tab aplikasi lain lalu muat ulang halaman.");
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store cache data aplikasi
      if (!db.objectStoreNames.contains("cache")) {
        db.createObjectStore("cache", { keyPath: "key" });
      }

      // Store penilaian yang disimpan saat offline (menunggu sinkronisasi)
      if (!db.objectStoreNames.contains("offline_penilaian")) {
        db.createObjectStore("offline_penilaian", { keyPath: "id" });
      }
    };
  });
}

/**
 * Menyimpan data ke cache lokal (Key-Value).
 * @param {string} key
 * @param {any} value
 * @returns {Promise<void>}
 */
export async function setCache(key, value) {
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction("cache", "readwrite");
    const store = tx.objectStore("cache");
    const request = store.put({
      key,
      value,
      updated_at: new Date().toISOString(),
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mengambil data dari cache lokal berdasarkan Key.
 * @param {string} key
 * @returns {Promise<any>}
 */
export async function getCache(key) {
  const db = await openDB();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction("cache", "readonly");
    const store = tx.objectStore("cache");
    const request = store.get(key);
    request.onsuccess = () =>
      resolve(request.result ? request.result.value : null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Menghapus satu item cache lokal berdasarkan Key.
 * @param {string} key
 * @returns {Promise<void>}
 */
export async function deleteCache(key) {
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction("cache", "readwrite");
    const store = tx.objectStore("cache");
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Menghapus semua item cache yang key-nya diawali prefix tertentu.
 * @param {string} prefix
 * @returns {Promise<void>}
 */
export async function clearCacheByPrefix(prefix) {
  const db = await openDB();
  if (!db) return;

  const semuaKey = await new Promise((resolve, reject) => {
    const tx = db.transaction("cache", "readonly");
    const request = tx.objectStore("cache").getAllKeys();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });

  const keyCocok = semuaKey.filter(
    (key) => typeof key === "string" && key.startsWith(prefix),
  );
  if (keyCocok.length === 0) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction("cache", "readwrite");
    const store = tx.objectStore("cache");
    for (const key of keyCocok) store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ==================== PENILAIAN OFFLINE ====================

/**
 * Kunci unik penilaian offline: satu baris per kombinasi anak + indikator,
 * sehingga jawaban terbaru menimpa jawaban lama (setara onConflict di Supabase).
 * @param {number|string} anakId
 * @param {number|string} indikatorId
 * @returns {string}
 */
export function idPenilaianOffline(anakId, indikatorId) {
  return `${anakId}_${indikatorId}`;
}

/**
 * Menyimpan (upsert) satu jawaban penilaian ke perangkat saat offline.
 * @param {{ anak_id: number, indikator_id: number, opsi_jawaban_id: number, poin: number }} payload
 * @returns {Promise<string|null>} id baris yang disimpan.
 */
export async function simpanPenilaianOffline(payload) {
  const db = await openDB();
  if (!db) return null;
  if (!db.objectStoreNames.contains("offline_penilaian")) {
    db.close();
    throw new Error("Penyimpanan offline belum siap. Muat ulang halaman sekali.");
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction("offline_penilaian", "readwrite");
    const store = tx.objectStore("offline_penilaian");
    const id = idPenilaianOffline(payload.anak_id, payload.indikator_id);
    const request = store.put({
      id,
      anak_id: payload.anak_id,
      indikator_id: payload.indikator_id,
      opsi_jawaban_id: payload.opsi_jawaban_id,
      poin: payload.poin,
      status: "menunggu_sinkronisasi",
      updated_at: new Date().toISOString(),
    });
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mengambil seluruh jawaban yang masih tersimpan di perangkat.
 * @returns {Promise<Array>}
 */
export async function ambilPenilaianOffline() {
  const db = await openDB();
  if (!db) return [];
  if (!db.objectStoreNames.contains("offline_penilaian")) {
    db.close();
    return [];
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction("offline_penilaian", "readonly");
    const store = tx.objectStore("offline_penilaian");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Menghapus satu jawaban dari perangkat setelah berhasil disinkronkan.
 * @param {string} id - Hasil idPenilaianOffline(anak_id, indikator_id).
 * @returns {Promise<void>}
 */
export async function hapusPenilaianOffline(id) {
  const db = await openDB();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction("offline_penilaian", "readwrite");
    const store = tx.objectStore("offline_penilaian");
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
