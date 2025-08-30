<script lang="ts">
  import type { FieldSpec } from "$lib/utils/cron";
  import { toggleValue, setEvery } from "$lib/utils/cron";
  import { onMount, tick } from "svelte";

  let {
    title,
    spec = $bindable<FieldSpec>(),
    min,
    max,
    labels = null
  } = $props<{
    title: string;
    spec?: FieldSpec; // bindable via $bindable()
    min: number;
    max: number;
    labels?: string[] | null;
  }>();

  type Item = {
    key: string;
    type: "every" | "value";
    value?: number;
    text: string; // visible text
    title: string; // tooltip
  };

  let containerEl: HTMLDivElement | null = null;
  let measureEl: HTMLDivElement | null = null;
  let rows: number[][] = $state([]);
  let items: Item[] = $state([]);
  let widths: number[] = $state([]);
  let containerWidth = $state(0);

  const GAP_PX = 8; // Tailwind gap-2

  function buildItems(): Item[] {
    const out: Item[] = [];
    out.push({
      key: "every",
      type: "every",
      text: "Every *",
      title: "Every *"
    });
    for (let v = min; v <= max; v++) {
      const label = labels && labels[v - min] ? `${labels[v - min]} (${v})` : String(v);
      out.push({
        key: `v-${v}`,
        type: "value",
        value: v,
        text: label,
        title: labels && labels[v - min] ? `${labels[v - min]} (${v})` : `${v}`
      });
    }
    return out;
  }

  async function measure() {
    if (!measureEl) return;
    // Ensure DOM is updated
    await tick();
    const btns = Array.from(measureEl.querySelectorAll("button"));
    widths = btns.map((b) => Math.ceil(b.getBoundingClientRect().width));
  }

  function packRows() {
    if (!containerWidth || widths.length !== items.length) {
      rows = [items.map((_, i) => i)];
      return;
    }
    const maxWidth = containerWidth;
    const out: number[][] = [];
    let i = 0;
    let prevRowWidth = Number.POSITIVE_INFINITY;
    while (i < items.length) {
      let row: number[] = [];
      let used = 0;
      const limit = Math.min(maxWidth, prevRowWidth);
      while (i < items.length) {
        const w = widths[i];
        const nextUsed = row.length === 0 ? w : used + GAP_PX + w;
        if (nextUsed <= limit) {
          row.push(i);
          used = nextUsed;
          i++;
        } else {
          break;
        }
      }
      if (row.length === 0) {
        // Fallback to place one item to avoid infinite loop
        row.push(i);
        used = widths[i] || 0;
        i++;
      }
      out.push(row);
      prevRowWidth = used;
    }
    rows = out;
  }

  function recalc() {
    items = buildItems();
  }

  let ro: ResizeObserver | null = null;
  onMount(() => {
    recalc();
    // Observe container for width changes (including responsive font-size changes)
    ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth = Math.floor(entry.contentRect.width);
        // Re-measure because media queries may alter widths
        measure().then(packRows);
      }
    });
    if (containerEl) ro.observe(containerEl);
    // Initial measure/pack
    measure().then(packRows);
    return () => {
      if (ro && containerEl) ro.unobserve(containerEl);
      ro = null;
    };
  });

  // Recompute items and re-measure when props change
  $effect(() => {
    // Depend on labels, min, max
    const _l = labels ? labels.join("|") : "";
    const _min = min;
    const _max = max;
    void _l;
    void _min;
    void _max;
    recalc();
    // After items update, measure and pack
    measure().then(packRows);
  });

  // Repack when selection may visually affect layout (unlikely, but safe)
  $effect(() => {
    const any = spec.any;
    const count = spec.values.length;
    void any;
    void count;
    // No need to rebuild items; just pack in case slight width changes occur
    measure().then(packRows);
  });

  function onEvery() {
    spec = setEvery(spec, min, max);
  }

  function onToggle(v: number) {
    spec = toggleValue(spec, v, min, max);
  }
</script>

<div class="space-y-2">
  <div class="text-sm font-semibold text-slate-300">{title}</div>

  <!-- Measurement container (offscreen, invisible) -->
  <div class="invisible absolute top-0 left-0 -z-50">
    <div class="flex gap-2" bind:this={measureEl} aria-hidden="true">
      {#each items as it (it.key)}
        <button
          type="button"
          class="chip cursor-pointer rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm font-medium md:px-2.5 md:py-1.5 md:text-xs"
        >
          {it.text}
        </button>
      {/each}
    </div>
  </div>

  <!-- Visible rows container -->
  <div class="flex w-full flex-col items-start gap-2" bind:this={containerEl}>
    {#each rows as row, rIdx (rIdx)}
      <div class="flex gap-2">
        {#each row as idx (idx)}
          {#if items[idx].type === "every"}
            <button
              type="button"
              class="chip cursor-pointer rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-center text-sm font-medium transition-colors hover:bg-neutral-800 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none aria-pressed:border-emerald-500 aria-pressed:bg-emerald-900/40 aria-pressed:text-emerald-200 md:px-2.5 md:py-1.5 md:text-xs"
              aria-pressed={spec.any}
              onclick={onEvery}
              title={items[idx].title}
              >{items[idx].text}
            </button>
          {:else}
            <button
              type="button"
              class="chip cursor-pointer rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-center text-sm font-medium transition-colors hover:bg-neutral-800 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none aria-pressed:border-emerald-500 aria-pressed:bg-emerald-900/40 aria-pressed:text-emerald-200 md:px-2.5 md:py-1.5 md:text-xs"
              aria-pressed={!spec.any &&
                items[idx].value !== undefined &&
                spec.values.includes(items[idx].value)}
              onclick={() => items[idx].value !== undefined && onToggle(items[idx].value)}
              title={items[idx].title}
            >
              {items[idx].text}
            </button>
          {/if}
        {/each}
      </div>
    {/each}
  </div>
</div>
