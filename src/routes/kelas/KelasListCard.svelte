<script>
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Table from '$lib/components/ui/Table.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import { Plus, Trash2, Edit2, Users, School } from 'lucide-svelte';

  export let kelasList = [];
  export let jumlahAnakMap = {};
  export let openAddModal = () => {};
  export let openEditModal = () => {};
  export let deleteKelas = () => {};
</script>

<Card className="p-0">
  <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <School class="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h2 class="text-lg font-bold text-slate-900 tracking-tight">Daftar Kelas</h2>
        <p class="text-xs text-slate-500 mt-1 leading-relaxed">
          Klik <strong>Kelola Anak</strong> untuk melihat dan menambah anak pada kelas tersebut.
        </p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap w-fit">
        Total: {kelasList.length} Kelas
      </span>
      <Button on:click={openAddModal}>
        <Plus class="w-4 h-4 mr-1.5" />
        <span>Tambah Kelas</span>
      </Button>
    </div>
  </div>

  {#if kelasList.length === 0}
    <div class="p-5 md:p-6">
      <EmptyState
        title="Belum ada kelas"
        description="Tambahkan kelas pertama, misalnya 'Kelas A' untuk tahun ajaran berjalan."
        icon={School}
      >
        <div slot="action">
          <Button on:click={openAddModal}>
            <Plus class="w-4 h-4 mr-1.5" />
            <span>Tambah Kelas</span>
          </Button>
        </div>
      </EmptyState>
    </div>
  {:else}
    <Table
      columns={[
        { key: 'no', label: 'No.', class: 'w-16' },
        { key: 'nama_kelas', label: 'Nama Kelas' },
        { key: 'tahun_ajaran', label: 'Tahun Ajaran' },
        { key: 'jumlah_anak', label: 'Jumlah Anak', class: 'text-center' },
        { key: 'aksi', label: 'Aksi', class: 'text-right w-48' }
      ]}
      data={kelasList.map((k, i) => ({ ...k, no: i + 1, jumlah_anak: jumlahAnakMap[k.id] || 0 }))}
    >
      <svelte:fragment slot="cell" let:item let:col>
        {#if col.key === 'nama_kelas'}
          <a
            href={`/kelas/${item.id}`}
            class="text-sm font-bold text-slate-800 hover:text-blue-600 transition"
          >
            {item.nama_kelas}
          </a>
        {:else if col.key === 'tahun_ajaran'}
          <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
            {item.tahun_ajaran}
          </span>
        {:else if col.key === 'jumlah_anak'}
          <span class="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700">
            <Users class="w-3.5 h-3.5 text-slate-400" />
            {item.jumlah_anak}
          </span>
        {:else if col.key === 'aksi'}
          <div class="flex justify-end gap-2">
            <a
              href={`/kelas/${item.id}`}
              class="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition"
              title="Kelola Anak"
            >
              <Users class="w-3.5 h-3.5" />
              <span>Kelola Anak</span>
            </a>
            <Button variant="outline" className="p-2 h-auto" on:click={() => openEditModal(item)} title="Ubah Kelas">
              <Edit2 class="w-3.5 h-3.5" />
            </Button>
            <Button variant="danger" className="p-2 h-auto bg-red-50 hover:bg-red-100 text-red-600 border-red-100 shadow-none" on:click={() => deleteKelas(item)} title="Hapus Kelas">
              <Trash2 class="w-3.5 h-3.5" />
            </Button>
          </div>
        {:else}
          {item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-'}
        {/if}
      </svelte:fragment>
    </Table>

    <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
      <p class="text-[11px] text-slate-500 font-medium leading-relaxed">
        Menghapus kelas akan menghapus seluruh data anak dan penilaian di dalamnya. Pastikan data sudah tidak dibutuhkan.
      </p>
    </div>
  {/if}
</Card>
