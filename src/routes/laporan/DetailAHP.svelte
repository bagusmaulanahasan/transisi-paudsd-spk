<script>
  import { 
    ChevronDown, 
    ChevronUp, 
    CheckCircle2, 
    AlertCircle
  } from 'lucide-svelte';

  export let kriteriaList = [];
  export let perbandinganList = [];
  export let ahpDetail = null;

  // RI (Random Index) Table
  const riTable = [
    { n: 1, ri: 0.00 }, { n: 2, ri: 0.00 }, { n: 3, ri: 0.58 },
    { n: 4, ri: 0.90 }, { n: 5, ri: 1.12 }, { n: 6, ri: 1.24 },
    { n: 7, ri: 1.32 }, { n: 8, ri: 1.41 }, { n: 9, ri: 1.45 },
    { n: 10, ri: 1.49 }
  ];

  let openSteps = {
    A1: false,
    A2: false,
    A3: false,
    A4: false
  };

  function toggleStep(step) {
    openSteps[step] = !openSteps[step];
  }

  // Fungsi pembantu untuk mengambil nilai matriks berpasangan i, j
  function getPairwiseValue(kiId, kjId) {
    if (kiId === kjId) return 1.0;
    const match = perbandinganList.find(p => p.kriteria_1_id === kiId && p.kriteria_2_id === kjId);
    return match ? parseFloat(match.nilai) : 1.0;
  }
</script>

