<script lang="ts">
  let {
    as = "div",
    class: className = "",
    children
  } = $props<{
    as?: "div" | "section" | "article" | "aside";
    class?: string;
    children?: () => unknown;
  }>();
  const Tag = as as unknown as keyof HTMLElementTagNameMap;
</script>

<svelte:element
  this={Tag}
  class={`rounded-xl border border-neutral-800 bg-neutral-950 p-4 ${className}`}
>
  {@render children?.()}
</svelte:element>
