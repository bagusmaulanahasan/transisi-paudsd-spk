<script>
  import { supabase } from '$lib/db/supabase';
  import { hitungBobotAhp } from '$lib/spk/ahp';
  import { cachedFetch, peekMemoryCache } from '$lib/db/cache';
  import { onMount } from 'svelte';
  import { 
    LayoutDashboard, 
    Users, 
    Scale, 
    TrendingUp, 
    ArrowRight,
    CheckCircle2,
    Clock,
    Plus,
    Loader2
  } from 'lucide-svelte';

  const CACHE_DASHBOARD = 'dashboard';

  // Data dari memori cache langsung dipakai agar halaman tampil tanpa loading saat dibuka ulang.
  const dataAwal = peekMemoryCache(CACHE_DASHBOARD);

  let loading = dataAwal === null;
  let totalKelas = 0;
  let totalAnak = 0;
  let statusAhp = 'Memuat...';
  let ahpWarna = 'text-slate-600 bg-slate-50';
  let kelasList = [];
  let userRole = null;

  if (dataAwal) terapkanDashboard(dataAwal);

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const dataProfil = await cachedFetch(
        'user_profile_' + session.user.id,
        () => supabase.from('profiles').select('nama_lengkap, email, role').eq('id', session.user.id).single(),
        (p) => { if (p) userRole = p.role; }
      );
      if (dataProfil) userRole = dataProfil.role;
    }

    const data = await cachedFetch(CACHE_DASHBOARD, ambilDashboard, terapkanDashboard);
    if (data) terapkanDashboard(data);
    loading = false;
  });

  /**
   * Mengambil seluruh data yang dibutuhkan dashboard dalam satu permintaan paralel.
   */
  async function ambilDashboard() {
    const [kelasRes, anakRes, kriteriaRes, ahpRes, hasilRes] = await Promise.all([
      supabase.from('kelas').select('*').order('nama_kelas', { ascending: true }),
      supabase.from('anak').select('id, kelas_id'),
      supabase.from('kriteria').select('*').order('urutan', { ascending: true }),
      supabase.from('perbandingan_ahp').select('*'),
      supabase.from('hasil_perhitungan').select('kelas_id')
    ]);

    if (kelasRes.error) throw kelasRes.error;
    if (anakRes.error) throw anakRes.error;
    if (kriteriaRes.error) throw kriteriaRes.error;
    if (ahpRes.error) throw ahpRes.error;
    if (hasilRes.error) throw hasilRes.error;

    return {
      kelas: kelasRes.data || [],
      anak: anakRes.data || [],
      kriteria: kriteriaRes.data || [],
      ahp: ahpRes.data || [],
      hasil: hasilRes.data || []
    };
  }

  /**
   * Mengolah data mentah menjadi angka statistik dan daftar kelas siap tampil.
   * @param {Object} data - Hasil dari ambilDashboard().
   */
  function terapkanDashboard(data) {
    totalKelas = data.kelas.length;
    totalAnak = data.anak.length;

    const ahpCheck = hitungBobotAhp(data.kriteria, data.ahp);
    if (ahpCheck.ahpSiap) {
      statusAhp = 'Konsisten (CR ≤ 0.10)';
      ahpWarna = 'text-emerald-600 bg-emerald-50';
    } else {
      statusAhp = 'Belum / Perlu Diperbaiki';
      ahpWarna = 'text-amber-600 bg-amber-50';
    }

    const kelasSudahDinilai = new Set(data.hasil.map((baris) => baris.kelas_id));

    kelasList = data.kelas.map((kelas) => {
      const jumlahAnak = data.anak.filter((anak) => anak.kelas_id === kelas.id).length;
      const sudahDinilai = kelasSudahDinilai.has(kelas.id);

      return {
        id: kelas.id,
        nama: kelas.nama_kelas,
        tahun: kelas.tahun_ajaran,
        jumlah: `${jumlahAnak} Anak`,
        status: sudahDinilai ? 'Sudah Dinilai' : 'Belum Dinilai',
        statusColor: sudahDinilai ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
      };
    });
  }
</script>

<svelte:head>
  <title>Dashboard - SPK Transisi PAUD-SD</title>
</svelte:head>

