// Service worker sederhana: network-first + runtime cache untuk aset origin sendiri.
// Request ke domain lain (mis. *.supabase.co) sengaja tidak disentuh agar data tetap online.

const CACHE_NAME = "spk-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Hapus cache versi lama agar aset usang tidak dipakai.
      const namaCache = await caches.keys();
      await Promise.all(
        namaCache.filter((nama) => nama !== CACHE_NAME).map((nama) => caches.delete(nama)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Hanya GET.
  if (request.method !== "GET") return;

  // Hanya aset dari origin aplikasi ini. Supabase dan domain lain dibiarkan lewat jaringan.
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(networkFirst(request));
});

/**
 * Coba jaringan lebih dulu, simpan respons sukses, lalu pakai cache saat offline.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      // Simpan salinan; jangan gagalkan respons utama bila cache bermasalah.
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;

    // Navigasi ke halaman yang belum pernah dibuka: tidak ada fallback,
    // biarkan browser menampilkan halaman offline-nya sendiri.
    throw error;
  }
}
