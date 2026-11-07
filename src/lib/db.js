/**
 * Helper IndexedDB untuk menyimpan cache lokal dan antrean sinkronisasi (sync_queue) ketika offline.
 */

const DB_NAME = "spk_paud_sd_db";
const DB_VERSION = 1;

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
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store untuk antrean perubahan offline
      if (!db.objectStoreNames.contains("sync_queue")) {
        db.createObjectStore("sync_queue", {
          keyPath: "id",
          autoIncrement: true,
        });
      }

      // Store cache data aplikasi
      if (!db.objectStoreNames.contains("cache")) {
        db.createObjectStore("cache", { keyPath: "key" });
      }
    };
  });
}

/**
 * Menyimpan item ke dalam antrean sinkronisasi offline.
 * @param {Object} actionData - Data aksi (misal: { table, action, payload, timestamp })
 * @returns {Promise<number>}
 */
export async function addToSyncQueue(actionData) {
  const db = await openDB();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sync_queue", "readwrite");
    const store = tx.objectStore("sync_queue");
    const request = store.add({
      ...actionData,
      created_at: new Date().toISOString(),
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mengambil seluruh daftar antrean sinkronisasi offline.
 * @returns {Promise<Array>}
 */
export async function getSyncQueue() {
  const db = await openDB();
  if (!db) return [];
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sync_queue", "readonly");
    const store = tx.objectStore("sync_queue");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Menghapus item dari antrean sinkronisasi berdasarkan ID.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function removeFromSyncQueue(id) {
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sync_queue", "readwrite");
    const store = tx.objectStore("sync_queue");
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
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