<div class="space-y-6 md:space-y-8">
  <!-- Header Section -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard Utama</h1>
      <p class="text-sm text-slate-500 mt-1 font-medium">Panel kendali sistem penunjang keputusan TK Islam Kencana.</p>
    </div>
    <div class="flex items-center space-x-3">
      <a href="/kelas" class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-200">
        <Plus class="w-4 h-4 mr-1.5" />
        <span>Kelola Kelas & Anak</span>
      </a>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div class="flex flex-col items-center space-y-3">
        <Loader2 class="w-8 h-8 text-blue-600 animate-spin" />
        <p class="text-slate-500 text-sm font-medium">Memuat ringkasan dashboard...</p>
      </div>
    </div>
  {:else}
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      <div class="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm transition hover:shadow-md">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Kelas Aktif</p>
            <h3 class="text-2xl font-extrabold text-slate-900 mt-1">{totalKelas} Kelas</h3>
          </div>
          <div class="p-3 rounded-xl bg-blue-50">
            <LayoutDashboard class="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <!-- <div class="mt-4 pt-4 border-t border-slate-50 flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <TrendingUp class="w-3 h-3 mr-1.5 text-emerald-500" />
        </div> -->
      </div>

      <div class="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm transition hover:shadow-md">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Data Anak</p>
            <h3 class="text-2xl font-extrabold text-slate-900 mt-1">{totalAnak} Anak</h3>
          </div>
          <div class="p-3 rounded-xl bg-emerald-50">
            <Users class="w-6 h-6 text-emerald-600" />
          </div>
        </div>
        <!-- <div class="mt-4 pt-4 border-t border-slate-50 flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <TrendingUp class="w-3 h-3 mr-1.5 text-emerald-500" />
        </div> -->
      </div>

      <div class="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm transition hover:shadow-md">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Konsistensi AHP</p>
            <h3 class="text-base font-extrabold text-slate-900 mt-1">{statusAhp}</h3>
          </div>
          <div class={`p-3 rounded-xl ${ahpWarna}`}>
            <Scale class="w-6 h-6" />
          </div>
        </div>
        <!-- <div class="mt-4 pt-4 border-t border-slate-50 flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <TrendingUp class="w-3 h-3 mr-1.5 text-emerald-500" />
        </div> -->
      </div>
    </div>

    <!-- Table Section -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold text-slate-900 tracking-tight">Daftar Kelas & Status MOORA</h2>
          <p class="text-xs text-slate-500 mt-0.5">Pantau progres penilaian transisi PAUD ke SD per kelas.</p>
        </div>
        <a href="/penilaian" class="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 w-fit">
          <span>Buka Penilaian</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </a>
      </div>

      <div class="overflow-x-auto overflow-y-hidden">
        <table class="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr class="bg-slate-50/50">
              <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-16">No.</th>
              <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nama Kelas</th>
              <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tahun Ajaran</th>
              <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Jumlah Anak</th>
              <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status Penilaian</th>
              <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#if kelasList.length === 0}
              <tr>
                <td colspan="6" class="px-6 py-8 text-center text-xs text-slate-400 font-medium">
                  Belum ada data kelas tersimpan di database.
                </td>
              </tr>
            {:else}
              {#each kelasList as kelas, i}
                <tr class="hover:bg-slate-50/30 transition group">
                  <td class="px-6 py-4 text-sm text-slate-400 font-bold">{i + 1}</td>
                  <td class="px-6 py-4">
                    <span class="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition truncate block max-w-xs">{kelas.nama}</span>
                  </td>
                  <td class="px-6 py-4 text-sm text-slate-500 font-medium">{kelas.tahun}</td>
                  <td class="px-6 py-4 text-sm text-slate-600 font-semibold text-center">{kelas.jumlah}</td>
                  <td class="px-6 py-4">
                    <span class={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${kelas.statusColor}`}>
                      {#if kelas.status === 'Sudah Dinilai'}
                        <CheckCircle2 class="w-3 h-3 mr-1.5" />
                      {:else}
                        <Clock class="w-3 h-3 mr-1.5" />
                      {/if}
                      {kelas.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    {#if kelas.status === 'Sudah Dinilai'}
                      <a href={`/laporan?kelas=${kelas.id}`} class="inline-flex px-4 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-100 rounded-xl text-[11px] font-bold transition shadow-sm">
                        Lihat Laporan
                      </a>
                    {:else if userRole === 'tim_pendidik'}
                      <a href={`/penilaian?kelas=${kelas.id}`} class="inline-flex px-4 py-1.5 bg-slate-900 text-white hover:bg-blue-600 rounded-xl text-[11px] font-bold transition shadow-sm">
                        Mulai Penilaian
                      </a>
                    {/if}
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
