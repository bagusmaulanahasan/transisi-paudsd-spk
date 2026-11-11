<script>
  import Select from './Select.svelte';
  import {
    OPSI_TAMPILAN_NAMA,
    simpanTampilanNama,
    tampilanNamaAktif
  } from '$lib/stores/tampilanNama';

  export let className = 'w-44';

  /**
   * Menyimpan pilihan tampilan nama ke store (sekaligus localStorage).
   * @param {Event & { currentTarget: HTMLSelectElement }} event
   */
  function gantiTampilan(event) {
    simpanTampilanNama(event.currentTarget.value);
  }
</script>

<Select
  label="Tampilkan sebagai"
  value={$tampilanNamaAktif}
  options={OPSI_TAMPILAN_NAMA}
  placeholder=""
  {className}
  on:change={gantiTampilan}
/>
