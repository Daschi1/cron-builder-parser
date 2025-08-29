<script lang="ts">
  let {
    as = "div",
    class: className = "",
    id,
    children
  } = $props<{
    as?: "div" | "section" | "main" | "header" | "footer" | "nav";
    class?: string;
    id?: string;
    children?: () => unknown;
  }>();
  const Tag = as as unknown as keyof HTMLElementTagNameMap;
</script>

<svelte:element this={Tag} {id} class={`mx-auto w-full max-w-screen-lg px-4 ${className}`}>
  {@render children?.()}
</svelte:element>
