<script lang="ts">
  type ChildrenFn = (() => unknown) | undefined;
  let { class: className = '', id = undefined, children } = $props<{ class?: string; id?: string; children?: ChildrenFn }>();
</script>

<div id={id} class={`rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-xl p-4 ${className}`}>
  {@render children?.()}
</div>
