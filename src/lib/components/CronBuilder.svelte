<script lang="ts">
  import FieldChips from "$lib/ui/FieldChips.svelte";
  import CopyButton from "$lib/ui/CopyButton.svelte";
  import {
    LIMITS,
    MONTH_NAMES,
    DOW_NAMES,
    type FieldSpec,
    emptyFields,
    buildCron,
    humanize
  } from "$lib/utils/cron";

  // Builder state using Svelte 5 runes
  let minute = $state<FieldSpec>(emptyFields().minute);
  let hour = $state<FieldSpec>(emptyFields().hour);
  let dom = $state<FieldSpec>(emptyFields().dom);
  let month = $state<FieldSpec>(emptyFields().month);
  let dow = $state<FieldSpec>(emptyFields().dow);

  const cronOut = $derived(buildCron({ minute, hour, dom, month, dow }));
  const humanOut = $derived(humanize({ minute, hour, dom, month, dow }));

  // labels for UI only (POSIX uses numbers)
  const MONTH_LABELS: string[] = MONTH_NAMES.slice();
  const DOW_LABELS: string[] = DOW_NAMES.slice();

  function resetAll() {
    const empty = emptyFields();
    minute = empty.minute;
    hour = empty.hour;
    dom = empty.dom;
    month = empty.month;
    dow = empty.dow;
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
  <h2 class="text-xs tracking-widest text-slate-400 uppercase">Builder</h2>

  <div class="space-y-5 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <p class="mb-2 text-xs tracking-wider text-slate-400 uppercase">Time</p>
        <FieldChips
          bind:spec={minute}
          title={`Minute (${LIMITS.minute.min}-${LIMITS.minute.max})`}
          min={LIMITS.minute.min}
          max={LIMITS.minute.max}
        />
        <div class="h-3"></div>
        <FieldChips
          bind:spec={hour}
          title={`Hour (${LIMITS.hour.min}-${LIMITS.hour.max})`}
          min={LIMITS.hour.min}
          max={LIMITS.hour.max}
        />
      </div>

      <div>
        <p class="mb-2 text-xs tracking-wider text-slate-400 uppercase">Date</p>
        <FieldChips
          bind:spec={dom}
          title={`Day of Month (${LIMITS.dom.min}-${LIMITS.dom.max})`}
          min={LIMITS.dom.min}
          max={LIMITS.dom.max}
        />
        <div class="h-3"></div>
        <FieldChips
          bind:spec={month}
          title={`Month (${LIMITS.month.min}-${LIMITS.month.max})`}
          min={LIMITS.month.min}
          max={LIMITS.month.max}
          labels={MONTH_LABELS}
        />
        <div class="h-3"></div>
        <FieldChips
          bind:spec={dow}
          title={`Day of Week (${LIMITS.dow.min}-${LIMITS.dow.max})`}
          min={LIMITS.dow.min}
          max={LIMITS.dow.max}
          labels={DOW_LABELS}
        />
      </div>
    </div>

    <div class="space-y-3">
      <p class="text-xs tracking-wider text-slate-400 uppercase">Output</p>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label="Select cron text"
            title="Click to select"
            class="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 font-mono text-sm text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none"
            onclick={selectText}>{cronOut}</button
          >
          <CopyButton text={cronOut} label="Copy" title="Copy cron expression" />
        </div>
        <button
          type="button"
          class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm font-semibold transition-colors hover:brightness-110 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none"
          title="Reset all fields to Every"
          aria-label="Reset to Every"
          onclick={resetAll}
        >
          Reset
        </button>
      </div>
      <div class="text-emerald-200">{humanOut}</div>
    </div>
  </div>
</section>
