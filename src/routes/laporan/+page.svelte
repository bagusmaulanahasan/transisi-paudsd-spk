<script>
  import { hitungBobotAhp, susunMatriksPerbandingan, getAHPDetail } from '$lib/spk/ahp';
  import { hitungMoora, getMooraDetail } from '$lib/spk/moora';
  import { fetchMasterData } from '$lib/services/masterData';
  import { fetchKelasPenilaian } from '$lib/services/penilaian';
  import { peekMemoryCache } from '$lib/db/cache';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import DetailAHP from './DetailAHP.svelte';
  import DetailMoora from './DetailMoora.svelte';
  import {
    FileText,
    Loader2,
    School,
    Users,
    CheckCircle2,
    AlertCircle,
    Printer,
    ArrowLeft
  } from 'lucide-svelte';

  const kelasAwal = peekMemoryCache('master:kelas');
  const kriteriaAwal = peekMemoryCache('master:kriteria');
  const indikatorAwal = peekMemoryCache('master:indikator');
  const ahpAwal = peekMemoryCache('master:ahp');

  let kelasList = kelasAwal || [];
  let kriteriaList = kriteriaAwal || [];
  let indikatorList = indikatorAwal || [];
  let perbandinganList = ahpAwal || [];

  let selectedKelasId = pilihKelas(kelasAwal || []);

  const kelasDataAwal = selectedKelasId
    ? peekMemoryCache('penilaian:kelas:' + selectedKelasId)
    : null;

  let anakList = kelasDataAwal?.anak ?? [];
  let jawabanList = kelasDataAwal?.jawaban ?? [];

  let loadingMaster = !(kelasAwal && kriteriaAwal && indikatorAwal && ahpAwal);
  let loadingKelas = selectedKelasId !== null && kelasDataAwal === null;
  let bobot = [];
  let ahpSiap = false;
  let pesanAhp = '';
  let hasil = { baris: [], jumlahLengkap: 0, jumlahAnak: 0 };

  // Detail Perhitungan State
  let ahpDetail = null;
  let mooraDetail = null;

  if (kelasDataAwal && !loadingMaster) hitungUlang();

  onMount(async () => {
    await fetchMaster();
    loadingMaster = false;
  });

  function pilihKelas(daftarKelas) {
    const kelasDariUrl = Number($page.url.searchParams.get('kelas'));
    const adaDiUrl = daftarKelas.some((kelas) => kelas.id === kelasDariUrl);
    return adaDiUrl ? kelasDariUrl : daftarKelas[0]?.id ?? null;
  }

  async function fetchMaster() {
    const master = await fetchMasterData();

    kelasList = master.kelas;
    kriteriaList = master.kriteria;
    indikatorList = master.indikator;
    perbandinganList = master.perbandingan;

    if (kelasList.length > 0) {
      if (!selectedKelasId) selectedKelasId = pilihKelas(kelasList);
      await fetchKelasData();
    }
  }

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

    const data = await fetchKelasPenilaian(selectedKelasId);

    anakList = data?.anak || [];
    jawabanList = data?.jawaban || [];
    loadingKelas = false;
    hitungUlang();
  }

  function hitungUlang() {
    const matrix = susunMatriksPerbandingan(kriteriaList, perbandinganList);
    const hasilAhp = hitungBobotAhp(kriteriaList, perbandinganList);
    
    bobot = hasilAhp.bobot;
    ahpSiap = hasilAhp.ahpSiap;
    pesanAhp = hasilAhp.pesan;

    // Hitung rincian untuk transparansi
    ahpDetail = getAHPDetail(matrix);
    
    mooraDetail = getMooraDetail({
      anakList,
      kriteriaList,
      indikatorList,
      jawabanList,
      bobot,
      ahpSiap
    });

    hasil = hitungMoora({
      anakList,
      kriteriaList,
      indikatorList,
      jawabanList,
      bobot,
      ahpSiap
    });
  }

  function cetakLaporan() {
    window.print();
  }
</script>


<svelte:head>
  <title>Laporan Perhitungan - SPK Transisi PAUD-SD</title>
</svelte:head>

