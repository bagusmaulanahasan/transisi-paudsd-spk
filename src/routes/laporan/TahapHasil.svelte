<script>
  export let hasil = { baris: [] };
</script>

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
