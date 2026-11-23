<script>
  import Table from '$lib/components/ui/Table.svelte';
  import FilterTampilanNama from '$lib/components/ui/FilterTampilanNama.svelte';
  import { getKategoriNilai } from '$lib/spk/moora';
  import { formatAngka } from '$lib/utils/angka';
  import { nilaiNama, tampilanNamaAktif } from '$lib/stores/tampilanNama';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import { Search } from 'lucide-svelte';

  export let kriteriaList = [];
  export let hasil = { baris: [] };

  $: jenisTampilan = $tampilanNamaAktif;

  let searchQuery = '';
  let sortBy = 'ranking'; // 'ranking' atau 'nama'

  // Olah data untuk tabel gabungan (Matriks + Yi + Ranking)
  $: processedData = hasil.baris
    .filter(baris => {
      if (!searchQuery) return true;
      const nama = (baris.nama || '').toLowerCase();
      const panggil = (baris.nama_panggilan || '').toLowerCase();
      const kode = (baris.kode_anak || '').toLowerCase();
      const q = searchQuery.toLowerCase();
      return nama.includes(q) || panggil.includes(q) || kode.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'nama') {
        return (a.nama || '').localeCompare(b.nama || '');
      }
      // Default: ranking (Yi terbesar ke terkecil)
      // Anak belum lengkap (Yi null) ditaruh di bawah
      if (a.yi === null && b.yi === null) return (a.nama || '').localeCompare(b.nama || '');
      if (a.yi === null) return 1;
      if (b.yi === null) return -1;
      return b.yi - a.yi;
    })
    .map((baris, index) => {
      // Mapping untuk kolom dinamis kriteria
      let mapped = { 
        ...baris,
        no: index + 1
      };
      (baris.nilai || []).forEach((val, i) => {
        mapped[`c${i}`] = val;
      });
      return mapped;
    });

  $: columns = [
    { key: 'no', label: 'No.', class: 'w-12 sm:w-16' },
    { key: 'nama', label: 'Nama Anak' },
    ...kriteriaList.map((k, i) => ({
      key: `c${i}`,
      label: `C${k.urutan || i + 1}`,
      class: 'text-center',
    })),
    { key: 'yi', label: 'Nilai Optimasi (Yᵢ)', class: 'text-center' },
    { key: 'ranking', label: 'Ranking', class: 'text-center' }
  ];
</script>

<!-- GABUNGAN MATRIKS KEPUTUSAN & HASIL MOORA -->
<div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5 print:border-slate-300 print:shadow-none">
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-4 print:border-slate-300">
    <div>
      <h2 class="text-lg font-bold text-slate-900 tracking-tight">Hasil Penilaian dan Prioritas Stimulasi</h2>
   </div>

    <!-- Fitur Pencarian & Filter -->
    <div class="flex flex-wrap items-center gap-2 print:hidden">
      <div class="relative">
        <!-- <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /> -->
        <Input 
          type="text" 
          placeholder="Cari anak..." 
          bind:value={searchQuery} 
          className="pl-9 w-full lg:w-44 h-9 text-xs"
        />
      </div>
      <Select
        bind:value={sortBy}
        placeholder=""
        options={[
          { value: 'ranking', label: 'Urut: Ranking' },
          { value: 'nama', label: 'Urut: Nama A-Z' }
        ]}
        className="w-36 h-9 text-xs"
      />
    </div>
  </div>

    <!-- Kategori Warna Matriks Keputusan -->
    <div class="flex flex-wrap items-center gap-3 text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl">
      <span class="font-bold text-slate-700">Kategori Skala Nilai:</span>
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Rendah (1 – 1,6667)
      </span>
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
        Sedang (1,6668 – 2,3333)
      </span>
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
        Tinggi (2,3334 – 3)
      </span>
    </div>

  <Table {columns} data={processedData} rowClass={(item) => item.ranking === 1 ? 'bg-blue-50/50' : ''}>
    <svelte:fragment slot="header" let:col>
      {#if col.key === 'nama'}
        <FilterTampilanNama variant="header" />
      {:else}
        {col.label}
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="cell" let:item let:col>
      {#if col.key === 'no'}
        {item.no}
      {:else if col.key === 'nama'}
        <span class="font-bold text-sm text-slate-900">{nilaiNama(item, jenisTampilan) || '—'}</span>
      {:else if col.key === 'yi'}
        {#if item.yi !== null}
          <span class="font-bold text-sm text-slate-900">{formatAngka(item.yi, 4)}</span>
        {:else}
          <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            Belum Lengkap ({item.terjawab}/{item.total})
          </span>
        {/if}
      {:else if col.key === 'ranking'}
        {#if item.ranking !== null}
          <span class={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${item.ranking === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {item.ranking}
          </span>
        {:else}
          <span class="text-slate-400">—</span>
        {/if}
      {:else if col.key.startsWith('c')}
        {@const val = item[col.key]}
        {@const kat = getKategoriNilai(val)}
        <div class="flex items-center justify-center">
          <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold border {kat.bgClass} {kat.textClass} {kat.borderClass}" title="Nilai: {formatAngka(val, 4)} ({kat.label})">
            {formatAngka(val, 4)}
          </span>
        </div>
      {/if}
    </svelte:fragment>
  </Table>
</div>
