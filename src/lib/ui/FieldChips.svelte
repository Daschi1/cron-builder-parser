<script lang="ts">
  import type { FieldSpec } from "$lib/utils/cron";
  import { setEvery, toggleValue } from "$lib/utils/cron";
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

  let items: Item[] = $state([]);
  let containerEl: HTMLDivElement | null = null;
  let chipW: number | null = $state(null);

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

  function recalc() {
    items = buildItems();
  }

  async function applyUniformWidth() {
    await tick();
    const root = containerEl;
    if (!root) return;
    const btns = Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-kind="value"]'));
    if (btns.length === 0) {
      chipW = null;
      return;
    }
    const widths = btns.map((b) => Math.ceil(b.getBoundingClientRect().width));
    chipW = Math.max(...widths);
  }

  let ro: ResizeObserver | null = null;
  onMount(() => {
    // Initial calc when mounted
    applyUniformWidth();
    ro = new ResizeObserver(() => {
      applyUniformWidth();
    });
    if (containerEl) ro.observe(containerEl);
    return () => {
      if (ro && containerEl) ro.unobserve(containerEl);
      ro = null;
    };
  });

  // Recompute items when inputs change
  $effect(() => {
    const _l = labels ? labels.join("|") : "";
    const _min = min;
    const _max = max;
    void _l;
    void _min;
    void _max;
    recalc();
    // After items change, recompute max width
    applyUniformWidth();
  });

  // Also re-apply on selection changes (pressed styles can slightly affect width)
  $effect(() => {
    const any = spec.any;
    const count = spec.values.length;
    void any;
    void count;
    applyUniformWidth();
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

  <div class="flex w-full flex-wrap items-start gap-2" bind:this={containerEl}>
    {#each items as it (it.key)}
      {#if it.type === "every"}
        <button
          type="button"
          data-kind="every"
          class="chip inline-flex cursor-pointer items-center justify-center rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-center font-mono text-sm font-medium whitespace-nowrap transition-colors hover:bg-neutral-800 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none aria-pressed:border-emerald-500 aria-pressed:bg-emerald-900/40 aria-pressed:text-emerald-200 md:px-2.5 md:py-1.5"
          aria-pressed={spec.any}
          onclick={onEvery}
          title={it.title}
        >
          {it.text}
        </button>
      {:else}
        <button
          type="button"
          data-kind="value"
          class="chip inline-flex flex-none cursor-pointer items-center justify-center rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-center font-mono text-sm font-medium whitespace-nowrap transition-colors hover:bg-neutral-800 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none aria-pressed:border-emerald-500 aria-pressed:bg-emerald-900/40 aria-pressed:text-emerald-200 md:px-2.5 md:py-1.5"
          style:width={chipW ? chipW + "px" : null}
          aria-pressed={!spec.any && it.value !== undefined && spec.values.includes(it.value)}
          onclick={() => it.value !== undefined && onToggle(it.value)}
          title={it.title}
        >
          {it.text}
        </button>
      {/if}
    {/each}
  </div>
</div>
