<script lang="ts">
  import Card from "$lib/ui/Card.svelte";
  import Input from "$lib/ui/Input.svelte";
  import Button from "$lib/ui/Button.svelte";
  import LinkButton from "$lib/ui/LinkButton.svelte";
  import SectionLabel from "$lib/ui/SectionLabel.svelte";
  import type { PageData } from "./$types";
  import type { LicensePkg, LicensesFile } from "./+page";
  import { sanitizeUrl } from "$lib/utils/url";

  let { data } = $props<{ data: PageData }>();
  let q = $state("");

  const licenses: LicensesFile | null = $derived(data.licenses as LicensesFile | null);
  const total = $derived(() => licenses?.stats?.counts?.final ?? licenses?.packages?.length ?? 0);

  const filtered = $derived((): LicensePkg[] => {
    const list = (licenses?.packages ?? []) as LicensePkg[];
    if (!q) return list;
    const needle = q.toLowerCase();
    return list.filter((p: LicensePkg) => {
      const hay: string[] = [
        p.name,
        p.version,
        p.license ?? "",
        p.repository ?? "",
        p.homepage ?? "",
        p.author ?? "",
        p.description ?? ""
      ];
      return hay.some((s) => s.toLowerCase().includes(needle));
    });
  });

  function countIfArray(x: unknown): number | null {
    return Array.isArray(x) ? x.length : null;
  }

  // Format date/time in the user's locale using Intl.DateTimeFormat
  const locale = typeof navigator !== "undefined" ? navigator.language : undefined;
  const dtf = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  function formatDate(value: string | number | Date): string {
    try {
      const d = value instanceof Date ? value : new Date(value);
      if (isNaN(d.getTime())) return String(value);
      return dtf.format(d);
    } catch {
      return String(value ?? "");
    }
  }
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
            <p class="text-lg font-semibold">{total()}</p>
          </div>
          <div>
            <p class="text-sm text-slate-300">Generated</p>
            <p class="text-lg font-semibold">{formatDate(licenses.generatedAt)}</p>
          </div>
        </div>
      </Card>

      <SectionLabel>Packages</SectionLabel>
      <div class="flex items-center gap-2">
        <div class="flex flex-1 items-center gap-2">
          <Input
            id="licenses-search"
            type="search"
            placeholder="Search name, license, repo, homepage, author..."
            bind:value={q}
          />
          <Button title="Clear input" ariaLabel="Clear input" onclick={() => (q = "")}>Clear</Button
          >
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
          <div class="flex min-h-16 items-center p-4">
            <p class="text-sm text-slate-400">No packages match your search.</p>
          </div>
        {:else}
          <ul>
            {#each filtered() as p (p.id)}
              <li class="min-h-16 border-b border-neutral-900 p-4 last:border-b-0">
                <div class="flex flex-col gap-1">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <p class="font-mono text-slate-100">
                      {p.name}<span class="text-slate-500">@</span>{p.version}
                    </p>
                    <span
                      class="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-xs text-slate-300"
                      >{p.license ?? "N/A"}</span
                    >
                  </div>
                  <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    {#if sanitizeUrl(p.repository)}
                      <a
                        class="text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
                        href={sanitizeUrl(p.repository)}
                        target="_blank"
                        rel="noopener noreferrer">repo</a
                      >
                    {/if}
                    {#if sanitizeUrl(p.homepage)}
                      <a
                        class="text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
                        href={sanitizeUrl(p.homepage)}
                        target="_blank"
                        rel="noopener noreferrer">homepage</a
                      >
                    {/if}
                    {#if p.author}
                      <span>by {p.author}</span>
                    {/if}
                    {#if p.publisherEmail}
                      <span class="text-slate-500">{p.publisherEmail}</span>
                    {/if}
                    {#if countIfArray(p.maintainers) !== null}
                      <span class="rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5"
                        >maintainers: {countIfArray(p.maintainers)}</span
                      >
                    {:else if p.maintainers}
                      <span class="rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5"
                        >maintainers</span
                      >
                    {/if}
                  </div>
                  {#if p.description}
                    <p class="mt-1 text-xs text-slate-400">{p.description}</p>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </Card>
    </div>
  {/if}
</section>
