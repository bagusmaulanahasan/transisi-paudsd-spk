<script>
  import { formatAngka } from '$lib/utils/angka';

  export let kriteriaList = [];
  export let bobot = [];
  export let ahpSiap = false;
</script>

<!-- BOBOT AHP -->
<div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 print:border-slate-300 print:shadow-none">
  <div class="flex items-center justify-between border-b border-slate-100 pb-3 print:border-slate-300">
    <h2 class="text-lg font-bold text-slate-900 tracking-tight">Kriteria Penilaian dan Bobot Prioritas</h2>
    <span class={`px-2.5 py-1 rounded-full text-xs font-semibold print:bg-white print:border-slate-300 ${ahpSiap ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
      {ahpSiap ? 'Konsisten (CR ≤ 0,1000)' : 'Perlu Diperbaiki'}
    </span>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full text-left text-xs border-collapse">
      <thead class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider print:bg-slate-100 print:border-b print:border-slate-300">
        <tr>
          <th class="p-3 print:border print:border-slate-300">Inisial</th>
          <th class="p-3 print:border print:border-slate-300">Nama Kriteria</th>
          <th class="p-3 print:border print:border-slate-300">Jenis MOORA</th>
          <th class="p-3 print:border print:border-slate-300">Bobot Prioritas</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 text-slate-700">
        {#each kriteriaList as item, i}
          <tr class="print:break-inside-avoid">
            <td class="p-3 font-bold print:border print:border-slate-300">C{item.urutan || i + 1}</td>
            <td class="p-3 font-medium print:border print:border-slate-300">{item.nama}</td>
            <td class="p-3 font-semibold uppercase text-slate-500 print:border print:border-slate-300">{item.jenis}</td>
            <td class="p-3 font-bold text-slate-900 print:border print:border-slate-300">{formatAngka(bobot[i] ?? 0, 4)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
