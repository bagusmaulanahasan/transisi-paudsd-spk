/**
 * Service daftar kelas beserta jumlah anak per kelas.
 */
import { supabase } from '$lib/db/supabase';
import { cachedFetch } from '$lib/db/cache';

/**
 * Mengambil seluruh kelas dan jumlah anak per kelas dalam satu permintaan paralel.
 * @returns {Promise<{ kelas: Array, jumlahAnak: Record<number, number> }>}
 */
async function ambilKelas() {
  const [kelasRes, anakRes] = await Promise.all([
    supabase.from('kelas').select('*').order('nama_kelas', { ascending: true }),
    supabase.from('anak').select('kelas_id')
  ]);

  if (kelasRes.error) throw kelasRes.error;
  if (anakRes.error) throw anakRes.error;

  const petaJumlah = {};
  for (const anak of anakRes.data || []) {
    if (anak.kelas_id !== null) {
      petaJumlah[anak.kelas_id] = (petaJumlah[anak.kelas_id] || 0) + 1;
    }
  }

  return { kelas: kelasRes.data || [], jumlahAnak: petaJumlah };
}

/**
 * Mengambil daftar kelas beserta jumlah anak per kelas.
 * @param {Function} [onUpdate] - callback data baru dari server
 * @returns {Promise<{ kelas: Array, jumlahAnak: Record<number, number> } | null>}
 */
export async function fetchKelasDenganJumlahAnak(onUpdate) {
  return cachedFetch('kelas-list', ambilKelas, onUpdate);
}
