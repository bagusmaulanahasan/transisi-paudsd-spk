import { writable } from 'svelte/store';

/**
 * Pilihan kolom identitas anak yang ditampilkan pada tabel.
 * Nilai `value` sengaja sama dengan nama properti pada objek anak agar
 * komponen tinggal mengambil `anak[jenis]`.
 */
export const OPSI_TAMPILAN_NAMA = [
  { value: 'nama', label: 'Nama Lengkap' },
  { value: 'nama_panggilan', label: 'Nama Panggilan' },
  { value: 'kode_anak', label: 'Kode Anak' }
];

const KUNCI_SIMPAN = 'spk:tampilan-nama';
const NILAI_SAH = OPSI_TAMPILAN_NAMA.map((opsi) => opsi.value);

/**
 * Membaca preferensi tampilan dari localStorage (bila tersedia).
 * @returns {string} Salah satu nilai pada OPSI_TAMPILAN_NAMA.
 */
function bacaPreferensi() {
  if (typeof window === 'undefined') return 'nama';

  try {
    const tersimpan = window.localStorage.getItem(KUNCI_SIMPAN);
    return NILAI_SAH.includes(tersimpan) ? tersimpan : 'nama';
  } catch {
    return 'nama';
  }
}

/** Jenis tampilan nama yang sedang aktif. */
export const tampilanNamaAktif = writable(bacaPreferensi());

/**
 * Mengubah tampilan nama sekaligus menyimpannya sebagai preferensi.
 * @param {string} jenis - Salah satu nilai pada OPSI_TAMPILAN_NAMA.
 */
export function simpanTampilanNama(jenis) {
  if (!NILAI_SAH.includes(jenis)) return;

  tampilanNamaAktif.set(jenis);

  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KUNCI_SIMPAN, jenis);
  } catch {
    // Preferensi gagal disimpan (mode privat): abaikan, tampilan tetap berubah.
  }
}

/**
 * Label kolom untuk jenis tampilan tertentu.
 * @param {string} jenis
 * @returns {string}
 */
export function labelKolomNama(jenis) {
  return OPSI_TAMPILAN_NAMA.find((opsi) => opsi.value === jenis)?.label ?? 'Nama Lengkap';
}

/**
 * Mengambil nilai identitas anak sesuai jenis tampilan.
 * @param {Object|null} anak
 * @param {string} jenis
 * @returns {string|null} null bila kosong/tidak tersedia.
 */
export function nilaiNama(anak, jenis) {
  const nilai = anak?.[jenis];
  if (nilai === null || nilai === undefined) return null;

  const teks = String(nilai).trim();
  return teks === '' ? null : teks;
}
