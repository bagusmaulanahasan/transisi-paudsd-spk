<script>
  import { 
    LayoutDashboard, 
    Users, 
    Scale, 
    TrendingUp, 
    ArrowRight,
    CheckCircle2,
    Clock,
    Plus
  } from 'lucide-svelte';

  /** @type {import('./$types').PageData} */
  export let data;

  // Data dummy untuk tampilan dashboard (nanti akan diambil dari Supabase)
  const stats = [
    { label: 'Total Kelas Aktif', value: '4 Kelas', icon: LayoutDashboard, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Anak Dinilai', value: '112 Anak', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Status Konsistensi AHP', value: 'Konsisten (CR 0.04)', icon: Scale, color: 'text-amber-600', bg: 'bg-amber-50' }
  ];

  const kelasList = [
    { id: 1, nama: 'Kelompok B1 (Melati)', tahun: '2025/2026', jumlah: '28 Anak', status: 'Sudah Dinilai', statusColor: 'bg-emerald-100 text-emerald-800' },
    { id: 2, nama: 'Kelompok B2 (Mawar)', tahun: '2025/2026', jumlah: '26 Anak', status: 'Sudah Dinilai', statusColor: 'bg-emerald-100 text-emerald-800' },
    { id: 3, nama: 'Kelompok A1 (Anggrek)', tahun: '2025/2026', jumlah: '30 Anak', status: 'Belum Dinilai', statusColor: 'bg-amber-100 text-amber-800' },
    { id: 4, nama: 'Kelompok A2 (Kamboja)', tahun: '2025/2026', jumlah: '28 Anak', status: 'Belum Dinilai', statusColor: 'bg-amber-100 text-amber-800' }
  ];
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
      <button class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-200">
        <Plus class="w-4 h-4 mr-1.5" />
        <span>Tambah Kelas</span>
      </button>
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
    {#each stats as stat}
      <div class="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm transition hover:shadow-md">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <h3 class="text-2xl font-extrabold text-slate-900 mt-1">{stat.value}</h3>
          </div>
          <div class={`p-3 rounded-xl ${stat.bg}`}>
            <svelte:component this={stat.icon} class={`w-6 h-6 ${stat.color}`} />
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-slate-50 flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <TrendingUp class="w-3 h-3 mr-1.5 text-emerald-500" />
          <span>Real-time Sync</span>
        </div>
      </div>
    {/each}
  </div>

  <!-- Table Section -->
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
    <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-bold text-slate-900 tracking-tight">Daftar Kelas & Status MOORA</h2>
        <p class="text-xs text-slate-500 mt-0.5">Pantau progres penilaian transisi PAUD ke SD per kelas.</p>
      </div>
      <button class="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 w-fit">
        <span>Kelola Semua</span>
        <ArrowRight class="w-3.5 h-3.5" />
      </button>
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
                  <button class="px-4 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-100 rounded-xl text-[11px] font-bold transition shadow-sm">
                    Lihat Laporan
                  </button>
                {:else}
                  <button class="px-4 py-1.5 bg-slate-900 text-white hover:bg-blue-600 rounded-xl text-[11px] font-bold transition shadow-sm">
                    Mulai Penilaian
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
