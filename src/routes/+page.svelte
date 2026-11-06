<script>
  import { 
    LayoutDashboard, 
    Users, 
    Scale, 
    TrendingUp, 
    ArrowRight,
    CheckCircle2,
    Clock
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

<div class="space-y-8">
  <!-- Header Section -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Utama</h1>
      <p class="text-slate-500 mt-1">Selamat datang kembali di panel kendali SPK TK Islam Kencana.</p>
    </div>
    <div class="flex items-center space-x-2">
      <span class="text-xs font-medium text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
        TA 2025/2026
      </span>
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each stats as stat}
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition hover:shadow-md">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">{stat.label}</p>
            <h3 class="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </div>
          <div class={`p-3 rounded-xl ${stat.bg}`}>
            <svelte:component this={stat.icon} class={`w-6 h-6 ${stat.color}`} />
          </div>
        </div>
        <div class="mt-4 flex items-center text-xs text-slate-400 font-medium">
          <TrendingUp class="w-3 h-3 mr-1 text-emerald-500" />
          <span>Data terhitung sistem secara real-time</span>
        </div>
      </div>
    {/each}
  </div>

  <!-- Table Section -->
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="p-6 border-b border-slate-100 flex items-center justify-between">
      <h2 class="text-lg font-bold text-slate-900 tracking-tight">Daftar Kelas & Status Perhitungan MOORA</h2>
      <button class="text-xs font-semibold text-blue-600 hover:text-blue-700 transition flex items-center space-x-1">
        <span>Lihat Semua Kelas</span>
        <ArrowRight class="w-3 h-3" />
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50/50">
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16">No.</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Kelas</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun Ajaran</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah Anak</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status Penilaian</th>
            <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each kelasList as kelas, i}
            <tr class="hover:bg-slate-50/50 transition">
              <td class="px-6 py-4 text-sm text-slate-400 font-medium">{i + 1}</td>
              <td class="px-6 py-4 text-sm font-bold text-slate-800">{kelas.nama}</td>
              <td class="px-6 py-4 text-sm text-slate-600">{kelas.tahun}</td>
              <td class="px-6 py-4 text-sm text-slate-600">{kelas.jumlah}</td>
              <td class="px-6 py-4">
                <span class={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${kelas.statusColor}`}>
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
                  <button class="px-4 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition shadow-sm">
                    📊 Lihat Laporan
                  </button>
                {:else}
                  <button class="px-4 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-bold transition shadow-md shadow-blue-200">
                    ⚡ Lakukan Penilaian
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
