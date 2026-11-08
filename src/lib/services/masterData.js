/**
 * Service data master: kelas, kriteria, indikator, dan perbandingan AHP.
 */
import { supabase } from '$lib/db/supabase';
import { cachedFetch } from '$lib/db/cache';

/**
 * Mengambil seluruh data master (kelas, kriteria, indikator, perbandingan AHP)
 * lewat cache SWR. Urutan query dan cache key harus sama dengan versi lama.
 * @returns {Promise<{ kelas: Array, kriteria: Array, indikator: Array, perbandingan: Array }>}
 */
export async function fetchMasterData() {
  const [kelasData, kriteriaData, indikatorData, ahpData] = await Promise.all([
    cachedFetch('master:kelas', () =>
      supabase.from('kelas').select('*').order('nama_kelas', { ascending: true })
    ),
    cachedFetch('master:kriteria', () =>
      supabase.from('kriteria').select('*').order('urutan', { ascending: true })
    ),
    cachedFetch('master:indikator', () =>
      supabase.from('indikator').select('*').order('id', { ascending: true })
    ),
    cachedFetch('master:ahp', () => supabase.from('perbandingan_ahp').select('*'))
  ]);

  return {
    kelas: kelasData || [],
    kriteria: kriteriaData || [],
    indikator: indikatorData || [],
    perbandingan: ahpData || []
  };
}
