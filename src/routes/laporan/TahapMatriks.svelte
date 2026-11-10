<script>
  import Table from '$lib/components/ui/Table.svelte';
  export let kriteriaList = [];
  export let hasil = { baris: [] };

  $: columns = [
    { key: 'no', label: 'No.' },
    { key: 'nama', label: 'Nama Anak' },
    ...kriteriaList.map((k, i) => ({
      key: `c${i}`,
      label: `C${k.urutan || i + 1}`
    })),
    { key: 'status', label: 'Status' }
  ];

  $: tableData = hasil.baris.map((baris, idx) => ({
    no: idx + 1,
    nama: baris.nama,
    ...baris.nilai.reduce((acc, val, i) => ({ ...acc, [`c${i}`]: val }), {}),
    status: baris
  }));
</script>

<!-- TAHAP 2: MATRIKS KEPUSATAN -->
<div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 print:border-slate-300">
  <h2 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
    Tahap 2: Matriks Keputusan (X) — Total Poin per Kriteria
  </h2>
  <Table {columns} data={tableData}>
    <svelte:fragment slot="cell" let:item let:col>
      {#if col.key === 'nama'}
        <span class="font-bold text-slate-900">{item.nama}</span>
      {:else if col.key === 'status'}
        <span class={`font-semibold ${item.status.lengkap ? 'text-emerald-600' : 'text-amber-600'}`}>
          {#if item.status.lengkap}
            Lengkap
          {:else}
            Belum Lengkap ({item.status.terjawab}/{item.status.total})
          {/if}
        </span>
      {:else if col.key !== 'no'}
        <span class="font-medium">{item[col.key]}</span>
      {:else}
        {item.no}
      {/if}
    </svelte:fragment>
  </Table>
</div>
