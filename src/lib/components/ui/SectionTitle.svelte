<script lang="ts">
  type ChildrenFn = (() => unknown) | undefined;
  let { class: className = '', children } = $props<{ class?: string; children?: ChildrenFn }>();
</script>

<p class={`text-xs uppercase tracking-wider text-slate-400 mb-2 ${className}`}>
  {@render children?.()}
</p>
