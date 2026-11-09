<script>
  import Card from '$lib/components/ui/Card.svelte';
  import Table from '$lib/components/ui/Table.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import { Trophy, Users, Eye, AlertCircle } from 'lucide-svelte';

  export let kriteriaList = [];
  export let bobot = [];
  export let hasil = { baris: [], jumlahLengkap: 0, jumlahAnak: 0 };
  export let ahpSiap = false;
  export let selectedKelasId = null;
  export let waktuPerhitungan = null;
  export let statusSimpanHasil = '';
</script>

<Card className="overflow-hidden p-0">
  <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <Trophy class="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h2 class="text-lg font-bold text-slate-900 tracking-tight">Hasil Perhitungan MOORA</h2>
        <p class="text-xs text-slate-500 mt-1 leading-relaxed">
          Nilai Yi dibulatkan 3 angka di belakang koma. Klik baris anak atau tombol Lihat untuk membuka penilaian.
        </p>
      </div>
    </div>
    <div class="flex flex-col items-start lg:items-end gap-1">
      <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap">
        Lengkap {hasil.jumlahLengkap}/{hasil.jumlahAnak} Anak
      </span>
      {#if waktuPerhitungan}
        <span class="text-[10px] text-slate-400 font-medium">
          Diperbarui {waktuPerhitungan.toLocaleTimeString('id-ID')}
        </span>
      {/if}
    </div>
  </div>

  <div class="p-5 md:p-6 space-y-4">
    <!-- Bobot AHP yang dipakai -->
    <div class="flex flex-wrap sm:columns-2 gap-2">
      {#each kriteriaList as kriteria, index (kriteria.id)}
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
          {kriteria.inisial}: {bobot[index] !== undefined ? bobot[index].toFixed(3) : '—'}
          <span class="text-slate-400">({kriteria.jenis})</span>
        </span>
      {/each}
    </div>

    {#if hasil.baris.length === 0}
      <EmptyState
        title="Belum ada data untuk dihitung"
        description="Tambahkan anak dan isi jawaban indikator terlebih dahulu."
        icon={Users}
        className="border-dashed bg-slate-50/50"
      />
    {:else}
      <div class="overflow-x-auto">
        <Table
          columns={[
            { key: 'no', label: 'No.', class: 'w-12 sm:w-16' },
            { key: 'nis', label: 'NIS', class: 'w-20 lg:w-32 hidden lg:table-cell' },
            { key: 'nama', label: 'Nama Anak', class: 'w-[130px] lg:w-auto' },
            { key: 'aksi_mobile', label: 'Aksi', class: 'text-center whitespace-nowrap lg:hidden' },
            ...kriteriaList.map(k => ({ key: 'k_' + k.id, label: k.inisial, class: 'text-center' })),
            { key: 'yi', label: 'Nilai Yi', class: 'text-center whitespace-nowrap' },
            { key: 'ranking', label: 'Ranking', class: 'text-center whitespace-nowrap' },
            { key: 'aksi', label: 'Aksi', class: 'text-center whitespace-nowrap hidden lg:table-cell' }
          ]}
          data={hasil.baris.map((baris, index) => {
            let mapped = {
              ...baris,
              no: index + 1
            };
            baris.nilai.forEach((val, idx) => {
              if (kriteriaList[idx]) {
                mapped['k_' + kriteriaList[idx].id] = val;
              }
            });
            return mapped;
          })}
          className=""
        >
          <svelte:fragment slot="cell" let:item let:col>
            {#if col.key === 'nis'}
              {#if item.nis}
                <span class="text-sm font-semibold text-slate-700">{item.nis}</span>
              {:else}
                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap">
                  Belum diisi
                </span>
              {/if}
            {:else if col.key === 'nama'}
              <span class="text-sm font-bold text-slate-800 leading-snug">{item.nama}</span>
            {:else if col.key === 'aksi_mobile'}
              <a
                href={`/penilaian/${item.anak_id}?kelas=${selectedKelasId}`}
                on:click|stopPropagation
                class="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-lg text-[11px] font-bold transition whitespace-nowrap"
              >
                <Eye class="w-3.5 h-3.5" />
                Lihat
              </a>
            {:else if col.key.startsWith('k_')}
              <span class="text-sm font-semibold text-slate-700 text-center">{item[col.key]}</span>
            {:else if col.key === 'yi'}
              <span class="text-sm font-extrabold text-slate-900 text-center">
                {item.yi !== null ? item.yi.toFixed(3) : '—'}
              </span>
            {:else if col.key === 'ranking'}
              {#if item.ranking !== null}
                <span class="inline-flex items-center justify-center min-w-[34px] px-2.5 py-1 bg-blue-600 text-white text-xs font-extrabold rounded-lg">
                  {item.ranking}
                </span>
              {:else if !ahpSiap}
                <span class="text-xs font-bold text-slate-400">—</span>
              {:else}
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap">
                  Belum lengkap
                </span>
              {/if}
            {:else if col.key === 'aksi'}
              <a
                href={`/penilaian/${item.anak_id}?kelas=${selectedKelasId}`}
                on:click|stopPropagation
                class="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-lg text-[11px] font-bold transition whitespace-nowrap"
              >
                <Eye class="w-3.5 h-3.5" />
                Lihat
              </a>
            {:else}
              {item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-'}
            {/if}
          </svelte:fragment>
        </Table>
      </div>

      {#if hasil.jumlahLengkap < hasil.jumlahAnak}
        <div class="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-[11px] font-medium text-amber-800 leading-relaxed flex items-start gap-2">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p>
              {hasil.jumlahAnak - hasil.jumlahLengkap} anak belum lengkap menjawab seluruh indikator sehingga belum masuk ranking:
            </p>
            <ul class="mt-1.5 space-y-0.5">
              {#each hasil.baris.filter((baris) => !baris.lengkap) as baris (baris.anak_id)}
                <li class="font-semibold">{baris.nama} — {baris.terjawab}/{baris.total} indikator terjawab</li>
              {/each}
            </ul>
          </div>
        </div>
      {/if}
    {/if}
  </div>

  {#if statusSimpanHasil}
    <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
      <p class="text-[11px] text-slate-500 font-medium leading-relaxed">{statusSimpanHasil}</p>
    </div>
  {/if}
</Card>
