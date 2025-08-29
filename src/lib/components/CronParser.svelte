<script lang="ts">
  import { parseCron } from "$lib/utils/cron";
  import Card from "$lib/ui/Card.svelte";
  import Input from "$lib/ui/Input.svelte";
  import Button from "$lib/ui/Button.svelte";
  import SectionLabel from "$lib/ui/SectionLabel.svelte";

  let input = $state<string>("");
  const result = $derived(input.trim().length ? parseCron(input) : null);

  function clearInput() {
    input = "";
  }
</script>

<section id="parser" class="space-y-4">
  <SectionLabel>Parser</SectionLabel>

  <Card class="space-y-3">
    <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
      <div class="text-sm font-semibold text-slate-300">
        <label for="cron-input" class="sr-only">Cron</label>
        Cron
      </div>
      <div>
        <div class="flex items-center gap-2">
          <Input
            id="cron-input"
            placeholder="e.g. 30 1 * * *"
            bind:value={input}
            ariaInvalid={!!(result && !result.ok)}
          />
          <Button title="Clear input" ariaLabel="Clear input" onclick={clearInput}>Clear</Button>
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
  </Card>
</section>
