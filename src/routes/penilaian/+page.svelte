<script>
  import { supabase } from '$lib/supabase';
  import { hitungBobotAhp } from '$lib/ahp';
  import { hitungMoora } from '$lib/moora';
  import { simpanHasilPerhitungan } from '$lib/hasil';
  import { cachedFetch, peekMemoryCache } from '$lib/cache';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import {
    Loader2,
    Users,
    School,
    AlertCircle,
    ArrowRight,
    Trophy,
    Eye
  } from 'lucide-svelte';

  // Data master dari cache memori dipakai lebih dulu agar tabel tampil seketika.
  const kelasAwal = peekMemoryCache('master:kelas');
  const kriteriaAwal = peekMemoryCache('master:kriteria');
  const indikatorAwal = peekMemoryCache('master:indikator');
  const ahpAwal = peekMemoryCache('master:ahp');

  // ==================== DATA MASTER ====================
  let kelasList = kelasAwal || [];
  let kriteriaList = kriteriaAwal || [];
  let indikatorList = indikatorAwal || [];
  let perbandinganList = ahpAwal || [];

  // ==================== PILIHAN KELAS ====================
  let selectedKelasId = pilihKelas(kelasAwal || []);

  // Anak & jawaban dari cache memori dipakai langsung agar tabel tidak berkedip saat dibuka ulang.
  const kelasDataAwal = selectedKelasId
    ? peekMemoryCache('penilaian:kelas:' + selectedKelasId)
    : null;

  let anakList = kelasDataAwal?.anak ?? [];
  let jawabanList = kelasDataAwal?.jawaban ?? [];

  // ==================== STATUS ====================
  let loadingMaster = !(kelasAwal && kriteriaAwal && indikatorAwal && ahpAwal);
  let loadingKelas = selectedKelasId !== null && kelasDataAwal === null;
  let bobot = [];
  let ahpSiap = false;
  let pesanAhp = '';
  let hasil = { baris: [], jumlahLengkap: 0, jumlahAnak: 0 };
  let statusSimpanHasil = '';
  let waktuPerhitungan = null;

  // Hitung hasil lebih awal dari cache agar angka langsung tampil tanpa loading.
  if (kelasDataAwal && !loadingMaster) hitungUlang();

  onMount(async () => {
    await fetchMaster();
    loadingMaster = false;
  });

  /**
   * Menentukan kelas yang dipakai: dari query ?kelas= bila valid, jika tidak kelas pertama.
   * @param {Array} daftarKelas
   * @returns {number|null}
   */
  function pilihKelas(daftarKelas) {
    const kelasDariUrl = Number($page.url.searchParams.get('kelas'));
    const adaDiUrl = daftarKelas.some((kelas) => kelas.id === kelasDariUrl);
    return adaDiUrl ? kelasDariUrl : daftarKelas[0]?.id ?? null;
  }

  /**
   * Mengambil data master lewat cache agar perpindahan halaman berikutnya instan.
   */
  async function fetchMaster() {
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

    if (kelasData) kelasList = kelasData;
    if (kriteriaData) kriteriaList = kriteriaData;
    if (indikatorData) indikatorList = indikatorData;
    if (ahpData) perbandinganList = ahpData;

    if (kelasList.length > 0) {
      // Pilihan dari URL dipertahankan agar tidak reset saat kembali dari halaman penilaian anak.
      if (!selectedKelasId) selectedKelasId = pilihKelas(kelasList);
      await fetchKelasData();
    }
  }

  /**
   * Mengambil anak dan seluruh jawabannya pada kelas yang sedang dipilih.
   */
  async function fetchKelasData() {
    if (!selectedKelasId) {
      anakList = [];
      jawabanList = [];
      loadingKelas = false;
      hitungUlang();
      return;
    }

    const cacheKey = 'penilaian:kelas:' + selectedKelasId;
    const cacheTersedia = peekMemoryCache(cacheKey);
    loadingKelas = cacheTersedia === null;

    const data = await cachedFetch(cacheKey, async () => {
      const { data: anakData, error: anakError } = await supabase
        .from('anak')
        .select('*')
        .eq('kelas_id', selectedKelasId)
        .order('nama', { ascending: true });

      if (anakError) throw anakError;

      const daftarAnak = anakData || [];
      if (daftarAnak.length === 0) return { anak: [], jawaban: [] };

      const anakIds = daftarAnak.map((anak) => anak.id);
      const { data: jawabanData, error: jawabanError } = await supabase
        .from('detail_penilaian')
        .select('*')
        .in('anak_id', anakIds);

      if (jawabanError) throw jawabanError;

      return { anak: daftarAnak, jawaban: jawabanData || [] };
    });

    anakList = data?.anak || [];
    jawabanList = data?.jawaban || [];
    loadingKelas = false;
    hitungUlang();
  }

  /**
   * Menangani pergantian kelas dan menyimpan pilihan kelas ke URL.
   */
  async function gantiKelas() {
    goto(`/penilaian?kelas=${selectedKelasId}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true
    });
    await fetchKelasData();
  }

  /**
   * Menghitung bobot AHP dan MOORA untuk seluruh anak pada kelas terpilih.
   */
  function hitungUlang() {
    const hasilAhp = hitungBobotAhp(kriteriaList, perbandinganList);
    bobot = hasilAhp.bobot;
    ahpSiap = hasilAhp.ahpSiap;
    pesanAhp = hasilAhp.pesan;

    hasil = hitungMoora({
      anakList,
      kriteriaList,
      indikatorList,
      jawabanList,
      bobot,
      ahpSiap
    });

    if (ahpSiap && selectedKelasId) {
      simpanHasil(hasil);
    } else {
      statusSimpanHasil = '';
    }
  }

  /**
   * Menyimpan hasil MOORA terakhir ke tabel hasil_perhitungan (best effort).
   */
  async function simpanHasil(data) {
    const status = await simpanHasilPerhitungan(
      supabase,
      selectedKelasId,
      kriteriaList,
      data
    );
    statusSimpanHasil = status.pesan;
    if (status.ok) waktuPerhitungan = new Date();
  }

  /**
   * Membuka halaman penilaian untuk satu anak.
   */
  function bukaAnak(anakId) {
    goto(`/penilaian/${anakId}?kelas=${selectedKelasId}`);
  }

  /**
   * Membuka halaman anak lewat keyboard (Enter atau Spasi) pada baris tabel.
   */
  function bukaAnakDariKeyboard(event, anakId) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      bukaAnak(anakId);
    }
  }
</script>

<svelte:head>
  <title>Penilaian & MOORA - SPK Transisi PAUD-SD</title>
</svelte:head>

<div class="space-y-8">
  <!-- Header Halaman -->
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Penilaian Anak & Perankingan MOORA</h1>
      <p class="text-sm text-slate-500 mt-1 font-medium">
        Pilih kelas, lalu klik <span class="font-bold text-slate-700">Lihat</span> pada baris anak untuk membuka penilaian. Tampilan awal hanya baca.
      </p>
    </div>
    <span class="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-[11px] font-bold w-fit">
      <Trophy class="w-3.5 h-3.5" />
      Perhitungan otomatis
    </span>
  </div>

  {#if loadingMaster}
    <div class="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div class="flex flex-col items-center space-y-3">
        <Loader2 class="w-8 h-8 text-blue-600 animate-spin" />
        <p class="text-slate-500 text-sm font-medium">Menyiapkan data penilaian...</p>
      </div>
    </div>
  {:else if kelasList.length === 0}
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
      <School class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p class="text-base font-bold text-slate-800">Belum ada kelas</p>
      <p class="text-xs text-slate-500 mt-1 mb-5">Tambahkan kelas dan data anak terlebih dahulu sebelum melakukan penilaian.</p>
      <a
        href="/kelas"
        class="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-200"
      >
        <span>Buka Kelola Kelas</span>
        <ArrowRight class="w-4 h-4 ml-1.5" />
      </a>
    </div>
  {:else}
    <!-- Pemilihan Kelas -->
    <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-4">
      <div class="max-w-md">
        <label for="pilih-kelas" class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Pilih Kelas</label>
        <select
          id="pilih-kelas"
          bind:value={selectedKelasId}
          on:change={gantiKelas}
          class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer"
        >
          {#each kelasList as kelas (kelas.id)}
            <option value={kelas.id}>{kelas.nama_kelas} — {kelas.tahun_ajaran}</option>
          {/each}
        </select>
      </div>
      <p class="text-[11px] text-slate-400 font-medium leading-relaxed">
        Nilai Yi dan ranking dihitung otomatis dari jawaban terbaru seluruh anak di kelas ini.
      </p>
    </section>

    {#if loadingKelas}
      <div class="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div class="flex flex-col items-center space-y-3">
          <Loader2 class="w-8 h-8 text-blue-600 animate-spin" />
          <p class="text-slate-500 text-sm font-medium">Memuat data kelas...</p>
        </div>
      </div>
    {:else if anakList.length === 0}
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
        <Users class="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p class="text-base font-bold text-slate-800">Belum ada anak pada kelas ini</p>
        <p class="text-xs text-slate-500 mt-1 mb-5">Tambahkan data anak terlebih dahulu, lalu kembali ke halaman penilaian.</p>
        <a
          href={`/kelas/${selectedKelasId}`}
          class="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-200"
        >
          <Users class="w-4 h-4 mr-1.5" />
          <span>Kelola Anak Kelas Ini</span>
        </a>
      </div>
    {:else}
      {#if !ahpSiap}
        <div class="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex items-start gap-2.5 flex-1">
            <AlertCircle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p class="text-xs font-medium text-amber-800 leading-relaxed">
              {pesanAhp} Nilai Yi dan ranking belum dapat dihitung.
            </p>
          </div>
          <a href="/kriteria" class="inline-flex items-center px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition w-fit whitespace-nowrap">
            Buka Kriteria & AHP
            <ArrowRight class="w-3.5 h-3.5 ml-1" />
          </a>
        </div>
      {/if}

      {#if indikatorList.length === 0}
        <div class="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex items-start gap-2.5 flex-1">
            <AlertCircle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p class="text-xs font-medium text-amber-800">Belum ada indikator pertanyaan. Tambahkan indikator agar anak dapat dinilai.</p>
          </div>
          <a href="/indikator" class="inline-flex items-center px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition w-fit whitespace-nowrap">
            Buka Indikator
            <ArrowRight class="w-3.5 h-3.5 ml-1" />
          </a>
        </div>
      {/if}

      <!-- Tabel Hasil MOORA -->
      <section class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Trophy class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-900 tracking-tight">Hasil Perhitungan MOORA</h2>
              <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                Nilai Yi dibulatkan 3 angka di belakang koma. Klik baris anak atau tombol Lihat untuk membuka penilaian.
              </p>
            </div>
          </div>
          <div class="flex flex-col items-start lg:items-end gap-1">
            <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap">
              Lengkap {hasil.jumlahLengkap}/{hasil.jumlahAnak} Anak
            </span>
            {#if waktuPerhitungan}
              <span class="text-[10px] text-slate-400 font-medium">
                Diperbarui {waktuPerhitungan.toLocaleTimeString('id-ID')}
              </span>
            {/if}
          </div>
        </div>

        <div class="p-5 md:p-6 space-y-4">
          <!-- Bobot AHP yang dipakai -->
          <div class="flex flex-wrap gap-2">
            {#each kriteriaList as kriteria, index (kriteria.id)}
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                {kriteria.inisial}: {bobot[index] !== undefined ? bobot[index].toFixed(3) : '—'}
                <span class="text-slate-400">({kriteria.jenis})</span>
              </span>
            {/each}
          </div>

          {#if hasil.baris.length === 0}
            <div class="flex flex-col items-center justify-center p-10 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
              <Users class="w-8 h-8 text-slate-300 mb-3" />
              <p class="text-sm font-bold text-slate-700">Belum ada data untuk dihitung</p>
              <p class="text-xs text-slate-500 mt-1">Tambahkan anak dan isi jawaban indikator terlebih dahulu.</p>
            </div>
          {:else}
            <div class="xl:hidden">
              <p class="text-[11px] text-slate-400 font-medium">Geser tabel ke samping untuk melihat semua kolom.</p>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse" style={`min-width: ${640 + kriteriaList.length * 80}px`}>
                <thead>
                  <tr class="bg-slate-50">
                    <th class="px-3 sm:px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-12 sm:w-16">No.</th>
                    <th class="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-20 lg:w-32 hidden lg:table-cell">NIS</th>
                    <th class="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[130px] lg:w-auto">Nama Anak</th>
                    <th class="px-2 sm:px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap lg:hidden">Aksi</th>
                    {#each kriteriaList as kriteria (kriteria.id)}
                      <th class="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">{kriteria.inisial}</th>
                    {/each}
                    <th class="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Nilai Yi</th>
                    <th class="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Ranking</th>
                    <th class="px-2 sm:px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap hidden lg:table-cell">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  {#each hasil.baris as baris, index (baris.anak_id)}
                    <tr
                      class="cursor-pointer transition hover:bg-blue-50 focus:outline-none focus:bg-blue-50"
                      tabindex="0"
                      role="link"
                      aria-label={`Buka penilaian ${baris.nama}`}
                      on:click={() => bukaAnak(baris.anak_id)}
                      on:keydown={(event) => bukaAnakDariKeyboard(event, baris.anak_id)}
                    >
                      <td class="px-3 sm:px-4 py-4 text-sm font-bold text-slate-500">{index + 1}</td>
                      <td class="px-4 py-4 w-20 lg:w-32 hidden lg:table-cell">
                        {#if baris.nis}
                          <span class="text-sm font-semibold text-slate-700">{baris.nis}</span>
                        {:else}
                          <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap">
                            Belum diisi
                          </span>
                        {/if}
                      </td>
                      <td class="px-4 py-4 w-[130px] lg:w-auto text-sm font-bold text-slate-800 leading-snug">{baris.nama}</td>
                      <td class="px-2 sm:px-3 py-4 text-center lg:hidden">
                        <a
                          href={`/penilaian/${baris.anak_id}?kelas=${selectedKelasId}`}
                          on:click|stopPropagation
                          class="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-lg text-[11px] font-bold transition whitespace-nowrap"
                        >
                          <Eye class="w-3.5 h-3.5" />
                          Lihat
                        </a>
                      </td>
                      {#each baris.nilai as nilai}
                        <td class="px-4 py-4 text-sm font-semibold text-slate-700 text-center">{nilai}</td>
                      {/each}
                      <td class="px-4 py-4 text-sm font-extrabold text-slate-900 text-center">
                        {baris.yi !== null ? baris.yi.toFixed(3) : '—'}
                      </td>
                      <td class="px-4 py-4 text-center">
                        {#if baris.ranking !== null}
                          <span class="inline-flex items-center justify-center min-w-[34px] px-2.5 py-1 bg-blue-600 text-white text-xs font-extrabold rounded-lg">
                            {baris.ranking}
                          </span>
                        {:else if !ahpSiap}
                          <span class="text-xs font-bold text-slate-400">—</span>
                        {:else}
                          <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap">
                            Belum lengkap
                          </span>
                        {/if}
                      </td>
                      <td class="px-2 sm:px-4 py-4 text-center hidden lg:table-cell">
                        <a
                          href={`/penilaian/${baris.anak_id}?kelas=${selectedKelasId}`}
                          on:click|stopPropagation
                          class="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-lg text-[11px] font-bold transition whitespace-nowrap"
                        >
                          <Eye class="w-3.5 h-3.5" />
                          Lihat
                        </a>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            {#if hasil.jumlahLengkap < hasil.jumlahAnak}
              <div class="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-[11px] font-medium text-amber-800 leading-relaxed flex items-start gap-2">
                <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p>
                    {hasil.jumlahAnak - hasil.jumlahLengkap} anak belum lengkap menjawab seluruh indikator sehingga belum masuk ranking:
                  </p>
                  <ul class="mt-1.5 space-y-0.5">
                    {#each hasil.baris.filter((baris) => !baris.lengkap) as baris (baris.anak_id)}
                      <li class="font-semibold">{baris.nama} — {baris.terjawab}/{baris.total} indikator terjawab</li>
                    {/each}
                  </ul>
                </div>
              </div>
            {/if}
          {/if}
        </div>

        {#if statusSimpanHasil}
          <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
            <p class="text-[11px] text-slate-500 font-medium leading-relaxed">{statusSimpanHasil}</p>
          </div>
        {/if}
      </section>
    {/if}
  {/if}
</div>
