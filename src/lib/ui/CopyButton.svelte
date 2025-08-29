<script lang="ts">
  import Button from "$lib/ui/Button.svelte";
  let {
    text,
    label = "Copy",
    title = "Copy to clipboard"
  } = $props<{
    text: string;
    label?: string;
    title?: string;
  }>();
  let status = $state<string>("");
  let timer: ReturnType<typeof setTimeout> | null = null;

  function resetAfter(ms: number) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      status = "";
      timer = null;
    }, ms);
  }

  async function copy() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    try {
      await navigator.clipboard.writeText(text);
      status = "Copied";
      resetAfter(1500);
    } catch {
      status = "Copy failed";
      resetAfter(2000);
    }
  }
</script>

<Button onclick={copy} {title}>
  {label}
</Button>
{#if status}
  <span class="ml-2 text-xs text-emerald-400" role="status" aria-live="polite">{status}</span>
{/if}
