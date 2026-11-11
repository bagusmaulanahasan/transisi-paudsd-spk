<script>
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Table from '$lib/components/ui/Table.svelte';
  import { Plus, Trash2, Edit2, ListTree } from 'lucide-svelte';

  export let kriteriaList = [];
  export let ahpResult = { weights: [] };
  export let openAddModal = () => {};
  export let openEditModal = () => {};
  export let deleteKriteria = () => {};
</script>

<Card className="flex flex-col">
   <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 -mx-6 -mt-6 mb-6">
    <div class="flex items-center space-x-3">
      <div class="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
        <ListTree class="w-5 h-5" />
      </div>
      <div>
        <h2 class="text-lg font-bold text-slate-900 tracking-tight">Daftar Kriteria Penilaian</h2>
        <p class="text-xs text-slate-500 mt-0.5">Daftar kriteria aktif yang digunakan dalam perhitungan.</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
        Total: {kriteriaList.length} Kriteria
      </span>
      <Button on:click={openAddModal}>
        <Plus class="w-4 h-5 mr-1.5" />
        <span>Tambah Kriteria</span>
      </Button>
    </div>
  </div>

  <div class="overflow-x-auto">
    <Table 
      columns={[
        { key: 'inisial', label: 'Inisial', class: 'w-24' },
        { key: 'nama', label: 'Nama Kriteria' },
        { key: 'jenis', label: 'Jenis MOORA' },
        { key: 'bobot', label: 'Bobot AHP ($w_j$)' },
        { key: 'aksi', label: 'Aksi', class: 'text-right' }
      ]}
      data={kriteriaList}
    >
      <svelte:fragment slot="cell" let:item let:index let:col>
        {#if col.key === 'inisial'}
          <span class="font-extrabold ">{item.inisial}</span>
        {:else if col.key === 'nama'}
          <span class="font-bold text-slate-800">{item.nama}</span>
        {:else if col.key === 'jenis'}
          <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider {item.jenis === 'benefit' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'} border">
            {item.jenis}
          </span>
        {:else if col.key === 'bobot'}
          <span class="font-extrabold text-slate-900">{ahpResult.weights[index] ? ahpResult.weights[index].toFixed(3) : '0.000'}</span>
        {:else if col.key === 'aksi'}
          <div class="space-x-2">
            <Button variant="ghost" className="p-2" title="Edit Kriteria" on:click={() => openEditModal(item)}>
              <Edit2 class="w-3.5 h-3.5 mr-1" />
              <span>Edit</span>
            </Button>
            <Button variant="danger" className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 shadow-none border-none" title="Hapus Kriteria" on:click={() => deleteKriteria(item.id)}>
              <Trash2 class="w-3.5 h-3.5 mr-1" />
              <span>Hapus</span>
            </Button>
          </div>
        {:else}
          {item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-'}
        {/if}
      </svelte:fragment>
    </Table>
  </div>
</Card>
