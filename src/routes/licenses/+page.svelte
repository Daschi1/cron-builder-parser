<script lang="ts">
  import Card from "$lib/ui/Card.svelte";
  import Input from "$lib/ui/Input.svelte";
  import LinkButton from "$lib/ui/LinkButton.svelte";
  import SectionLabel from "$lib/ui/SectionLabel.svelte";
  import type { PageData } from "./$types";
  import type { LicensePackage, LicensesPayload } from "./+page";

  let { data } = $props<{ data: PageData }>();
  let q = $state("");

  const licenses: LicensesPayload | null = $derived(data.licenses as LicensesPayload | null);
  const filtered = $derived((): LicensePackage[] => {
    const list = (licenses?.packages ?? []) as LicensePackage[];
    if (!q) return list;
    const needle = q.toLowerCase();
    return list.filter((p: LicensePackage) => {
      const hay: string[] = [p.name, p.version, p.license, p.repository ?? "", p.url ?? ""];
      return hay.some((s) => s.toLowerCase().includes(needle));
    });
  });
</script>

<section class="space-y-5 py-2">
  <h1 class="text-2xl font-semibold tracking-tight">Licenses</h1>

  {#if !licenses}
    <Card>
      <p class="text-sm text-slate-300">No license data found yet.</p>
      <p class="mt-2 text-sm text-slate-400">
        Generate it locally with
        <code class="rounded bg-neutral-900 px-1.5 py-0.5 text-emerald-300">pnpm gen:licenses</code>
        and rebuild. In CI/Docker this can run during the build.
      </p>
    </Card>
  {:else}
    <div class="space-y-4">
      <SectionLabel>Overview</SectionLabel>
      <Card>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm text-slate-300">Total packages</p>
            <p class="text-lg font-semibold">{licenses.total}</p>
          </div>
          <div>
            <p class="text-sm text-slate-300">Generated</p>
            <p class="text-lg font-semibold">{new Date(licenses.generatedAt).toLocaleString()}</p>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          {#each Object.entries(licenses.byLicense).sort( (a, b) => a[0].localeCompare(b[0]) ) as [lic, count] (lic)}
            <span
              class="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-slate-300"
            >
              <span class="font-mono text-slate-200">{lic}</span>
              <span class="rounded bg-neutral-800 px-1.5 py-0.5 text-slate-400">{count}</span>
            </span>
          {/each}
        </div>
      </Card>

      <SectionLabel>Packages</SectionLabel>
      <div class="flex items-center gap-2">
        <div class="flex-1">
          <Input placeholder="Search by name, license, repo..." bind:value={q} />
        </div>
        <LinkButton
          href="/licenses.json"
          target="_blank"
          ariaLabel="Open raw JSON"
          title="Open raw JSON"
        >
          View JSON
        </LinkButton>
      </div>

      <Card class="p-0">
        {#if filtered().length === 0}
          <p class="p-4 text-sm text-slate-400">No packages match your search.</p>
        {:else}
          <ul>
            {#each filtered() as p (p.name + "@" + p.version)}
              <li class="border-b border-neutral-900 p-4 last:border-b-0">
                <div class="flex flex-col gap-1">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <p class="font-mono text-slate-100">
                      {p.name}<span class="text-slate-500">@</span>{p.version}
                    </p>
                    <span
                      class="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-xs text-slate-300"
                      >{p.license}</span
                    >
                  </div>
                  <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    {#if p.repository}
                      <a
                        class="text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
                        href={p.repository}
                        target="_blank"
                        rel="noopener noreferrer">repo</a
                      >
                    {/if}
                    {#if p.url}
                      <a
                        class="text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer">homepage</a
                      >
                    {/if}
                    {#if p.publisher}
                      <span>by {p.publisher}</span>
                    {/if}
                  </div>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </Card>
    </div>
  {/if}
</section>
