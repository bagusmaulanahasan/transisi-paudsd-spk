<script>
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Table from '$lib/components/ui/Table.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import { Plus, Trash2, Edit2, Users, UserRound, PencilLine } from 'lucide-svelte';

  export let anakList = [];
  export let openAddModal = () => {};
  export let openEditModal = () => {};
  export let deleteAnak = () => {};
</script>

<Card padding="p-0">
  <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <div class="flex items-start gap-3">
      <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <Users class="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h2 class="text-lg font-bold text-slate-900 tracking-tight">Daftar Anak</h2>
        <p class="text-xs text-slate-500 mt-1 leading-relaxed">
          NIS bersifat opsional, boleh dikosongkan sekarang dan diisi nanti melalui tombol ubah.
        </p>
      </div>
    </div>
    <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap w-fit">
      Total: {anakList.length} Anak
    </span>
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
          { key: 'nis', label: 'NIS', class: 'w-44' },
          { key: 'nama', label: 'Nama Lengkap Anak' },
          { key: 'aksi', label: 'Aksi', class: 'text-right w-48' }
        ]}
        data={anakList.map((item, index) => ({ ...item, no: index + 1 }))}
      >
        <svelte:fragment slot="cell" let:item let:col>
          {#if col.key === 'nis'}
            {#if item.nis}
              <span class="text-sm font-semibold text-slate-700">{item.nis}</span>
            {:else}
              <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-slate-700 border border-slate-300">
                Belum diisi
              </span>
            {/if}
          {:else if col.key === 'nama'}
            <span class="text-sm font-bold text-slate-800">{item.nama}</span>
          {:else if col.key === 'aksi'}
            <div class="text-right whitespace-nowrap space-x-2">
              <!-- {#if !item.nis}
                <Button
                  variant="outline"
                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-100 gap-1.5 px-3 py-2 h-auto text-[11px]"
                  on:click={() => openEditModal(item)}
                  title="Isi NIS"
                >
                  <PencilLine class="w-3.5 h-3.5" />
                  <span>Isi NIS</span>
                </Button>
              {/if} -->
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
        NIS harus unik di dalam satu kelas, tetapi boleh kosong. Anak tanpa NIS tetap dapat dinilai pada perhitungan MOORA.
      </p>
    </div>
  {/if}
</Card>
