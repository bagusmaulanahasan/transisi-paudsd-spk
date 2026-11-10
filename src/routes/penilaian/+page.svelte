<script>
  import { supabase } from '$lib/db/supabase';
  import { hitungBobotAhp } from '$lib/spk/ahp';
  import { hitungMoora, susunMatriksKeputusan } from '$lib/spk/moora';
  import { simpanHasilPerhitungan } from '$lib/services/hasil';
  import { fetchMasterData } from '$lib/services/masterData';
  import { fetchKelasPenilaian } from '$lib/services/penilaian';
  import { peekMemoryCache, cachedFetch } from '$lib/db/cache';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { Loader2, Users, School, AlertCircle, ArrowRight, Trophy } from 'lucide-svelte';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import LoadingState from '$lib/components/ui/LoadingState.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import { online } from '$lib/stores/koneksi';
  import PenilaianFilterCard from './PenilaianFilterCard.svelte';
  import MooraResultCard from './MooraResultCard.svelte';

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
  let prefetchBerjalan = false;

  // Hitung hasil lebih awal dari cache agar angka langsung tampil tanpa loading.
  if (kelasDataAwal && !loadingMaster) hitungUlang();

  onMount(async () => {
    await fetchMaster();
    loadingMaster = false;

    // Siapkan cache offline untuk semua kelas dan anak (tanpa menahan render).
    prefetchOffline();
  });

  // Saat koneksi kembali: siapkan cache dan hitung ulang peringkat.
  onMount(() => {
    const saatOnline = () => {
      prefetchOffline();
      hitungUlang();
    };

    window.addEventListener('online', saatOnline);
    return () => window.removeEventListener('online', saatOnline);
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
    const master = await fetchMasterData();

    kelasList = master.kelas;
    kriteriaList = master.kriteria;
    indikatorList = master.indikator;
    perbandinganList = master.perbandingan;

    if (kelasList.length > 0) {
      // Pilihan dari URL dipertahankan agar tidak reset saat kembali dari halaman penilaian anak.
      if (!selectedKelasId) selectedKelasId = pilihKelas(kelasList);
      await fetchKelasData();
    }
  }

  /**
   * Menyiapkan cache offline untuk semua kelas, daftar anak, dan detail tiap anak.
   * Detail memakai key yang sama dengan halaman /penilaian/[anakId] agar halaman itu
   * bisa dibuka saat offline setelah pernah dimuat online.
   */
  async function prefetchOffline() {
    if (!navigator.onLine || prefetchBerjalan) return;

    prefetchBerjalan = true;
    try {
      const opsiList = await cachedFetch('master:opsi', () =>
        supabase.from('opsi_jawaban').select('*').order('poin', { ascending: true })
      );

      for (const kelas of kelasList) {
        const dataKelas = await fetchKelasPenilaian(kelas.id);
        if (!dataKelas) continue;

        for (const anak of dataKelas.anak) {
          const detail = {
            anak,
            kelas,
            kriteria: kriteriaList,
            indikator: indikatorList,
            opsi: opsiList || [],
            perbandingan: perbandinganList,
            anakList: dataKelas.anak,
            jawaban: dataKelas.jawaban
          };

          await cachedFetch('penilaian:detail:' + anak.id, async () => detail);
        }
      }
    } catch (error) {
      console.warn('Gagal menyiapkan cache offline penilaian:', error);
    } finally {
      prefetchBerjalan = false;
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

    const data = await fetchKelasPenilaian(selectedKelasId);

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

    // Saat offline: susun baris untuk ditampilkan, tetapi jangan hitung Yi/ranking
    // dan jangan menulis ke hasil_perhitungan.
    if (!navigator.onLine) {
      const baris = susunMatriksKeputusan(anakList, kriteriaList, indikatorList, jawabanList)
        .map((item) => ({ ...item, yi: null, ranking: null }));

      hasil = {
        baris,
        jumlahLengkap: baris.filter((item) => item.lengkap).length,
        jumlahAnak: baris.length
      };
      statusSimpanHasil = '';
      return;
    }

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
    // Saat offline, hasil peringkat tidak boleh ditulis ke server.
    if (!navigator.onLine) return;

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
  <PageHeader
    title="Penilaian Anak & Perankingan MOORA"
    subtitle="Pilih kelas, lalu klik Lihat pada baris anak untuk membuka penilaian. Tampilan awal hanya baca."
  >
    <svelte:fragment slot="action">
      <span class="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-[11px] font-bold w-fit">
        <Trophy class="w-3.5 h-3.5" />
        Perhitungan otomatis
      </span>
    </svelte:fragment>
  </PageHeader>

  {#if loadingMaster}
    <LoadingState text="Menyiapkan data penilaian..." />
  {:else if kelasList.length === 0}
    <EmptyState
      title="Belum ada kelas"
      description="Tambahkan kelas dan data anak terlebih dahulu sebelum melakukan penilaian."
      icon={School}
    >
      <svelte:fragment slot="action">
        <a
          href="/kelas"
          class="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-200"
        >
          <span>Buka Kelola Kelas</span>
          <ArrowRight class="w-4 h-4 ml-1.5" />
        </a>
      </svelte:fragment>
    </EmptyState>
  {:else}
    <!-- Pemilihan Kelas -->
    <PenilaianFilterCard
      {kelasList}
      bind:selectedKelasId
      onGantiKelas={gantiKelas}
    />

    {#if loadingKelas}
      <LoadingState text="Memuat data kelas..." />
    {:else if anakList.length === 0}
      <EmptyState
        title="Belum ada anak pada kelas ini"
        description="Tambahkan data anak terlebih dahulu, lalu kembali ke halaman penilaian."
        icon={Users}
      >
        <svelte:fragment slot="action">
          <a
            href={`/kelas/${selectedKelasId}`}
            class="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-200"
          >
            <Users class="w-4 h-4 mr-1.5" />
            <span>Kelola Anak Kelas Ini</span>
          </a>
        </svelte:fragment>
      </EmptyState>
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

      <!-- Peringatan peringkat saat offline -->
      {#if !$online}
        <div class="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-[11px] font-medium text-amber-800 leading-relaxed flex items-start gap-2">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <p>Peringkat memerlukan koneksi internet.</p>
        </div>
      {/if}

      <!-- Tabel Hasil MOORA -->
      <MooraResultCard
        {kriteriaList}
        {bobot}
        {hasil}
        ahpSiap={ahpSiap && $online}
        {selectedKelasId}
        {waktuPerhitungan}
        {statusSimpanHasil}
      />
    {/if}
  {/if}
</div>
