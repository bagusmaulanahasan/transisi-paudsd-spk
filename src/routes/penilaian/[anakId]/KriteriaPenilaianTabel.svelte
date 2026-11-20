<script>
  import Table from '$lib/components/ui/Table.svelte';
  import { AlertCircle, Check } from 'lucide-svelte';

  export let kriteria;
  export let opsiList = [];
  export let jawabanAnakMap = {};
  /** Set id indikator yang ditampilkan; null = tampilkan semua. */
  export let filterId = null;

  // Kolom opsi mengikuti isi opsiList dari database.
  $: columns = [
    { key: 'no', label: 'No.', class: 'w-20' },
    { key: 'indikator', label: 'Indikator', class: 'min-w-[16rem]', wrap: true },
    ...opsiList.map((opsi) => ({
      key: 'opsi_' + opsi.id,
      label: opsi.opsi,
      class: 'text-center w-28',
      opsiId: opsi.id
    }))
  ];

  // Nomor (C1.1, C1.2, ...) dihitung dari urutan asli, jadi tetap benar saat difilter.
  $: data = (kriteria?.indikator || [])
    .map((indikator, index) => ({
      id: indikator.id,
      no: `${kriteria.inisial}.${index + 1}`,
      indikator: indikator.pertanyaan,
      jawaban: jawabanAnakMap[indikator.id] ?? null
    }))
    .filter((item) => !filterId || filterId.has(item.id));

  // Baris yang belum dinilai diberi latar kuning tipis.
  const rowClass = (item) => (item.jawaban ? '' : 'bg-amber-50/70');
</script>

<Table
  {columns}
  {data}
  {rowClass}
  emptyText="Belum ada indikator"
  emptyDescription="Belum ada indikator pada kriteria ini."
>
  <svelte:fragment slot="cell" let:item let:col>
    {#if col.key === 'no'}
      <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
        {item.no}
      </span>
    {:else if col.key === 'indikator'}
      <div class="space-y-2">
        <p class="text-sm font-medium text-slate-900 leading-relaxed">{item.indikator}</p>
        {#if !item.jawaban}
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle class="w-3 h-3" /> Belum dinilai
          </span>
        {/if}
      </div>
    {:else if col.opsiId !== undefined}
      {@const terpilih = item.jawaban?.opsi_jawaban_id === col.opsiId}
      <div class="flex items-center justify-center">
        <span
          class="inline-flex items-center justify-center w-6 h-6 rounded-md border {terpilih
            ? 'bg-emerald-600 border-emerald-600 text-white'
            : 'bg-white border-slate-300'}"
          title={terpilih ? `Dinilai: ${col.label}` : ''}
          aria-label={terpilih ? `${col.label} (dipilih)` : col.label}
        >
          {#if terpilih}
            <Check class="w-4 h-4" />
          {/if}
        </span>
      </div>
    {/if}
  </svelte:fragment>
</Table>