<script lang="ts">
  import Button from "$lib/ui/Button.svelte";

  let {
    id,
    value = $bindable<string>(""),
    placeholder,
    ariaInvalid = false,
    type = "text",
    class: className = "",
    clearable = false,
    clearAriaLabel = "Clear",
    clearTitle = "Clear",
    clearButtonClass = ""
  } = $props<{
    id?: string;
    value?: string; // bindable via $bindable()
    placeholder?: string;
    ariaInvalid?: boolean;
    type?: "text" | "email" | "search" | "url" | "password";
    class?: string;
    clearable?: boolean;
    clearAriaLabel?: string;
    clearTitle?: string;
    clearButtonClass?: string;
  }>();

  let inputEl: HTMLInputElement | undefined;
  function clearInput() {
    value = "";
    // restore focus to the input for accessibility
    queueMicrotask(() => inputEl?.focus());
  }
</script>

<div class={clearable ? "relative w-full" : "contents"}>
  <input
    bind:this={inputEl}
    {id}
    {type}
    class={`w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-slate-100 transition-colors outline-none focus:ring-2 focus:ring-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none ${clearable ? "pr-10" : ""} ${className}`}
    {placeholder}
    bind:value
    spellcheck={false}
    autocomplete="off"
    aria-invalid={ariaInvalid}
  />

  {#if clearable && value}
    <Button
      type="button"
      variant="ghost"
      size="sm"
      class={`absolute top-1/2 right-1 -translate-y-1/2 ${clearButtonClass}`}
      ariaLabel={clearAriaLabel}
      title={clearTitle}
      onclick={clearInput}
    >
      ✕
    </Button>
  {/if}
</div>

<style>
  /* Hide native clear and related controls for search inputs to avoid double clear buttons */
  :global(input[type="search"]::-webkit-search-cancel-button),
  :global(input[type="search"]::-webkit-search-results-button),
  :global(input[type="search"]::-webkit-search-results-decoration),
  :global(input[type="search"]::-webkit-search-decoration) {
    -webkit-appearance: none;
    appearance: none;
    display: none;
  }
  :global(input[type="search"]::-ms-clear),
  :global(input[type="search"]::-ms-reveal) {
    display: none;
    width: 0;
    height: 0;
  }
</style>
