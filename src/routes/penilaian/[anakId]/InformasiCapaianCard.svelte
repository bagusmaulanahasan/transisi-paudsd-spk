<script>
  import Card from '$lib/components/ui/Card.svelte';
  import Table from '$lib/components/ui/Table.svelte';
  import { Info } from 'lucide-svelte';

  export let opsiList = [];

  $: columns = [
    { key: 'poin', label: 'Poin', class: 'w-20 text-center' },
    { key: 'opsi', label: 'Keterangan', class: 'text-left' },
    { key: 'keterangan', label: 'Deskripsi', class: 'text-left' }
  ];

  $: tableData = [...opsiList].sort((a, b) => b.poin - a.poin);
</script>

<Card className="overflow-hidden p-0">
  <div class="pb-4 md:p-6 border-b border-slate-100 flex items-center gap-3">
    <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
      <Info class="w-5 h-5 text-blue-600" />
    </div>
    <div>
      <h2 class="text-lg font-bold text-slate-900 tracking-tight">Informasi Capaian</h2>
      <p class="text-xs text-slate-500 mt-1">Keterangan poin penilaian untuk setiap indikator.</p>
    </div>
  </div>

  <div class="md:p-6">
    <Table columns={columns} data={tableData} className="border border-slate-100">
      <svelte:fragment slot="cell" let:item let:col>
        {#if col.key === 'poin'}
          <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-slate-100 text-slate-700">
            {item.poin}
          </span>
        {:else if col.key === 'opsi'}
          <span class="text-sm font-bold text-slate-800">{item.opsi}</span>
        {:else if col.key === 'keterangan'}
          <span class="text-xs text-slate-600">{item.keterangan || '-'}</span>
        {/if}
      </svelte:fragment>
    </Table>
  </div>
</Card>