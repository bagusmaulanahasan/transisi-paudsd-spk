<script>
  export let className = '';
  export let padding = 'p-6';
</script>

<div class={`bg-white rounded-2xl border border-slate-200/80 shadow-sm ${padding} ${className}`}>
  <slot />
</div>
