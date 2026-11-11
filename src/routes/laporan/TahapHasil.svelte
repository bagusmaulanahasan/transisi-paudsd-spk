<script>
  import Table from '$lib/components/ui/Table.svelte';
  import FilterTampilanNama from '$lib/components/ui/FilterTampilanNama.svelte';
  import { nilaiNama, tampilanNamaAktif } from '$lib/stores/tampilanNama';
  export let hasil = { baris: [] };

  $: jenisTampilan = $tampilanNamaAktif;

  $: columns = [
    { key: 'no', label: 'No.' },
    { key: 'nama', label: 'Nama Anak' },
    { key: 'yi', label: 'Nilai Optimasi (Yᵢ)' },
    { key: 'ranking', label: 'Ranking' }
  ];
</script>

<!-- TAHAP 3: HASIL MOORA & RANKING -->
<div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 print:border-slate-300">
  <h2 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
    Tahap 3: Hasil Akhir MOORA & Ranking Prioritas Stimulasi
  </h2>
  <Table {columns} data={hasil.baris} rowClass={(baris) => baris.ranking === 1 ? 'bg-blue-50/50' : ''}>
    <svelte:fragment slot="header" let:col>
      {#if col.key === 'nama'}
        <FilterTampilanNama variant="header" />
      {:else}
        {col.label}
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="cell" let:item let:col>
      {#if col.key === 'no'}
        {hasil.baris.indexOf(item) + 1}
      {:else if col.key === 'nama'}
        <span class="font-bold">{nilaiNama(item, jenisTampilan) || '—'}</span>
      {:else if col.key === 'yi'}
        <span class="font-bold text-slate-900">
          {item.yi !== null ? item.yi.toFixed(3) : '—'}
        </span>
      {:else if col.key === 'ranking'}
        {#if item.ranking !== null}
          <span class={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${item.ranking === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {item.ranking}
          </span>
        {:else}
          <span class="text-slate-400">—</span>
        {/if}
      {/if}
    </svelte:fragment>
  </Table>
</div>
