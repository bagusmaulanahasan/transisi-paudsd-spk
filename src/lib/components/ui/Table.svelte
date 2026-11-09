<script>
  import EmptyState from './EmptyState.svelte';

  export let columns = []; // Array of { key, label, class }
  export let data = []; // Array of items
  export let emptyText = 'Tidak ada data';
  export let emptyDescription = 'Belum ada data yang tersedia untuk ditampilkan.';
  export let className = '';
</script>

<div class={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`}>
  <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold text-xs uppercase tracking-wider">
          {#each columns as col}
            <th class={`px-6 py-4 font-extrabold ${col.class || ''}`}>
              {col.label}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 text-xs font-medium text-slate-700">
        {#if data && data.length > 0}
          {#each data as item, index}
            <tr class="hover:bg-slate-50/60 transition-colors">
              {#each columns as col, colIndex}
                <td class={`px-6 py-4 whitespace-nowrap ${col.class || ''}`}>
                  {#if col.key === 'aksi'}
                    <slot name="aksi" {item} {index} />
                  {:else if col.key === 'status'}
                    <slot name="status" {item} {index} />
                  {:else if col.key === 'poin'}
                    <slot name="poin" {item} {index} />
                  {:else if col.key === 'keterangan'}
                    <slot name="keterangan" {item} {index} />
                  {:else if col.key === 'opsi'}
                    <slot name="opsi" {item} {index} />
                  {:else if col.key === 'no'}
                    <slot name="no" {item} {index} />
                  {:else if col.key === 'inisial'}
                    <slot name="inisial" {item} {index} />
                  {:else if col.key === 'nama'}
                    <slot name="nama" {item} {index} />
                  {:else if col.key === 'jenis'}
                    <slot name="jenis" {item} {index} />
                  {:else if col.key === 'bobot'}
                    <slot name="bobot" {item} {index} />
                  {:else if col.key === 'aksi_mobile'}
                    <slot name="aksi_mobile" {item} {index} />
                  {:else}
                    {item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-'}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        {:else}
          <tr>
            <td colspan={columns.length} class="p-0">
              <EmptyState title={emptyText} description={emptyDescription} className="border-0 shadow-none rounded-none py-12" />
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>
