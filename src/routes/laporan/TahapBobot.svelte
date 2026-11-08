<script>
  export let kriteriaList = [];
  export let bobot = [];
  export let ahpSiap = false;
</script>

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
            <td class="p-3 font-medium">{item.nama}</td>
            <td class="p-3 font-semibold uppercase text-slate-500">{item.jenis}</td>
            <td class="p-3 font-bold text-slate-900">{(bobot[i] ?? 0).toFixed(3)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
