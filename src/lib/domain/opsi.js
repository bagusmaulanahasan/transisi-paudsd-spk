/**
 * Modul aturan poin otomatis untuk opsi jawaban indikator.
 */

/**
 * Mengisi ulang poin setiap opsi jawaban menjadi 1, 2, 3, ... sesuai urutan array.
 * Poin tidak pernah diubah manual oleh pengguna, sehingga urutanlah yang menentukan nilai.
 * @param {Array<{opsi: string, poin?: number}>} daftarOpsi - Daftar opsi jawaban satu indikator
 * @returns {Array<{opsi: string, poin: number}>} Array baru dengan poin 1..n (array asal tidak berubah)
 */
export function aturPoinOpsi(daftarOpsi) {
  return daftarOpsi.map((opsi, index) => ({ ...opsi, poin: index + 1 }));
}