<div class="space-y-4">
  <div class="border-b border-slate-100 pb-2">
    <h3 class="text-base font-bold text-slate-900">Bagian A: Detail Perhitungan AHP (Global)</h3>
    <p class="text-[11px] text-slate-500 italic">Menentukan bobot prioritas kriteria yang berlaku untuk seluruh kelas.</p>
  </div>

  {#if kriteriaList.length === 0}
    <p class="text-xs text-slate-500 italic">Belum ada data kriteria untuk dihitung.</p>
  {:else}

  <!-- A1: MATRIKS PERBANDINGAN -->
  <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
    <button
      type="button"
      on:click={() => toggleStep('A1')}
      class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-bold text-xs text-slate-800 transition"
    >
      <span class="flex items-center gap-2">
        <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">A1</span>
        Matriks Perbandingan Berpasangan (A) & Jumlah Kolom
      </span>
      {#if openSteps.A1}<ChevronUp class="w-4 h-4 text-slate-400" />{:else}<ChevronDown class="w-4 h-4 text-slate-400" />{/if}
    </button>

    {#if openSteps.A1}
      <div class="p-4 space-y-4 bg-white border-t border-slate-200 text-xs">
        <p class="text-slate-600">Rumus: Baris i dibandingkan dengan kolom j. Total per kolom (Cⱼ) dihitung di bagian bawah.</p>
        <div class="overflow-x-auto">
          <table class="w-full text-center border-collapse border border-slate-200">
            <thead>
              <tr class="bg-slate-50 text-slate-600 font-bold">
                <th class="p-2 border border-slate-200 text-left">Kriteria</th>
                {#each kriteriaList as k, i}
                  <th class="p-2 border border-slate-200">C{k.urutan || i+1}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each kriteriaList as ki, i}
                <tr>
                  <td class="p-2 border border-slate-200 text-left font-bold text-slate-800 bg-slate-50/50">
                    C{ki.urutan || i+1} ({ki.nama})
                  </td>
                  {#each kriteriaList as kj, j}
                    <td class="p-2 border border-slate-200 font-medium text-slate-700">
                      {getPairwiseValue(ki.id, kj.id).toFixed(3)}
                    </td>
                  {/each}
                </tr>
              {/each}
              <tr class="bg-blue-50 font-bold text-blue-900">
                <td class="p-2 border border-slate-200 text-left">Jumlah Kolom (Cⱼ)</td>
                {#each ahpDetail?.colSums || [] as sum}
                  <td class="p-2 border border-slate-200">{sum.toFixed(3)}</td>
                {/each}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>

  <!-- A2: NORMALISASI -->
  <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
    <button
      type="button"
      on:click={() => toggleStep('A2')}
      class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-bold text-xs text-slate-800 transition"
    >
      <span class="flex items-center gap-2">
        <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">A2</span>
        Normalisasi Matriks Perbandingan
      </span>
      {#if openSteps.A2}<ChevronUp class="w-4 h-4 text-slate-400" />{:else}<ChevronDown class="w-4 h-4 text-slate-400" />{/if}
    </button>

    {#if openSteps.A2}
      <div class="p-4 space-y-4 bg-white border-t border-slate-200 text-xs">
        <p class="text-slate-600">Rumus: a'ᵢⱼ = aᵢⱼ / Cⱼ. Setiap elemen dibagi dengan total kolomnya masing-masing.</p>
        <div class="overflow-x-auto">
          <table class="w-full text-center border-collapse border border-slate-200">
            <thead>
              <tr class="bg-slate-50 text-slate-600 font-bold">
                <th class="p-2 border border-slate-200 text-left">Kriteria</th>
                {#each kriteriaList as k, i}
                  <th class="p-2 border border-slate-200">C{k.urutan || i+1}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each ahpDetail?.normalizedMatrix || [] as row, i}
                <tr>
                  <td class="p-2 border border-slate-200 text-left font-bold text-slate-800 bg-slate-50/50">
                    C{kriteriaList[i].urutan || i+1}
                  </td>
                  {#each row as val}
                    <td class="p-2 border border-slate-200 font-medium text-slate-700">{val.toFixed(3)}</td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>

  <!-- A3: BOBOT PRIORITAS -->
  <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
    <button
      type="button"
      on:click={() => toggleStep('A3')}
      class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-bold text-xs text-slate-800 transition"
    >
      <span class="flex items-center gap-2">
        <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">A3</span>
        Bobot Prioritas Kriteria (wᵢ)
      </span>
      {#if openSteps.A3}<ChevronUp class="w-4 h-4 text-slate-400" />{:else}<ChevronDown class="w-4 h-4 text-slate-400" />{/if}
    </button>

    {#if openSteps.A3}
      <div class="p-4 space-y-4 bg-white border-t border-slate-200 text-xs">
        <p class="text-slate-600">Rumus: wᵢ = (1/n) × Σⱼ₌₁ⁿ a'ᵢⱼ. Bobot adalah rata-rata dari baris matriks normalisasi.</p>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr class="bg-slate-50 text-slate-600 font-bold">
                <th class="p-2 border border-slate-200">Inisial</th>
                <th class="p-2 border border-slate-200">Nama Kriteria</th>
                <th class="p-2 border border-slate-200">Bobot Desimal (wᵢ)</th>
                <th class="p-2 border border-slate-200 text-right">Persentase (%)</th>
              </tr>
            </thead>
            <tbody>
              {#each kriteriaList as item, i}
                <tr>
                  <td class="p-2 border border-slate-200 font-bold ">C{item.urutan || i+1}</td>
                  <td class="p-2 border border-slate-200 font-medium">{item.nama}</td>
                  <td class="p-2 border border-slate-200 font-bold text-slate-900">
                    {(ahpDetail?.weights[i] ?? 0).toFixed(3)}
                  </td>
                  <td class="p-2 border border-slate-200 text-right font-medium text-slate-700">
                    {((ahpDetail?.weights[i] ?? 0) * 100).toFixed(1)}%
                  </td>
                </tr>
              {/each}
              <tr class="bg-blue-50 font-extrabold text-blue-900 uppercase">
                <td colspan="2" class="p-2 border border-slate-200 text-center tracking-wider">Total Bobot</td>
                <td class="p-2 border border-slate-200">
                  {(ahpDetail?.weights.reduce((a, b) => a + b, 0) || 0).toFixed(2)}
                </td>
                <td class="p-2 border border-slate-200 text-right">100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>

  <!-- A4: UJI KONSISTENSI -->
  <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
    <button
      type="button"
      on:click={() => toggleStep('A4')}
      class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-bold text-xs text-slate-800 transition"
    >
      <span class="flex items-center gap-2">
        <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">A4</span>
        Uji Konsistensi (CR)
      </span>
      {#if openSteps.A4}<ChevronUp class="w-4 h-4 text-slate-400" />{:else}<ChevronDown class="w-4 h-4 text-slate-400" />{/if}
    </button>

    {#if openSteps.A4}
      <div class="p-4 space-y-5 bg-white border-t border-slate-200 text-xs">
        <!-- Konsistensi per Baris -->
        <div class="space-y-2">
          <p class="font-bold text-slate-700 border-b border-slate-100 pb-1">1. Vektor Bobot Konsistensi (A × w)</p>
            <div class="space-y-2 font-mono text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100">
            {#each kriteriaList as item, i}
              <div class="pb-1.5 border-b border-slate-200/60 last:border-0">
                C{item.urutan || i+1}: ({kriteriaList.map((k, j) => `${getPairwiseValue(item.id, k.id).toFixed(2)} × ${(ahpDetail?.weights[j] ?? 0).toFixed(3)}`).join(' + ')}) = <strong>{(ahpDetail?.awVector[i] ?? 0).toFixed(3)}</strong>
              </div>
            {/each}
          </div>
        </div>

        <!-- Perhitungan Statistik -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-3">
            <p class="font-bold text-slate-700">2. Hasil Perhitungan</p>
            <div class="space-y-2">
              <div class="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span class="text-slate-500">Lambda Max (λmax)</span>
                <span class="font-bold text-slate-800">{ahpDetail?.lambdaMax.toFixed(3)}</span>
              </div>
              <div class="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span class="text-slate-500">Consistency Index (CI)</span>
                <span class="font-bold text-slate-800">{ahpDetail?.ci.toFixed(3)}</span>
              </div>
              <div class="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span class="text-slate-500 font-medium">Random Index (RI) - Tabel n={ahpDetail?.n}</span>
                <span class="font-bold text-slate-800">{ahpDetail?.ri.toFixed(2)}</span>
              </div>
              <div class="flex justify-between items-center py-2 bg-blue-50/50 px-2 rounded-lg">
                <span class="font-bold text-blue-800 uppercase tracking-tight">Consistency Ratio (CR)</span>
                <span class={`font-extrabold text-sm ${ahpDetail?.isConsistent ? 'text-emerald-600' : 'text-red-600'}`}>
                  {ahpDetail?.cr.toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <p class="font-bold text-slate-700">Tabel Nilai RI (Saaty)</p>
            <div class="overflow-hidden rounded-lg border border-slate-100">
              <table class="w-full text-[10px] text-center">
                <tr class="bg-slate-50 font-bold text-slate-500">
                  {#each riTable as item}<td class="p-1.5 border-r border-slate-100 last:border-0">{item.n}</td>{/each}
                </tr>
                <tr class="text-slate-700">
                  {#each riTable as item}<td class="p-1.5 border-r border-slate-100 last:border-0">{item.ri.toFixed(2)}</td>{/each}
                </tr>
              </table>
            </div>
          </div>
        </div>

        <div class={`p-3 rounded-lg border flex items-center gap-3 font-bold ${ahpDetail?.isConsistent ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {#if ahpDetail?.isConsistent}
            <CheckCircle2 class="w-5 h-5" />
            <span>Kesimpulan: Bobot Konsisten (CR ≤ 0.10)</span>
          {:else}
            <AlertCircle class="w-5 h-5" />
            <span>Kesimpulan: Matriks Tidak Konsisten, Perlu Revisi (CR > 0.10)</span>
          {/if}
        </div>
      </div>
    {/if}
  </div>
  {/if}
</div>
