<script>
  import Table from '$lib/components/ui/Table.svelte';
  import FilterTampilanNama from '$lib/components/ui/FilterTampilanNama.svelte';
  import { getKategoriNilai } from '$lib/spk/moora';
  import { nilaiNama, tampilanNamaAktif } from '$lib/stores/tampilanNama';
  export let kriteriaList = [];
  export let hasil = { baris: [] };

  $: jenisTampilan = $tampilanNamaAktif;

  $: columns = [
    { key: 'no', label: 'No.' },
    { key: 'nama', label: 'Nama Anak' },
    ...kriteriaList.map((k, i) => ({
      key: `c${i}`,
      label: `C${k.urutan || i + 1}`,
      class: 'text-center',
    })),
    { key: 'status', label: 'Status' }
  ];

  $: tableData = hasil.baris.map((baris, idx) => ({
    no: idx + 1,
    nama: baris.nama,
    nama_panggilan: baris.nama_panggilan ?? null,
    kode_anak: baris.kode_anak ?? null,
    ...baris.nilai.reduce((acc, val, i) => ({ ...acc, [`c${i}`]: val }), {}),
    status: baris
  }));
</script>

<!-- TAHAP 2: MATRIKS KEPUSATAN -->
<div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 print:border-slate-300">
  <h2 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
    Tahap 2: Matriks Keputusan (X) — Total Poin per Kriteria
  </h2>

  <!-- Legenda Kategori Warna -->
  <div class="flex flex-wrap items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
    <span class="font-bold text-slate-700">Kategori Skala Nilai:</span>
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
      Rendah (1 – 1.667)
    </span>
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
      Sedang (1.668 – 2.333)
    </span>
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
      Tinggi (2.334 – 3)
    </span>
  </div>

  <Table {columns} data={tableData}>
    <svelte:fragment slot="header" let:col>
      {#if col.key === 'nama'}
        <FilterTampilanNama variant="header" />
      {:else}
        {col.label}
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="cell" let:item let:col>
      {#if col.key === 'nama'}
        <span class="font-bold text-slate-900">{nilaiNama(item, jenisTampilan) || '—'}</span>
      {:else if col.key === 'status'}
        <span class={`font-semibold ${item.status.lengkap ? 'text-emerald-600' : 'p-1 rounded-md text-slate-700 border border-slate-300'}`}>
          {#if item.status.lengkap}
            Lengkap
          {:else}
            Belum Lengkap ({item.status.terjawab}/{item.status.total})
          {/if}
        </span>
      {:else if col.key !== 'no'}
        {@const val = item[col.key]}
        {@const kat = getKategoriNilai(val)}
        <div class="flex items-center justify-center">
          <span class="inline-block px-2.5 py-1 rounded-lg text-xs font-bold border {kat.bgClass} {kat.textClass} {kat.borderClass}" title="Nilai: {val} ({kat.label})">
            {val}
          </span>
        </div>
      {:else}
        {item.no}
      {/if}
    </svelte:fragment>
  </Table>
</div>