<div class="space-y-8 print:space-y-4">
  <!-- Header Layar (disembunyikan saat cetak) -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Laporan Perhitungan SPK</h1>
      <p class="text-slate-500 text-sm mt-1">
        Laporan transparan read-only menampilkan seluruh tahapan AHP hingga perankingan MOORA.
      </p>
    </div>
    <div class="flex items-center gap-2">
      <button
        on:click={cetakLaporan}
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
      >
        <Printer class="w-4 h-4" />
        <span>Cetak Laporan</span>
      </button>
    </div>
  </div>

  <!-- Pemilih Kelas -->
  <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 print:p-0 print:border-none print:shadow-none">
    <label for="pilih-kelas-laporan" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
      PILIH KELAS
    </label>
    <select
      id="pilih-kelas-laporan"
      bind:value={selectedKelasId}
      on:change={fetchKelasData}
      class="w-full md:w-80 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none print:hidden"
    >
      {#each kelasList as item}
        <option value={item.id}>{item.nama_kelas} — {item.tahun_ajaran}</option>
      {/each}
    </select>
  </div>

  {#if loadingMaster || loadingKelas}
    <div class="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm print:hidden">
      <div class="flex flex-col items-center space-y-3">
        <Loader2 class="w-8 h-8 text-blue-600 animate-spin" />
        <p class="text-slate-500 text-sm font-medium">Memuat data laporan...</p>
      </div>
    </div>
  {:else if kelasList.length === 0}
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
      <School class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p class="text-base font-bold text-slate-800">Belum ada kelas</p>
      <p class="text-xs text-slate-500 mt-1">Tambahkan kelas terlebih dahulu untuk melihat laporan.</p>
    </div>
  {:else}
    <!-- TAHAP 1: BOBOT AHP -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 print:border-slate-300">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 class="text-base font-bold text-slate-900">Tahap 1: Bobot Prioritas Kriteria (AHP)</h2>
        <span class={`px-2.5 py-1 rounded-full text-xs font-semibold ${ahpSiap ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
          {ahpSiap ? 'Konsisten (CR ≤ 0.10)' : 'Perlu Diperbaiki'}
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th class="p-3">Inisial</th>
              <th class="p-3">Nama Kriteria</th>
              <th class="p-3">Jenis MOORA</th>
              <th class="p-3">Bobot Prioritas</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            {#each kriteriaList as item, i}
              <tr>
                <td class="p-3 font-bold text-blue-600">C{item.urutan || i + 1}</td>
                <td class="p-3 font-medium">{item.nama_kriteria}</td>
                <td class="p-3 font-semibold uppercase text-slate-500">{item.jenis}</td>
                <td class="p-3 font-bold text-slate-900">{(bobot[i] ?? 0).toFixed(3)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAHAP 2: MATRIKS KEPUSATAN -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 print:border-slate-300">
      <h2 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
        Tahap 2: Matriks Keputusan (X) — Total Poin per Kriteria
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th class="p-3">No.</th>
              <th class="p-3">Nama Anak</th>
              {#each kriteriaList as k, i}
                <th class="p-3">C{k.urutan || i + 1}</th>
              {/each}
              <th class="p-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            {#each hasil.baris as baris, idx}
              <tr>
                <td class="p-3">{idx + 1}</td>
                <td class="p-3 font-bold">{baris.nama}</td>
                {#each baris.nilai as val}
                  <td class="p-3 font-medium">{val}</td>
                {/each}
                <td class="p-3 font-semibold">
                  {#if baris.lengkap}
                    <span class="text-emerald-600">Lengkap</span>
                  {:else}
                    <span class="text-amber-600">Belum Lengkap ({baris.terjawab}/{baris.total})</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAHAP 3: HASIL MOORA & RANKING -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 print:border-slate-300">
      <h2 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
        Tahap 3: Hasil Akhir MOORA & Ranking Prioritas Stimulasi
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th class="p-3">No.</th>
              <th class="p-3">Nama Anak</th>
              <th class="p-3">Nilai Optimasi (Yᵢ)</th>
              <th class="p-3">Ranking</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            {#each hasil.baris as baris, idx}
              <tr class={baris.ranking === 1 ? 'bg-blue-50/50 font-bold' : ''}>
                <td class="p-3">{idx + 1}</td>
                <td class="p-3 font-bold">{baris.nama}</td>
                <td class="p-3 font-bold text-slate-900">
                  {baris.yi !== null ? baris.yi.toFixed(3) : '—'}
                </td>
                <td class="p-3">
                  {#if baris.ranking !== null}
                    <span class={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${baris.ranking === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      {baris.ranking}
                    </span>
                  {:else}
                    <span class="text-slate-400">—</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- DETAIL PERHITUNGAN -->
    <div class="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-6">
      <div class="flex items-center gap-3">
        <div class="p-3 bg-white rounded-xl border border-slate-200">
          <FileText class="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 class="text-xl font-extrabold text-slate-900">Detail Perhitungan</h2>
          <p class="text-sm text-slate-500 font-medium">Transparansi langkah perhitungan AHP & MOORA.</p>
        </div>
      </div>
      
      <DetailAHP {kriteriaList} {perbandinganList} ahpDetail={ahpDetail} />
      <DetailMoora {kriteriaList} mooraDetail={mooraDetail} bobot={bobot} />
    </div>
  {/if}
</div>
