<script>
  import Select from './Select.svelte';
  import {
    OPSI_TAMPILAN_NAMA,
    simpanTampilanNama,
    tampilanNamaAktif,
    labelKolomNama
  } from '$lib/stores/tampilanNama';

  /** Kelas pembungkus tambahan, dipakai pada varian dropdown biasa. */
  export let className = 'w-44';

  /**
   * `default` menampilkan dropdown dengan label di atasnya,
   * `header` menampilkan dropdown ringkas yang menyatu dengan header tabel.
   */
  export let variant = 'default';

  /**
   * Menyimpan pilihan tampilan nama ke store (sekaligus localStorage).
   * @param {Event & { currentTarget: HTMLSelectElement }} event
   */
  function gantiTampilan(event) {
    simpanTampilanNama(event.currentTarget.value);
  }
</script>

{#if variant === 'header'}
  <select
    value={$tampilanNamaAktif}
    on:change={gantiTampilan}
    aria-label="Tampilkan kolom sebagai"
    title="Tampilkan kolom sebagai"
    class="w-full min-w-[8.5rem] cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-extrabold tracking-normal text-slate-700 normal-case transition hover:border-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 print:hidden"
  >
    {#each OPSI_TAMPILAN_NAMA as opsi}
      <option value={opsi.value}>{opsi.label}</option>
    {/each}
  </select>
  <span class="hidden print:inline">{labelKolomNama($tampilanNamaAktif)}</span>
{:else}
  <Select
    label="Tampilkan sebagai"
    value={$tampilanNamaAktif}
    options={OPSI_TAMPILAN_NAMA}
    placeholder=""
    {className}
    on:change={gantiTampilan}
  />
{/if}
