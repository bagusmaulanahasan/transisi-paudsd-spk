<script>
  import { 
    ChevronDown, 
    ChevronUp 
  } from 'lucide-svelte';
  import { getKategoriNilai } from '$lib/spk/moora';

  export let kriteriaList = [];
  export let mooraDetail = null;
  export let bobot = [];

  let openSteps = {
    B1: false,
    B2: false,
    B3: false,
    B4: false,
    B5: false,
    B6: false
  };

  function toggleStep(step) {
    openSteps[step] = !openSteps[step];
  }
</script>

<div class="space-y-4 pt-4 border-t border-slate-100">
  <div class="border-b border-slate-100 pb-2">
    <h3 class="text-base font-bold text-slate-900">Bagian B: Detail Perhitungan MOORA (Per Kelas Terpilih)</h3>
    <p class="text-[11px] text-slate-500 italic">Langkah-langkah perankingan alternatif anak berdasarkan kelas yang sedang aktif.</p>
  </div>

  {#if !mooraDetail || mooraDetail.lengkap.length === 0}
    <div class="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs space-y-1">
      <p class="font-bold">Perhitungan MOORA belum dapat ditampilkan secara penuh.</p>
      <p>Pastikan AHP sudah konsisten dan terdapat minimal 1 anak dengan penilaian indikator lengkap di kelas ini.</p>
      {#if mooraDetail?.belumLengkap?.length > 0}
        <p class="pt-1 font-semibold">Anak belum lengkap ({mooraDetail.belumLengkap.length} orang):</p>
        <ul class="list-disc pl-4 space-y-0.5">
          {#each mooraDetail.belumLengkap as anak}
            <li>{anak.nama} (Terjawab {anak.terjawab}/{anak.total} indikator)</li>
          {/each}
        </ul>
      {/if}
    </div>
  {:else}
    <div class="space-y-4">
      <!-- B1: MATRIKS KEPUTUSAN X -->
      <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <button
          type="button"
          on:click={() => toggleStep('B1')}
          class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-bold text-xs text-slate-800 transition"
        >
          <span class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">B1</span>
            Matriks Keputusan (X) & Catatan Anak Belum Lengkap
          </span>
          {#if openSteps.B1}<ChevronUp class="w-4 h-4 text-slate-400" />{:else}<ChevronDown class="w-4 h-4 text-slate-400" />{/if}
        </button>

        {#if openSteps.B1}
          <div class="p-4 space-y-4 bg-white border-t border-slate-200 text-xs">
            <p class="text-slate-600">Nilai xᵢⱼ adalah total poin indikator anak pada masing-masing kriteria. Hanya anak dengan status <strong>Lengkap</strong> yang diikutkan ke perhitungan matriks utama.</p>
            
            <!-- Legenda Kategori Warna -->
            <div class="flex flex-wrap items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
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

            <div class="overflow-x-auto">
              <table class="w-full text-center border-collapse border border-slate-200">
                <thead>
                  <tr class="bg-slate-50 text-slate-600 font-bold">
                    <th class="p-2 border border-slate-200 text-left">Alternatif (Anak)</th>
                    {#each kriteriaList as k, i}
                      <th class="p-2 border border-slate-200">
                        C{k.urutan || i+1}<br/>
                        <span class="text-[9px] uppercase font-normal text-slate-500">({k.jenis})</span>
                      </th>
                    {/each}
                  </tr>
                </thead>
                <tbody>
                  {#each mooraDetail.lengkap as baris}
                    <tr>
                      <td class="p-2 border border-slate-200 text-left font-bold text-slate-800 bg-slate-50/50">
                        {baris.nama}
                      </td>
                      {#each baris.nilai as val}
                        {@const kat = getKategoriNilai(val)}
                        <td class="p-2 border border-slate-200 font-medium text-slate-700">
                          <span class="inline-block px-2 py-0.5 rounded font-bold border {kat.bgClass} {kat.textClass} {kat.borderClass}" title="Kategori: {kat.label}">
                            {val}
                          </span>
                        </td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            {#if mooraDetail.belumLengkap.length > 0}
              <div class="bg-amber-50/60 border border-amber-200 p-3 rounded-lg text-amber-900 space-y-1">
                <p class="font-bold">Catatan Anak Belum Lengkap (Dikecualikan dari Ranking MOORA):</p>
                <ul class="list-disc pl-4 text-[11px] space-y-0.5">
                  {#each mooraDetail.belumLengkap as anak}
                    <li><strong>{anak.nama}</strong> — baru menjawab {anak.terjawab} dari {anak.total} indikator.</li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- B2: PEMBAGI TIAP KRITERIA -->
      <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <button
          type="button"
          on:click={() => toggleStep('B2')}
          class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-bold text-xs text-slate-800 transition"
        >
          <span class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">B2</span>
            Pembagi Tiap Kriteria (√(Σ xᵢⱼ²))
          </span>
          {#if openSteps.B2}<ChevronUp class="w-4 h-4 text-slate-400" />{:else}<ChevronDown class="w-4 h-4 text-slate-400" />{/if}
        </button>

        {#if openSteps.B2}
          <div class="p-4 space-y-3 bg-white border-t border-slate-200 text-xs">
            <p class="text-slate-600">Akar dari jumlah kuadrat seluruh nilai anak pada kriteria tersebut.</p>
            <div class="space-y-2 font-mono text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100">
              {#each kriteriaList as k, j}
                {@const rawValues = mooraDetail.lengkap.map(b => b.nilai[j])}
                <div class="pb-1.5 border-b border-slate-200/60 last:border-0">
                  <strong>C{k.urutan || j+1} ({k.nama})</strong> = √( {rawValues.map(v => `${v}^2`).join(' + ')} ) = <strong>{(mooraDetail.pembagi[j] ?? 0).toFixed(3)}</strong>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- B3: NORMALISASI MATRIKS -->
      <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <button
          type="button"
          on:click={() => toggleStep('B3')}
          class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-bold text-xs text-slate-800 transition"
        >
          <span class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">B3</span>
            Normalisasi Matriks (x*ᵢⱼ)
          </span>
          {#if openSteps.B3}<ChevronUp class="w-4 h-4 text-slate-400" />{:else}<ChevronDown class="w-4 h-4 text-slate-400" />{/if}
        </button>

        {#if openSteps.B3}
          <div class="p-4 space-y-4 bg-white border-t border-slate-200 text-xs">
            <p class="text-slate-600">Rumus: x*ᵢⱼ = xᵢⱼ / pembagiⱼ. Contoh substitusi anak pertama ({mooraDetail.lengkap[0]?.nama}), kriteria C1: 
              {mooraDetail.lengkap[0]?.nilai[0]} / {mooraDetail.pembagi[0]} = <strong>{(mooraDetail.normalisasi[0]?.[0] ?? 0).toFixed(3)}</strong>
            </p>
            <div class="overflow-x-auto">
              <table class="w-full text-center border-collapse border border-slate-200">
                <thead>
                  <tr class="bg-slate-50 text-slate-600 font-bold">
                    <th class="p-2 border border-slate-200 text-left">Alternatif</th>
                    {#each kriteriaList as k, i}
                      <th class="p-2 border border-slate-200">C{k.urutan || i+1}</th>
                    {/each}
                  </tr>
                </thead>
                <tbody>
                  {#each mooraDetail.lengkap as baris, idx}
                    <tr>
                      <td class="p-2 border border-slate-200 text-left font-bold text-slate-800 bg-slate-50/50">
                        {baris.nama}
                      </td>
                      {#each (mooraDetail.normalisasi[idx] || []) as val}
                        <td class="p-2 border border-slate-200 font-medium text-slate-700">{val.toFixed(3)}</td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
      </div>

      <!-- B4: NORMALISASI TERBOBOT -->
      <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <button
          type="button"
          on:click={() => toggleStep('B4')}
          class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-bold text-xs text-slate-800 transition"
        >
          <span class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">B4</span>
            Matriks Normalisasi Terbobot (yᵢⱼ)
          </span>
          {#if openSteps.B4}<ChevronUp class="w-4 h-4 text-slate-400" />{:else}<ChevronDown class="w-4 h-4 text-slate-400" />{/if}
        </button>

        {#if openSteps.B4}
          <div class="p-4 space-y-4 bg-white border-t border-slate-200 text-xs">
            <p class="text-slate-600">Rumus: yᵢⱼ = wⱼ × x*ᵢⱼ. Menggunakan bobot AHP (wⱼ). Contoh substitusi anak pertama, kriteria C1: 
              {(bobot[0] ?? 0).toFixed(3)} × {(mooraDetail.normalisasi[0]?.[0] ?? 0).toFixed(3)} = <strong>{(mooraDetail.berbobot[0]?.[0] ?? 0).toFixed(3)}</strong>
            </p>
            <div class="overflow-x-auto">
              <table class="w-full text-center border-collapse border border-slate-200">
                <thead>
                  <tr class="bg-blue-50 text-blue-900 font-bold">
                    <th class="p-2 border border-slate-200 text-left">Bobot AHP (wⱼ)</th>
                    {#each kriteriaList as k, j}
                      <th class="p-2 border border-slate-200">{(bobot[j] ?? 0).toFixed(3)}</th>
                    {/each}
                  </tr>
                  <tr class="bg-slate-50 text-slate-600 font-bold">
                    <th class="p-2 border border-slate-200 text-left">Alternatif</th>
                    {#each kriteriaList as k, i}
                      <th class="p-2 border border-slate-200">C{k.urutan || i+1}</th>
                    {/each}
                  </tr>
                </thead>
                <tbody>
                  {#each mooraDetail.lengkap as baris, idx}
                    <tr>
                      <td class="p-2 border border-slate-200 text-left font-bold text-slate-800 bg-slate-50/50">
                        {baris.nama}
                      </td>
                      {#each (mooraDetail.berbobot[idx] || []) as val}
                        <td class="p-2 border border-slate-200 font-medium text-slate-700">{val.toFixed(3)}</td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
      </div>

      <!-- B5: NILAI OPTIMASI Yi -->
      <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <button
          type="button"
          on:click={() => toggleStep('B5')}
          class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-bold text-xs text-slate-800 transition"
        >
          <span class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">B5</span>
            Nilai Optimasi (Yᵢ)
          </span>
          {#if openSteps.B5}<ChevronUp class="w-4 h-4 text-slate-400" />{:else}<ChevronDown class="w-4 h-4 text-slate-400" />{/if}
        </button>

        {#if openSteps.B5}
          <div class="p-4 space-y-3 bg-white border-t border-slate-200 text-xs">
            <p class="text-slate-600">Rumus: Yᵢ = Σ (Benefit) − Σ (Cost). Berikut rincian substitusi per anak:</p>
            <div class="space-y-2 font-mono text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100">
              {#each mooraDetail.hasilAkhir.filter(b => b.lengkap) as baris}
                <div class="pb-1.5 border-b border-slate-200/60 last:border-0">
                  <strong>{baris.nama}</strong>: 
                  Benefit ({baris.benefitSum.toFixed(3)}) - Cost ({baris.costSum.toFixed(3)}) = <strong class="text-blue-700">Yi = {baris.yi.toFixed(3)}</strong>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- B6: RANKING AKHIR -->
      <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <button
          type="button"
          on:click={() => toggleStep('B6')}
          class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-bold text-xs text-slate-800 transition"
        >
          <span class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">B6</span>
            Ranking Akhir Prioritas Stimulasi
          </span>
          {#if openSteps.B6}<ChevronUp class="w-4 h-4 text-slate-400" />{:else}<ChevronDown class="w-4 h-4 text-slate-400" />{/if}
        </button>

        {#if openSteps.B6}
          <div class="p-4 space-y-4 bg-white border-t border-slate-200 text-xs">
            <p class="text-slate-600">Diurutkan dari nilai Yᵢ terbesar ke terkecil. Nilai sama mendapat peringkat yang sama.</p>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr class="bg-slate-50 text-slate-600 font-bold uppercase">
                    <th class="p-2.5 border border-slate-200 w-16 text-center">Ranking</th>
                    <th class="p-2.5 border border-slate-200">Nama Anak</th>
                    <th class="p-2.5 border border-slate-200 w-28">NIS</th>
                    <th class="p-2.5 border border-slate-200 w-32 text-right">Nilai Optimasi (Yᵢ)</th>
                  </tr>
                </thead>
                <tbody>
                  {#each mooraDetail.hasilAkhir as baris}
                    <tr class={baris.ranking === 1 ? 'bg-blue-50/50 font-bold' : ''}>
                      <td class="p-2.5 border border-slate-200 text-center">
                        {#if baris.ranking !== null}
                          <span class={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${baris.ranking === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                            {baris.ranking}
                          </span>
                        {:else}
                          <span class="text-slate-400">—</span>
                        {/if}
                      </td>
                      <td class="p-2.5 border border-slate-200 font-bold text-slate-800">{baris.nama}</td>
                      <td class="p-2.5 border border-slate-200 font-mono text-slate-600">{baris.nis || '—'}</td>
                      <td class="p-2.5 border border-slate-200 text-right font-extrabold text-slate-900">
                        {baris.yi !== null ? baris.yi.toFixed(3) : '—'}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
