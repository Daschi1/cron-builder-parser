<script lang="ts">
  import Card from "$lib/ui/Card.svelte";
  import Button from "$lib/ui/Button.svelte";
  import SectionLabel from "$lib/ui/SectionLabel.svelte";
  import Input from "$lib/ui/Input.svelte";
  import CopyButton from "$lib/ui/CopyButton.svelte";
  import { computeIPv4Subnet } from "$lib/utils/ip";

  let baseIp = $state<string>("192.168.1.0");
  let prefixText = $state<string>("24");
  let hostsText = $state<string>("");

  const prefix = $derived.by(() => {
    const n = Number(prefixText.trim());
    return Number.isInteger(n) && n >= 0 && n <= 32 ? n : null;
  });

  const result = $derived.by(() =>
    prefix != null ? computeIPv4Subnet(baseIp, `/${prefix}`) : null
  );

  function resetAll() {
    baseIp = "192.168.1.0";
    prefixText = "24";
    hostsText = "";
  }

  function inc() {
    if (prefix == null) {
      prefixText = "24";
      return;
    }
    if (prefix < 32) prefixText = String(prefix + 1);
  }
  function dec() {
    if (prefix == null) {
      prefixText = "24";
      return;
    }
    if (prefix > 0) prefixText = String(prefix - 1);
  }

  function suggestFromHosts() {
    const raw = hostsText.trim();
    if (!/^[0-9]+$/.test(raw)) return;
    const hosts = Number(raw);
    let p: number;
    if (hosts <= 1)
      p = 32; // single host
    else if (hosts === 2)
      p = 31; // point-to-point
    else {
      const need = hosts + 2; // network + broadcast
      const bits = Math.ceil(Math.log2(need));
      p = 32 - bits;
      if (p < 0) p = 0;
      if (p > 30) p = 30; // limit where classic usable hosts apply
    }
    prefixText = String(p);
  }

  function selectText(ev: MouseEvent) {
    const target = ev.currentTarget as HTMLElement | null;
    if (!target) return;
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(target);
    sel?.removeAllRanges();
    sel?.addRange(range);
  }
</script>

<section id="builder" class="space-y-4">
  <SectionLabel>Builder</SectionLabel>

  <Card class="space-y-5">
    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <p class="mb-2 text-xs tracking-wider text-slate-400 uppercase">Inputs</p>
        <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
          <div class="text-sm font-semibold text-slate-300">
            <label for="base-ip" class="sr-only">Base IP</label>
            Base IP
          </div>
          <div>
            <Input id="base-ip" placeholder="e.g. 192.168.1.0" bind:value={baseIp} />
          </div>
        </div>
        <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
          <div class="text-sm font-semibold text-slate-300">
            <label for="prefix" class="sr-only">Prefix</label>
            Prefix length
          </div>
          <div class="flex items-center gap-2">
            <Input id="prefix" placeholder="0-32" bind:value={prefixText} />
            <Button
              title="Decrease prefix (larger subnet)"
              ariaLabel="Decrease prefix"
              onclick={dec}>-</Button
            >
            <Button
              title="Increase prefix (smaller subnet)"
              ariaLabel="Increase prefix"
              onclick={inc}>+</Button
            >
          </div>
        </div>
        <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
          <div class="text-sm font-semibold text-slate-300">
            <label for="hosts" class="sr-only">Hosts needed</label>
            Hosts needed
          </div>
          <div class="flex items-center gap-2">
            <Input id="hosts" placeholder="e.g. 50" bind:value={hostsText} />
            <Button
              title="Suggest prefix from hosts"
              ariaLabel="Suggest prefix from hosts"
              onclick={suggestFromHosts}>Suggest</Button
            >
          </div>
        </div>
      </div>

      <div>
        <p class="mb-2 text-xs tracking-wider text-slate-400 uppercase">Output</p>
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label="Select CIDR"
              title="Click to select"
              class="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 font-mono text-sm text-slate-200"
              onclick={selectText}
            >
              {#if result && result.ok}
                {result.network}/{result.prefix}
              {:else}
                0.0.0.0/0
              {/if}
            </button>
            {#if result && result.ok}
              <CopyButton
                text={`${result.network}/${result.prefix}`}
                label="Copy"
                title="Copy CIDR"
              />
            {/if}
          </div>
          <div class="text-sm text-emerald-200">
            {#if result && result.ok}
              Prefix /{result.prefix} — {result.usable} usable hosts ({result.total} total)
            {:else}
              <span class="text-slate-400">Enter a valid IP and prefix or use Suggest</span>
            {/if}
          </div>
          <div>
            <Button title="Reset inputs" ariaLabel="Reset inputs" onclick={resetAll}>Reset</Button>
          </div>
        </div>
      </div>
    </div>

    {#if result && result.ok}
      <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
        <div class="text-sm font-semibold text-slate-300">Network</div>
        <div class="text-sm">{result.network}</div>
      </div>
      <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
        <div class="text-sm font-semibold text-slate-300">Netmask</div>
        <div class="text-sm">{result.mask} (/{result.prefix})</div>
      </div>
      <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
        <div class="text-sm font-semibold text-slate-300">Broadcast</div>
        <div class="text-sm">{result.broadcast}</div>
      </div>
      <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
        <div class="text-sm font-semibold text-slate-300">Usable range</div>
        <div class="text-sm">{result.range}</div>
      </div>
    {/if}
  </Card>
</section>
