<script lang="ts">
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

<button
  type="button"
  class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm font-semibold transition-colors hover:brightness-110 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none"
  {title}
  onclick={copy}
>
  {label}
</button>
{#if status}
  <span class="ml-2 text-xs text-emerald-400" role="status" aria-live="polite">{status}</span>
{/if}
