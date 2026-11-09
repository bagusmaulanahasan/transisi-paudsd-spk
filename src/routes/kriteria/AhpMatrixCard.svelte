<script>
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { Edit2, Save, CheckCircle2, AlertCircle, Scale } from 'lucide-svelte';

  export let kriteriaList = [];
  export let pairwiseMatrix = [];
  export let ahpResult = { weights: [], cr: 0, isConsistent: false };
  export let modeEditMatriks = false;
  export let saving = false;
  export let onStartEdit = () => {};
  export let onCancelEdit = () => {};
  export let onSave = () => {};
  export let onNilaiChange = () => {};
</script>

<Card className="space-y-6">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 -mx-6 -mt-6 p-6 mb-0">
    <div class="flex items-center space-x-3">
      <div class="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
        <Scale class="w-5 h-5" />
      </div>
      <div>
        <h2 class="text-lg font-bold text-slate-900 tracking-tight">Matriks Perbandingan Berpasangan (AHP)</h2>
        <p class="text-xs text-slate-500 mt-0.5">Batas konsistensi yang diizinkan: CR ≤ 0.10. Simpan perubahan ke database setelah nilai konsisten.</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      {#if !modeEditMatriks}
        <Button on:click={onStartEdit} className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" title="Edit Matriks">
          <Edit2 class="w-4 h-4 mr-1.5" />
          <span>Edit Matriks</span>
        </Button>
      {:else}
        <Button variant="ghost" on:click={onCancelEdit}>
          <span>Batal</span>
        </Button>
        <Button 
          on:click={onSave}
          disabled={saving || !ahpResult.isConsistent}
          variant="secondary"
          loading={saving}
        >
          {#if !saving}
            <Save class="w-4 h-4 mr-1.5" />
          {/if}
          <span>Simpan Perubahan</span>
        </Button>
      {/if}
    </div>
  </div>

  <!-- Keterangan Skala Saaty -->
  <div class="bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-xs text-blue-900 space-y-2">
    <p class="font-extrabold uppercase tracking-wide flex items-center space-x-1.5">
      <span>Panduan Skala Perbandingan Saaty (1 - 9):</span>
    </p>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 pt-1 font-medium text-[11px]">
      <div><strong>1</strong> : Sama penting</div>
      <div><strong>3</strong> : Sedikit lebih penting</div>
      <div><strong>5</strong> : Lebih penting</div>
      <div><strong>7</strong> : Sangat lebih penting</div>
      <div><strong>9</strong> : Mutlak lebih penting</div>
      <div class="col-span-full"><em>Nilai 2, 4, 6, 8 adalah nilai tengah antar penilaian berdekatan.</em></div>
    </div>
  </div>

  <!-- Matrix Table -->
  <div class="overflow-x-auto">
    <table class="w-full text-center border-collapse text-xs min-w-[700px]">
      <thead>
        <tr class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
          <th class="p-3 text-left border border-slate-200">Kriteria</th>
          {#each kriteriaList as k}
            <th class="p-3 border border-slate-200">{k.inisial}</th>
          {/each}
          <th class="p-3 border border-slate-200 bg-blue-50/50 text-blue-800">Bobot ($w_j$)</th>
        </tr>
      </thead>
      <tbody>
        {#each kriteriaList as ki, i}
          <tr>
            <td class="p-3 text-left font-bold text-slate-800 border border-slate-200 bg-slate-50/50">
              {ki.inisial} 
            </td>
            {#each kriteriaList as kj, j}
              <td class="p-2 border border-slate-200">
                {#if i === j}
                  <div class="w-20 mx-auto py-1.5 px-2 bg-slate-100 text-slate-400 font-bold rounded-lg border border-transparent">1.0</div>
                {:else if i < j}
                  {#if modeEditMatriks}
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      max="9"
                      value={pairwiseMatrix[i][j]}
                      on:input={(e) => onNilaiChange(i, j, e.target.value)}
                      class="w-20 text-center py-1.5 px-2 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition"
                    />
                  {:else}
                    <div class="w-20 mx-auto py-1.5 px-2 bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-100">
                      {pairwiseMatrix[i][j]}
                    </div>
                  {/if}
                {:else}
                  <div class="w-20 mx-auto py-1.5 px-2 bg-slate-50 text-slate-500 font-medium rounded-lg border border-slate-100">
                    {pairwiseMatrix[i][j]}
                  </div>
                {/if}
              </td>
            {/each}
            <td class="p-3 font-extrabold text-blue-700 border border-slate-200 bg-blue-50/30">
              {ahpResult.weights[i] ? ahpResult.weights[i].toFixed(3) : '0.000'}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- CR Status Banner -->
  <div class={`p-4 rounded-xl border flex items-start space-x-3 transition-colors ${ahpResult.isConsistent ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
    {#if ahpResult.isConsistent}
      <CheckCircle2 class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
      <div>
        <p class="text-xs font-extrabold uppercase tracking-wide">Matriks Konsisten (CR = {ahpResult.cr.toFixed(3)})</p>
        <p class="text-[11px] mt-0.5 opacity-90 font-medium text-emerald-700/80">Bobot kriteria sah dan dapat disimpan untuk digunakan pada perankingan MOORA.</p>
      </div>
    {:else}
      <AlertCircle class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <div>
        <p class="text-xs font-extrabold uppercase tracking-wide">Belum Konsisten (CR = {ahpResult.cr.toFixed(3)})</p>
        <p class="text-[11px] mt-0.5 opacity-90 font-medium text-red-700/80">Rasio konsistensi melebihi 0.10. Harap perbaiki perbandingan nilai antar kriteria.</p>
      </div>
    {/if}
  </div>
</Card>
