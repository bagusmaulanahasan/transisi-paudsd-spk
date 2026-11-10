<script>
  export let title = '';
  export let subtitle = '';
</script>

<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
  <div>
    <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
    {#if subtitle}
      <p class="text-sm text-slate-500 mt-1 font-medium">{subtitle}</p>
    {/if}
    <slot name="description" />
  </div>
  
  {#if $$slots.action}
    <div class="flex items-center space-x-3">
      <slot name="action" />
    </div>
  {/if}
</div>
