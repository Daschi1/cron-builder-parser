<script lang="ts">
  let {
    as = "h2",
    class: className = "",
    children
  } = $props<{
    as?: "h2" | "h3" | "p" | "div" | "span";
    class?: string;
    children?: () => unknown;
  }>();
  const Tag = as as unknown as keyof HTMLElementTagNameMap;
</script>

<svelte:element this={Tag} class={`text-xs tracking-widest text-slate-400 uppercase ${className}`}>
  {@render children?.()}
</svelte:element>
