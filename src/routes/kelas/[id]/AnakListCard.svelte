<script>
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Table from '$lib/components/ui/Table.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import FilterTampilanNama from '$lib/components/ui/FilterTampilanNama.svelte';
  import { labelKolomNama, nilaiNama, tampilanNamaAktif } from '$lib/stores/tampilanNama';
  import { Plus, Trash2, Edit2, Users, UserRound } from 'lucide-svelte';

  export let anakList = [];
  export let openAddModal = () => {};
  export let openEditModal = () => {};
  export let deleteAnak = () => {};

  /** Label & nilai kolom identitas mengikuti pilihan pada filter. */
  $: jenisTampilan = $tampilanNamaAktif;
  $: labelIdentitas = labelKolomNama(jenisTampilan);
</script>

<Card padding="px-5 py-4">
  <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
    <div class="flex items-start gap-3">
      <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <Users class="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h2 class="text-lg font-bold text-slate-900 tracking-tight">Daftar Anak</h2>
        <p class="text-xs text-slate-500 mt-1 leading-relaxed">
          Nama panggilan boleh dikosongkan dan harus unik di kelas ini. Kode anak dibuat otomatis oleh sistem.
        </p>
      </div>
    </div>
    <div class="flex flex-wrap items-end gap-3">
      <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap w-fit">Total: {anakList.length} Anak</span>
    </div>
  </div>

  {#if anakList.length === 0}
    <div class="p-5 md:p-6">
      <EmptyState
        title="Belum ada data anak"
        description="Tambahkan anak pertama pada kelas ini untuk mulai melakukan penilaian."
        icon={UserRound}
      >
        <div slot="action">
          <Button on:click={openAddModal}>
            <Plus class="w-4 h-4 mr-1.5" />
            <span>Tambah Data Anak</span>
          </Button>
        </div>
      </EmptyState>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <Table
        columns={[
          { key: 'no', label: 'No.', class: 'w-16' },
          { key: 'identitas', label: labelIdentitas, class: 'w-56' },
          { key: 'aksi', label: 'Aksi', class: 'text-right w-48' }
        ]}
        data={anakList.map((item, index) => ({ ...item, no: index + 1 }))}
      >
        <svelte:fragment slot="header" let:col>
          {#if col.key === 'identitas'}
            <FilterTampilanNama variant="header" />
          {:else}
            {col.label}
          {/if}
        </svelte:fragment>

        <svelte:fragment slot="cell" let:item let:col>
          {#if col.key === 'identitas'}
            {@const nilai = nilaiNama(item, jenisTampilan)}
            {#if nilai}
              {#if jenisTampilan === 'kode_anak'}
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                  {nilai}
                </span>
              {:else}
                <span class="text-sm font-bold text-slate-800">{nilai}</span>
              {/if}
            {:else}
              <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-slate-700 border border-slate-300">
                Belum diisi
              </span>
            {/if}
          {:else if col.key === 'aksi'}
            <div class="text-right whitespace-nowrap space-x-2">
              <Button variant="outline" className="p-2 h-auto" on:click={() => openEditModal(item)} title="Ubah Data Anak">
                <Edit2 class="w-3.5 h-3.5" />
              </Button>
              <Button variant="danger" className="p-2 h-auto bg-red-50 hover:bg-red-100 text-red-600 border-red-100 shadow-none" on:click={() => deleteAnak(item)} title="Hapus Data Anak">
                <Trash2 class="w-3.5 h-3.5" />
              </Button>
            </div>
          {:else}
            {item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-'}
          {/if}
        </svelte:fragment>
      </Table>
    </div>

    <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
      <p class="text-[11px] text-slate-500 font-medium leading-relaxed">
        Nama panggilan harus unik di dalam satu kelas dan boleh kosong. Kode anak dibuat otomatis oleh sistem
        dengan format <strong>[Inisial Kelas]-[Nomor Urut]</strong>, misalnya <code class="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">B3-01</code>.
      </p>
    </div>
  {/if}
</Card>
