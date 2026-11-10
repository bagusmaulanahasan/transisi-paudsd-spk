<script>
  import Card from '$lib/components/ui/Card.svelte';
  import { Loader2, CheckCircle2, AlertCircle, ClipboardList, CloudOff } from 'lucide-svelte';

  export let kriteriaList = [];
  export let indikatorPerKriteria = [];
  export let opsiList = [];
  export let bobot = [];
  export let modeEdit = false;
  export let menyimpan = null;
  export let jawabanAnakMap = {};
  export let opsiMap = {};
  export let terjawabAnak = 0;
  export let jumlahIndikator = 0;
  export let statusLokal = {};
  export let onPilihJawaban = () => {};
</script>

<Card className="overflow-hidden p-0">
  <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <ClipboardList class="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h2 class="text-lg font-bold text-slate-900 tracking-tight">Jawaban Penilaian</h2>
        <p class="text-xs text-slate-500 mt-1 leading-relaxed">
          {modeEdit
            ? 'Mode edit — setiap jawaban yang dipilih langsung tersimpan otomatis.'
            : 'Mode lihat — tekan Edit Penilaian untuk mengubah jawaban.'}
        </p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap">
        Terjawab {terjawabAnak}/{jumlahIndikator}
      </span>
      {#if jumlahIndikator > 0 && terjawabAnak === jumlahIndikator}
        <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg whitespace-nowrap">
          <CheckCircle2 class="w-3.5 h-3.5" /> Lengkap
        </span>
      {:else}
        <span class="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-lg whitespace-nowrap">
          <AlertCircle class="w-3.5 h-3.5" /> Belum lengkap
        </span>
      {/if}
    </div>
  </div>

  <div class="p-5 md:p-6 space-y-6">
    {#if kriteriaList.length === 0}
      <p class="text-sm text-slate-500">Belum ada kriteria penilaian.</p>
    {:else}
      {#each indikatorPerKriteria as kriteria, kriteriaIndex (kriteria.id)}
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
            <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
              {kriteria.inisial}
            </span>
            <h3 class="text-sm font-bold text-slate-900">{kriteria.nama}</h3>
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border {kriteria.jenis === 'benefit' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}">
              {kriteria.jenis}
            </span>
            <span class="ml-auto text-[11px] font-semibold text-slate-400 whitespace-nowrap">
              Bobot {bobot[kriteriaIndex] !== undefined ? bobot[kriteriaIndex].toFixed(3) : '—'}
            </span>
          </div>

          {#if kriteria.indikator.length === 0}
            <p class="text-xs text-slate-400 font-medium">Belum ada indikator pada kriteria ini.</p>
          {:else}
            {#each kriteria.indikator as indikator, indikatorIndex (indikator.id)}
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5 space-y-3 transition hover:bg-white">
                <div class="space-y-1">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Indikator #{indikatorIndex + 1} — {kriteria.inisial}
                    </span>
                    {#if !modeEdit && jawabanAnakMap[indikator.id]}
                      <span class="inline-flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle2 class="w-3 h-3" /> Terjawab
                      </span>
                    {/if}
                  </div>
                  <p class="text-sm font-medium text-slate-900 leading-relaxed">
                    {indikator.pertanyaan}
                  </p>
                </div>

                {#if modeEdit}
                  <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                    {#each opsiList as opsi (opsi.id)}
                      <button
                        on:click={() => onPilihJawaban(indikator, opsi)}
                        disabled={menyimpan === indikator.id}
                        title={opsi.keterangan || ''}
                        class="px-3 py-2 rounded-lg border text-xs font-bold text-left transition disabled:opacity-60 {jawabanAnakMap[indikator.id]?.opsi_jawaban_id === opsi.id
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700'}"
                      >
                        Poin {opsi.poin}: {opsi.opsi}
                      </button>
                    {/each}
                    {#if menyimpan === indikator.id}
                      <Loader2 class="w-4 h-4 text-blue-600 animate-spin" />
                    {/if}
                  </div>
                {:else if jawabanAnakMap[indikator.id]}
                  <div class="flex flex-wrap items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2.5">
                    <CheckCircle2 class="w-4 h-4 text-blue-600 shrink-0" />
                    <span class="text-sm font-bold text-slate-800">
                      {opsiMap[jawabanAnakMap[indikator.id].opsi_jawaban_id]?.opsi ?? 'Jawaban tersimpan'}
                    </span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white text-blue-700 border border-blue-100">
                      Poin {jawabanAnakMap[indikator.id].poin}
                    </span>
                  </div>
                {:else}
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                    <AlertCircle class="w-3 h-3" /> Belum dijawab
                  </span>
                {/if}

                {#if statusLokal[indikator.id] === 'menunggu_sinkronisasi'}
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                    <CloudOff class="w-3 h-3" /> Tersimpan di perangkat, menunggu sinkronisasi
                  </span>
                {:else if statusLokal[indikator.id] === 'tersinkron'}
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckCircle2 class="w-3 h-3" /> Tersinkron
                  </span>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
      {/each}
    {/if}
  </div>

  <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
    <p class="text-[11px] text-slate-500 font-medium leading-relaxed">
      {modeEdit
        ? 'Jawaban disimpan otomatis setiap kali dipilih. Nilai Yi dan ranking seluruh anak di kelas ini ikut diperbarui.'
        : 'Tampilan ini hanya untuk melihat hasil. Tekan tombol Edit Penilaian di atas untuk mengubah jawaban.'}
    </p>
  </div>
</Card>
