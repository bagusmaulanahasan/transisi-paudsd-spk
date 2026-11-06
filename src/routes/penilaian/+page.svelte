<script>
  import { supabase } from '$lib/supabase';
  import { calculateAHP } from '$lib/ahp';
  import { hitungMoora } from '$lib/moora';
  import { onMount } from 'svelte';
  import {
    Loader2,
    Users,
    School,
    UserRound,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    ClipboardList,
    Trophy,
    RefreshCw
  } from 'lucide-svelte';

  // ==================== DATA MASTER ====================
  let kelasList = [];
  let kriteriaList = [];
  let indikatorList = [];
  let opsiList = [];
  let perbandinganList = [];

  // ==================== PILIHAN PENGGUNA ====================
  let selectedKelasId = null;
  let selectedAnakId = null;
  let anakList = [];
  let jawabanList = [];

  // ==================== STATUS ====================
  let loadingMaster = true;
  let loadingKelas = false;
  let menyimpan = null;
  let bobot = [];
  let ahpSiap = false;
  let pesanAhp = '';
  let hasil = { baris: [], jumlahLengkap: 0, jumlahAnak: 0 };
  let statusSimpanHasil = '';
  let waktuPerhitungan = null;

  onMount(async () => {
    await fetchMaster();
    loadingMaster = false;
  });

  /**
   * Mengambil seluruh data master yang dibutuhkan halaman penilaian.
   */
  async function fetchMaster() {
    const [kelasRes, kriteriaRes, indikatorRes, opsiRes, ahpRes] = await Promise.all([
      supabase.from('kelas').select('*').order('nama_kelas', { ascending: true }),
      supabase.from('kriteria').select('*').order('urutan', { ascending: true }),
      supabase.from('indikator').select('*').order('id', { ascending: true }),
      supabase.from('opsi_jawaban').select('*').is('indikator_id', null).order('poin', { ascending: true }),
      supabase.from('perbandingan_ahp').select('*')
    ]);

    if (kelasRes.error) console.error('Error fetching kelas:', kelasRes.error);
    if (kriteriaRes.error) console.error('Error fetching kriteria:', kriteriaRes.error);
    if (indikatorRes.error) console.error('Error fetching indikator:', indikatorRes.error);
    if (opsiRes.error) console.error('Error fetching opsi:', opsiRes.error);
    if (ahpRes.error) console.error('Error fetching AHP:', ahpRes.error);

    kelasList = kelasRes.data || [];
    kriteriaList = kriteriaRes.data || [];
    indikatorList = indikatorRes.data || [];
    opsiList = opsiRes.data || [];
    perbandinganList = ahpRes.data || [];

    if (kelasList.length > 0) {
      selectedKelasId = kelasList[0].id;
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
      hitungUlang();
      return;
    }

    loadingKelas = true;

    const { data: anakData, error } = await supabase
      .from('anak')
      .select('*')
      .eq('kelas_id', selectedKelasId)
      .order('nama', { ascending: true });

    if (error) {
      console.error('Error fetching anak:', error);
      anakList = [];
      jawabanList = [];
      loadingKelas = false;
      hitungUlang();
      return;
    }

    anakList = anakData;

    if (anakList.length > 0) {
      const anakIds = anakList.map((anak) => anak.id);
      const { data: jawabanData, error: jawabanError } = await supabase
        .from('detail_penilaian')
        .select('*')
        .in('anak_id', anakIds);

      if (jawabanError) console.error('Error fetching jawaban:', jawabanError);
      jawabanList = jawabanData || [];
    } else {
      jawabanList = [];
    }

    selectedAnakId = anakList[0]?.id ?? null;
    loadingKelas = false;
    hitungUlang();
  }

  /**
   * Menangani pergantian kelas pada dropdown.
   */
  async function gantiKelas() {
    selectedAnakId = null;
    await fetchKelasData();
  }

  /**
   * Menghitung bobot AHP dari matriks perbandingan yang tersimpan.
   */
  function hitungBobotAhp() {
    const n = kriteriaList.length;

    if (n === 0) {
      bobot = [];
      ahpSiap = false;
      pesanAhp = 'Belum ada kriteria penilaian. Tambahkan kriteria terlebih dahulu.';
      return;
    }

    if (n === 1) {
      bobot = [1];
      ahpSiap = true;
      pesanAhp = '';
      return;
    }

    if (perbandinganList.length === 0) {
      bobot = [];
      ahpSiap = false;
      pesanAhp = 'Bobot AHP belum diatur. Isi matriks perbandingan berpasangan terlebih dahulu.';
      return;
    }

    const matrix = Array.from({ length: n }, () => Array(n).fill(1));
    for (const item of perbandinganList) {
      const i = kriteriaList.findIndex((k) => k.id === item.kriteria_1_id);
      const j = kriteriaList.findIndex((k) => k.id === item.kriteria_2_id);
      if (i !== -1 && j !== -1) matrix[i][j] = parseFloat(item.nilai);
    }

    const ahp = calculateAHP(matrix);
    bobot = ahp.weights;
    ahpSiap = ahp.isConsistent;
    pesanAhp = ahp.isConsistent
      ? ''
      : `Matriks AHP belum konsisten (CR = ${ahp.cr.toFixed(3)}, batas 0.100). Perbaiki perbandingan agar bobot dapat dipakai.`;
  }

  /**
   * Menghitung ulang MOORA secara otomatis lalu menyimpan hasilnya.
   */
  function hitungUlang() {
    hitungBobotAhp();

    hasil = hitungMoora({
      anakList,
      kriteriaList,
      indikatorList,
      jawabanList,
      bobot,
      ahpSiap
    });

    if (ahpSiap) {
      simpanHasilPerhitungan(hasil);
    } else {
      statusSimpanHasil = '';
    }
  }

  /**
   * Menyimpan hasil MOORA terakhir ke tabel hasil_perhitungan (best effort).
   */
  async function simpanHasilPerhitungan(data) {
    try {
      const lengkap = data.baris.filter((baris) => baris.lengkap);
      const belumLengkap = data.baris.filter((baris) => !baris.lengkap);

      if (lengkap.length > 0) {
        const rows = lengkap.map((baris) => ({
          kelas_id: selectedKelasId,
          anak_id: baris.anak_id,
          nilai_kriteria: Object.fromEntries(
            kriteriaList.map((kriteria, index) => [kriteria.inisial, baris.nilai[index]])
          ),
          yi_score: baris.yi,
          ranking: baris.ranking
        }));

        const { error } = await supabase
          .from('hasil_perhitungan')
          .upsert(rows, { onConflict: 'kelas_id,anak_id' });

        if (error) throw error;
      }

      if (belumLengkap.length > 0) {
        const anakIds = belumLengkap.map((baris) => baris.anak_id);
        const { error } = await supabase
          .from('hasil_perhitungan')
          .delete()
          .eq('kelas_id', selectedKelasId)
          .in('anak_id', anakIds);

        if (error) throw error;
      }

      statusSimpanHasil = 'Hasil perhitungan tersimpan otomatis.';
      waktuPerhitungan = new Date();
    } catch (error) {
      console.warn('Gagal menyimpan hasil perhitungan:', error);
      statusSimpanHasil = 'Hasil tampil di layar, tetapi gagal disimpan ke server.';
    }
  }

  /**
   * Menyimpan jawaban indikator yang dipilih lalu memicu perhitungan ulang.
   */
  async function pilihJawaban(indikator, opsi) {
    if (!selectedAnakId) return;

    if (!navigator.onLine) {
      alert('Perangkat sedang offline. Sambungkan internet agar jawaban dapat disimpan.');
      return;
    }

    menyimpan = indikator.id;

    const payload = {
      anak_id: selectedAnakId,
      indikator_id: indikator.id,
      opsi_jawaban_id: opsi.id,
      poin: opsi.poin
    };

    const { error } = await supabase
      .from('detail_penilaian')
      .upsert(payload, { onConflict: 'anak_id,indikator_id' });

    if (error) {
      alert('Gagal menyimpan jawaban: ' + error.message);
      menyimpan = null;
      return;
    }

    const index = jawabanList.findIndex(
      (jawaban) => jawaban.anak_id === selectedAnakId && jawaban.indikator_id === indikator.id
    );

    if (index >= 0) {
      const salinan = [...jawabanList];
      salinan[index] = { ...salinan[index], ...payload };
      jawabanList = salinan;
    } else {
      jawabanList = [...jawabanList, payload];
    }

    menyimpan = null;
    hitungUlang();
  }

  // Indikator dikelompokkan per kriteria agar formulir mudah dibaca.
  $: indikatorPerKriteria = kriteriaList.map((kriteria) => ({
    ...kriteria,
    indikator: indikatorList.filter((indikator) => indikator.kriteria_id === kriteria.id)
  }));

  // Anak yang sedang dinilai pada form.
  $: anakTerpilih = anakList.find((anak) => anak.id === selectedAnakId) || null;

  // Peta jawaban indikator_id -> jawaban untuk anak yang sedang dinilai.
  $: jawabanAnakMap = (() => {
    const map = {};
    for (const jawaban of jawabanList) {
      if (jawaban.anak_id === selectedAnakId) map[jawaban.indikator_id] = jawaban;
    }
    return map;
  })();

  // Jumlah indikator yang sudah dijawab anak terpilih.
  $: terjawabAnak = indikatorList.filter((indikator) => jawabanAnakMap[indikator.id]).length;
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
        Pilih kelas dan anak, isi jawaban indikator, lalu nilai Yi serta ranking dihitung otomatis tanpa tombol hitung manual.
      </p>
    </div>
    <span class="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-[11px] font-bold w-fit">
      <RefreshCw class="w-3.5 h-3.5" />
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
    <!-- Pemilihan Kelas & Anak -->
    <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
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

        <div>
          <label for="pilih-anak" class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Pilih Anak yang Dinilai</label>
          <select
            id="pilih-anak"
            bind:value={selectedAnakId}
            disabled={anakList.length === 0}
            class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            {#each anakList as anak (anak.id)}
              <option value={anak.id}>{anak.nama}{anak.nis ? ` — ${anak.nis}` : ''}</option>
            {/each}
          </select>
        </div>
      </div>
      <p class="text-[11px] text-slate-400 font-medium leading-relaxed">
        Jawaban tersimpan otomatis setiap kali dipilih. Nilai Yi dan ranking seluruh anak pada kelas ini ikut diperbarui.
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
        <UserRound class="w-10 h-10 text-slate-300 mx-auto mb-3" />
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
      <!-- Peringatan data master -->
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

      {#if opsiList.length === 0}
        <div class="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex items-start gap-2.5 flex-1">
            <AlertCircle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p class="text-xs font-medium text-amber-800">Master opsi jawaban masih kosong. Tambahkan opsi terlebih dahulu.</p>
          </div>
          <a href="/indikator" class="inline-flex items-center px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition w-fit whitespace-nowrap">
            Buka Opsi Jawaban
            <ArrowRight class="w-3.5 h-3.5 ml-1" />
          </a>
        </div>
      {/if}

      <!-- Form Penilaian -->
      <section class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <ClipboardList class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-900 tracking-tight">Form Penilaian</h2>
              <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                {anakTerpilih
                  ? `${anakTerpilih.nama} • ${anakTerpilih.nis ? `NIS ${anakTerpilih.nis}` : 'NIS belum diisi'}`
                  : 'Pilih anak yang akan dinilai.'}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap">
              Terjawab {terjawabAnak}/{indikatorList.length}
            </span>
            {#if indikatorList.length > 0 && terjawabAnak === indikatorList.length}
              <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg whitespace-nowrap">
                <CheckCircle2 class="w-3.5 h-3.5" /> Lengkap
              </span>
            {:else}
              <span class="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-lg whitespace-nowrap">
                <AlertCircle class="w-3.5 h-3.5" /> Belum lengkap
              </span>
            {/if}
          </div>
        </div>

        <div class="p-5 md:p-6 space-y-6">
          {#if kriteriaList.length === 0}
            <p class="text-sm text-slate-500">Belum ada kriteria penilaian.</p>
          {:else}
            {#each indikatorPerKriteria as kriteria, kriteriaIndex (kriteria.id)}
              <div class="space-y-3">
                <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                    {kriteria.inisial}
                  </span>
                  <h3 class="text-sm font-bold text-slate-900">{kriteria.nama}</h3>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border {kriteria.jenis === 'benefit' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}">
                    {kriteria.jenis}
                  </span>
                  <span class="ml-auto text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                    Bobot {bobot[kriteriaIndex] !== undefined ? bobot[kriteriaIndex].toFixed(3) : '—'}
                  </span>
                </div>

                {#if kriteria.indikator.length === 0}
                  <p class="text-xs text-slate-400 font-medium">Belum ada indikator pada kriteria ini.</p>
                {:else}
                  {#each kriteria.indikator as indikator, indikatorIndex (indikator.id)}
                    <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5 space-y-3 transition hover:bg-white">
                      <div class="space-y-1">
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                            Indikator #{indikatorIndex + 1} — {kriteria.inisial}
                          </span>
                          {#if jawabanAnakMap[indikator.id]}
                            <span class="inline-flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <CheckCircle2 class="w-3 h-3" /> Tersimpan
                            </span>
                          {/if}
                        </div>
                        <p class="text-sm font-medium text-slate-900 leading-relaxed">
                          {indikator.pertanyaan}
                        </p>
                      </div>

                      <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                        {#each opsiList as opsi (opsi.id)}
                          <button
                            on:click={() => pilihJawaban(indikator, opsi)}
                            disabled={menyimpan === indikator.id}
                            title={opsi.keterangan || ''}
                            class="px-3 py-2 rounded-lg border text-xs font-bold text-left transition disabled:opacity-60 {jawabanAnakMap[indikator.id]?.opsi_jawaban_id === opsi.id
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700'}"
                          >
                            Poin {opsi.poin}: {opsi.opsi}
                          </button>
                        {/each}
                        {#if menyimpan === indikator.id}
                          <Loader2 class="w-4 h-4 text-blue-600 animate-spin" />
                        {/if}
                      </div>
                    </div>
                  {/each}
                {/if}
              </div>
            {/each}
          {/if}
        </div>

        <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
          <p class="text-[11px] text-slate-500 font-medium leading-relaxed">
            Jawaban disimpan otomatis setiap kali dipilih. Perubahan jawaban atau penambahan anak memicu perhitungan ulang MOORA untuk seluruh anak di kelas ini.
          </p>
        </div>
      </section>

      <!-- Hasil MOORA -->
      <section class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Trophy class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-900 tracking-tight">Hasil Perhitungan MOORA</h2>
              <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                Nilai Yi dibulatkan 3 angka di belakang koma. Ranking diurutkan dari Yi terbesar.
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
              <table class="w-full text-left border-collapse" style={`min-width: ${560 + kriteriaList.length * 80}px`}>
                <thead>
                  <tr class="bg-slate-50/50">
                    <th class="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-16">No.</th>
                    <th class="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-32">NIS</th>
                    <th class="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nama Anak</th>
                    {#each kriteriaList as kriteria (kriteria.id)}
                      <th class="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">{kriteria.inisial}</th>
                    {/each}
                    <th class="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Nilai Yi</th>
                    <th class="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Ranking</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  {#each hasil.baris as baris, index (baris.anak_id)}
                    <tr class="transition {baris.anak_id === selectedAnakId ? 'bg-blue-50/60' : 'hover:bg-slate-50/30'}">
                      <td class="px-4 py-4 text-sm font-bold text-slate-500">{index + 1}</td>
                      <td class="px-4 py-4">
                        {#if baris.nis}
                          <span class="text-sm font-semibold text-slate-700">{baris.nis}</span>
                        {:else}
                          <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                            Belum diisi
                          </span>
                        {/if}
                      </td>
                      <td class="px-4 py-4 text-sm font-bold text-slate-800">{baris.nama}</td>
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
