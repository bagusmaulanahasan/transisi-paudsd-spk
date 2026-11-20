<script>
  import Card from '$lib/components/ui/Card.svelte';
  import { CheckCircle2, AlertCircle, ClipboardList, Filter } from 'lucide-svelte';
  import { getKategoriNilai } from '$lib/spk/moora';
  import KriteriaPenilaianTabel from './KriteriaPenilaianTabel.svelte';
  import KriteriaPenilaianForm from './KriteriaPenilaianForm.svelte';

  export let kriteriaList = [];
  export let indikatorPerKriteria = [];
  export let opsiList = [];
  export let bobot = [];
  export let modeEdit = false;
  export let readOnly = false;
  export let menyimpan = null;
  export let jawabanAnakMap = {};
  export let opsiMap = {};
  export let terjawabAnak = 0;
  export let jumlahIndikator = 0;
  export let statusLokal = {};
  export let onPilihJawaban = () => {};

  /** Filter capaian (aktif di mode lihat dan edit): 'semua' | 'kosong' | id opsi (string). */
  let filterCapaian = 'semua';

  /** Pembulatan half-up 4 desimal, sama dengan bulat() di moora.js. */
  function bulat(nilai) {
    return (Math.sign(nilai) * Math.round((Math.abs(nilai) + Number.EPSILON) * 10000)) / 10000;
  }

  /**
   * Ringkasan per kriteria. Nilai = rata-rata poin seluruh indikator kriteria
   * (sama dengan susunMatriksKeputusan di moora.js), hanya ditampilkan bila
   * kriteria sudah lengkap agar angkanya sama dengan yang masuk ke ranking.
   * Selalu dihitung dari semua indikator, tidak terpengaruh filter.
   */
  function ringkas(kriteria, jawaban) {
    const daftar = kriteria?.indikator || [];
    const terjawab = daftar.filter((indikator) => jawaban[indikator.id]);
    const lengkap = daftar.length > 0 && terjawab.length === daftar.length;
    const total = terjawab.reduce((sum, indikator) => sum + Number(jawaban[indikator.id]?.poin ?? 0), 0);
    const nilai = lengkap ? bulat(total / daftar.length) : null;

    return {
      terisi: terjawab.length,
      jumlah: daftar.length,
      nilai,
      kategori: getKategoriNilai(nilai)
    };
  }

  $: ringkasan = indikatorPerKriteria.map((kriteria) => ringkas(kriteria, jawabanAnakMap));

  // ---- Filter capaian ----
  // Urutan dropdown: dari poin terkecil (belum bisa) ke terbesar (sudah bisa).
  $: opsiUrut = [...opsiList].sort((a, b) => Number(a.poin) - Number(b.poin));

  $: semuaIndikator = indikatorPerKriteria.flatMap((kriteria) => kriteria.indikator || []);

  // Jumlah indikator per pilihan filter (selalu dari seluruh indikator, ikut berubah saat menilai).
  $: jumlah = (() => {
    const perOpsi = {};
    let kosong = 0;
    for (const indikator of semuaIndikator) {
      const jawaban = jawabanAnakMap[indikator.id];
      if (!jawaban) {
        kosong += 1;
      } else {
        perOpsi[jawaban.opsi_jawaban_id] = (perOpsi[jawaban.opsi_jawaban_id] || 0) + 1;
      }
    }
    return { semua: semuaIndikator.length, kosong, perOpsi };
  })();

  function cocok(indikator, jawaban, filter) {
    if (filter === 'semua') return true;
    const item = jawaban[indikator.id];
    if (filter === 'kosong') return !item;
    return item ? String(item.opsi_jawaban_id) === filter : false;
  }

  function ambilDaftarTampil(daftarKriteria, filter) {
    return daftarKriteria.map(
      (kriteria) =>
        new Set(
          (kriteria.indikator || [])
            .filter((indikator) => cocok(indikator, jawabanAnakMap, filter))
            .map((indikator) => indikator.id)
        )
    );
  }

  // Mode lihat: daftar tampil mengikuti jawaban secara langsung.
  $: tampilLangsung = indikatorPerKriteria.map(
    (kriteria) =>
      new Set(
        (kriteria.indikator || [])
          .filter((indikator) => cocok(indikator, jawabanAnakMap, filterCapaian))
          .map((indikator) => indikator.id)
      )
  );

  // Mode edit: daftar "dikunci" saat masuk mode edit atau saat filter diganti, supaya indikator
  // yang baru dinilai tidak langsung hilang. Sengaja TIDAK bergantung pada jawabanAnakMap:
  // jawabanAnakMap dibaca di dalam ambilDaftarTampil(), bukan di pernyataan reaktif ini.
  $: tampilTerkunci = modeEdit ? ambilDaftarTampil(indikatorPerKriteria, filterCapaian) : null;

  $: tampil = modeEdit && tampilTerkunci ? tampilTerkunci : tampilLangsung;
  $: totalTampil = tampil.reduce((sum, set) => sum + set.size, 0);
