<script lang="ts">
  type ChildrenFn = (() => unknown) | undefined;
  let { class: className = '', children } = $props<{ class?: string; children?: ChildrenFn }>();
</script>

<div class={`rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-300 ${className}`}>
  {@render children?.()}
</div>
