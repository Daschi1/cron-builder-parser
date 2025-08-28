<script lang="ts">
  import { parseCron } from "$lib/utils/cron";

  let input = $state<string>("");
  const result = $derived(input.trim().length ? parseCron(input) : null);

  function clearInput() {
    input = "";
  }
</script>

<section id="parser" class="space-y-4">
  <h2 class="text-xs tracking-widest text-slate-400 uppercase">Parser</h2>

  <div class="space-y-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
    <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
      <div class="text-sm font-semibold text-slate-300">
        <label for="cron-input" class="sr-only">Cron</label>
        Cron
      </div>
      <div>
        <div class="flex items-center gap-2">
          <input
            id="cron-input"
            class="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-slate-100 transition-colors outline-none focus:ring-2 focus:ring-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none"
            placeholder="e.g. 30 1 * * *"
            bind:value={input}
            spellcheck={false}
            autocomplete="off"
            aria-invalid={result && !result.ok}
          />
          <button
            type="button"
            class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm font-semibold transition-colors hover:brightness-110 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none"
            title="Clear input"
            aria-label="Clear input"
            onclick={clearInput}
            >Clear
          </button>
        </div>
      </div>
    </div>
    <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
      <div class="text-sm font-semibold text-slate-300">Status</div>
      <div class="text-sm">
        {#if !result}
          <span class="text-slate-400">Waiting for input...</span>
        {:else if result.ok}
          <span class="text-emerald-400">Valid POSIX cron.</span>
        {:else}
          <span class="text-rose-400">{result.error}</span>
        {/if}
      </div>
    </div>
    <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
      <div class="text-sm font-semibold text-slate-300">Human description</div>
      <div class="text-emerald-200">
        {#if result && result.ok}
          {result.human}
        {:else}
          <span class="text-slate-400">-</span>
        {/if}
      </div>
    </div>
  </div>
</section>