</script>

<Card className="overflow-hidden p-0">
  <div class="pb-4 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <ClipboardList class="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h2 class="text-lg font-bold text-slate-900 tracking-tight">Jawaban Penilaian</h2>
        <p class="text-xs text-slate-500 mt-1 leading-relaxed">
          {#if readOnly}
            Mode hanya baca — Kepala Sekolah dapat melihat jawaban tanpa mengubahnya.
          {:else if modeEdit}
            Mode edit — setiap jawaban yang dipilih langsung tersimpan otomatis.
          {:else}
            Mode lihat — tekan Edit Penilaian untuk mengubah jawaban.
          {/if}
        </p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap">
        Ternilai {terjawabAnak}/{jumlahIndikator} Indikator
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

      {#if kriteriaList.length > 0}
        <div class="relative w-full sm:w-auto">
          <Filter class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            bind:value={filterCapaian}
            aria-label="Filter capaian"
            class="w-full sm:w-52 h-9 pl-9 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
          >
            <option value="semua">Semua ({jumlah.semua})</option>
            <option disabled>──────────</option>
            {#each opsiUrut as opsi (opsi.id)}
              <option value={String(opsi.id)}>{opsi.opsi} ({jumlah.perOpsi[opsi.id] ?? 0})</option>
            {/each}
            <option disabled>──────────</option>
            <option value="kosong">Belum dinilai ({jumlah.kosong})</option>
          </select>
        </div>
      {/if}
    </div>
  </div>

  <div class="mt-4 md:p-6 space-y-8">
    {#if kriteriaList.length === 0}
      <p class="text-sm text-slate-500">Belum ada kriteria penilaian.</p>
    {:else if filterCapaian !== 'semua' && totalTampil === 0}
      <p class="text-sm text-slate-500">Tidak ada indikator dengan capaian ini.</p>
    {:else}
      {#if modeEdit && filterCapaian !== 'semua'}
        <p class="text-[11px] font-medium text-slate-500 leading-relaxed -mb-4">
          Indikator yang baru dinilai tetap tampil sampai filter diganti atau Anda menekan Selesai.
        </p>
      {/if}

      {#each indikatorPerKriteria as kriteria, kriteriaIndex (kriteria.id)}
        {@const info = ringkasan[kriteriaIndex] ?? { terisi: 0, jumlah: 0, nilai: null, kategori: getKategoriNilai(null) }}
        {#if filterCapaian === 'semua' || tampil[kriteriaIndex]?.size > 0}
          <section class="space-y-3">
            <!-- Judul kriteria: kiri = nama kriteria, kanan = ternilai & nilai -->
            <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-slate-100 pb-3">
              <div class="flex items-center gap-2 min-w-0">
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                  {kriteria.inisial}
                </span>
                <h3 class="text-sm font-bold text-slate-900">{kriteria.nama}</h3>
              </div>
              <div class="flex items-center gap-2 text-[11px] font-semibold whitespace-nowrap">
                <span class="text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Ternilai {info.terisi}/{info.jumlah} Indikator
                </span>
                <span class="px-2.5 py-1 rounded-lg border {info.kategori.badgeClass}">
                  Nilai {info.nilai !== null ? info.nilai.toFixed(4) : '—'}
                  {#if info.nilai !== null}· {info.kategori.label}{/if}
                </span>
              </div>
            </div>

            {#if modeEdit}
              <KriteriaPenilaianForm
                {kriteria}
                {opsiList}
                {menyimpan}
                {jawabanAnakMap}
                {statusLokal}
                {onPilihJawaban}
                filterId={filterCapaian === 'semua' ? null : tampil[kriteriaIndex]}
              />
            {:else}
              <KriteriaPenilaianTabel
                {kriteria}
                {opsiList}
                {jawabanAnakMap}
                filterId={filterCapaian === 'semua' ? null : tampil[kriteriaIndex]}
              />
            {/if}
          </section>
        {/if}
      {/each}
    {/if}
  </div>

  <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
    <p class="text-[11px] text-slate-500 font-medium leading-relaxed">
      {#if readOnly}
        Tampilan hanya baca untuk Kepala Sekolah. Jawaban hanya dapat diubah oleh Tim Pendidik.
      {:else if modeEdit}
        Jawaban disimpan otomatis setiap kali dipilih. Nilai Yi dan ranking seluruh anak di kelas ini ikut diperbarui.
      {:else}
        Tampilan ini hanya untuk melihat hasil. Tekan tombol Edit Penilaian di atas untuk mengubah jawaban.
      {/if}
    </p>
  </div>
</Card>