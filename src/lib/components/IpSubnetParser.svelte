<script lang="ts">
  import Card from "$lib/ui/Card.svelte";
  import Input from "$lib/ui/Input.svelte";
  import Button from "$lib/ui/Button.svelte";
  import CopyButton from "$lib/ui/CopyButton.svelte";
  import SectionLabel from "$lib/ui/SectionLabel.svelte";
  import { computeIPv4Subnet } from "$lib/utils/ip";

  let ip = $state<string>("");
  let mask = $state<string>("");
  const result = $derived(ip.trim() && mask.trim() ? computeIPv4Subnet(ip, mask) : null);

  function clearAll() {
    ip = "";
    mask = "";
  }
</script>

<section id="parser" class="space-y-4">
  <SectionLabel>Parser</SectionLabel>

  <Card class="space-y-3">
    <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
      <div class="text-sm font-semibold text-slate-300">
        <label for="ip-input" class="sr-only">IP Address</label>
        IP Address
      </div>
      <div class="flex items-center gap-2">
        <Input id="ip-input" placeholder="e.g. 192.168.1.10" bind:value={ip} />
      </div>
    </div>
    <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
      <div class="text-sm font-semibold text-slate-300">
        <label for="mask-input" class="sr-only">Subnet</label>
        Subnet
      </div>
      <div class="flex items-center gap-2">
        <Input
          id="mask-input"
          placeholder="e.g. /24 or 255.255.255.0"
          bind:value={mask}
          ariaInvalid={!!(result && !result.ok)}
        />
        <Button title="Clear inputs" ariaLabel="Clear inputs" onclick={clearAll}>Clear</Button>
      </div>
    </div>

    <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
      <div class="text-sm font-semibold text-slate-300">Status</div>
      <div class="text-sm">
        {#if !result}
          <span class="text-slate-400">Waiting for input...</span>
        {:else if result.ok}
          <span class="text-emerald-400">Valid IPv4 subnet.</span>
        {:else}
          <span class="text-rose-400">{result.error}</span>
        {/if}
      </div>
    </div>

    {#if result && result.ok}
      <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
        <div class="text-sm font-semibold text-slate-300">Summary</div>
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <code
            class="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 font-mono text-sm text-slate-200"
            title="Click to copy">{result.network}/{result.prefix}</code
          >
          <CopyButton text={`${result.network}/${result.prefix}`} title="Copy CIDR" />
        </div>
      </div>

      <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
        <div class="text-sm font-semibold text-slate-300">Netmask</div>
        <div class="text-sm">{result.mask} (/{result.prefix})</div>
      </div>
      <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
        <div class="text-sm font-semibold text-slate-300">Wildcard</div>
        <div class="text-sm">{result.wildcard}</div>
      </div>
      <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
        <div class="text-sm font-semibold text-slate-300">Network</div>
        <div class="text-sm">{result.network}</div>
      </div>
      <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
        <div class="text-sm font-semibold text-slate-300">Broadcast</div>
        <div class="text-sm">{result.broadcast}</div>
      </div>
      <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
        <div class="text-sm font-semibold text-slate-300">First usable</div>
        <div class="text-sm">{result.firstHost}</div>
      </div>
      <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
        <div class="text-sm font-semibold text-slate-300">Last usable</div>
        <div class="text-sm">{result.lastHost}</div>
      </div>
      <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
        <div class="text-sm font-semibold text-slate-300">Usable hosts</div>
        <div class="text-sm">{result.usable} of {result.total} total</div>
      </div>
      <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
        <div class="text-sm font-semibold text-slate-300">Range</div>
        <div class="text-sm">{result.range}</div>
      </div>
      <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
        <div class="text-sm font-semibold text-slate-300">Class</div>
        <div class="text-sm">{result.class}</div>
      </div>
      <div class="grid items-start gap-3 md:grid-cols-[220px_1fr]">
        <div class="text-sm font-semibold text-slate-300">Flags</div>
        <div class="text-sm text-slate-300">
          <ul class="list-disc pl-5">
            <li>Private (RFC1918): {result.flags.isPrivateRFC1918 ? "Yes" : "No"}</li>
            <li>Loopback: {result.flags.isLoopback ? "Yes" : "No"}</li>
            <li>Link-local: {result.flags.isLinkLocal ? "Yes" : "No"}</li>
            <li>Multicast: {result.flags.isMulticast ? "Yes" : "No"}</li>
            <li>Reserved: {result.flags.isReserved ? "Yes" : "No"}</li>
          </ul>
        </div>
      </div>
    {/if}
  </Card>
</section>
