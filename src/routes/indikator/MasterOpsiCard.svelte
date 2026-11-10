<script>
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Table from '$lib/components/ui/Table.svelte';
  import { ListChecks, Plus, Edit2, Trash2, HelpCircle } from 'lucide-svelte';

  export let masterOpsi = [];
  export let openAddOpsi;
  export let openEditOpsi;
  export let deleteOpsi;
</script>

<Card className="overflow-hidden">
  <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 -mx-6 -mt-6 mb-6">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <ListChecks class="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h2 class="text-lg font-bold text-slate-900 tracking-tight">Master Opsi Jawaban</h2>
        <p class="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
          Skala penilaian baku yang berlaku untuk <strong>semua kriteria & indikator</strong>. Poin diisi otomatis sesuai urutan.
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3 sm:shrink-0">
      <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap">
        Total: {masterOpsi.length} Opsi
      </span>
      <Button on:click={openAddOpsi}>
        <Plus class="w-4 h-4 mr-1.5" />
        <span>Tambah Opsi</span>
      </Button>
    </div>
  </div>

  {#if masterOpsi.length === 0}
    <div class="p-5 md:p-6">
      <div class="flex flex-col items-center justify-center p-10 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
        <HelpCircle class="w-8 h-8 text-slate-300 mb-3" />
        <p class="text-sm font-bold text-slate-700">Belum ada opsi jawaban baku</p>
        <p class="text-xs text-slate-500 mt-1">Tambahkan minimal 2 opsi agar penilaian anak bermakna.</p>
      </div>
    </div>
  {:else}
    <div class="py-5 md:px-6 pt-4 md:pt-0">
      <p class="md:hidden text-[11px] text-slate-400 font-medium">Geser tabel ke samping untuk melihat semua kolom.</p>
    </div>
    <div class="overflow-x-auto">
      <Table
        columns={[
          { key: 'no', label: 'No.', class: 'w-20' },
          { key: 'opsi', label: 'Teks Opsi' },
          { key: 'keterangan', label: 'Keterangan' },
          { key: 'poin', label: 'Poin (Otomatis)', class: 'text-center whitespace-nowrap' },
          { key: 'aksi', label: 'Aksi', class: 'text-right w-32' }
        ]}
        data={masterOpsi.map((o, i) => ({ ...o, no: i + 1 }))}
      >
        <svelte:fragment slot="cell" let:item let:col>
          {#if col.key === 'no'}
            <span class="text-sm font-bold text-slate-500">{item.no}</span>
          {:else if col.key === 'opsi'}
            <span class="text-sm font-bold text-slate-800">{item.opsi}</span>
          {:else if col.key === 'keterangan'}
            <span class="text-xs text-slate-500 leading-relaxed">{item.keterangan || '—'}</span>
          {:else if col.key === 'poin'}
            <span class="inline-flex items-center justify-center min-w-[34px] px-2.5 py-1 bg-blue-600 text-white text-xs font-extrabold rounded-lg">
              {item.poin}
            </span>
          {:else if col.key === 'aksi'}
            <div class="space-x-2 whitespace-nowrap">
              <Button variant="ghost" className="p-2" title="Ubah Opsi" on:click={() => openEditOpsi(item)}>
                <Edit2 class="w-3.5 h-3.5" />
              </Button>
              <Button variant="danger" className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 shadow-none border-none" title="Hapus Opsi" on:click={() => deleteOpsi(item)}>
                <Trash2 class="w-3.5 h-3.5" />
              </Button>
            </div>
          {:else}
            {item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-'}
          {/if}
        </svelte:fragment>
      </Table>
    </div>

    <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100 -mx-6 -mb-6 mt-6">
      <p class="text-[11px] text-slate-500 font-medium leading-relaxed">
        Poin dihitung otomatis 1, 2, 3, ... berdasarkan urutan opsi dan tidak dapat diubah manual.
      </p>
    </div>
  {/if}
</Card>
