<script>
  export let kriteriaList = [];
  export let hasil = { baris: [] };
</script>

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
