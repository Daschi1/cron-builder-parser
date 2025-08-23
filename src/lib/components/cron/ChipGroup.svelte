<script lang="ts">
  import Chip from '$lib/components/ui/Chip.svelte';
  import { range as _range, uniqSorted } from '$lib/utils/cron';
  import { createEventDispatcher } from 'svelte';

  export type ChipGroupChange = { any: boolean; values: number[] };

  const p = $props<{
    any?: boolean;
    values?: number[];
    min?: number;
    max?: number;
    labels?: string[];
    class?: string;
  }>();

  const dispatch = createEventDispatcher<{ update: ChipGroupChange }>();

  function setEvery() {
    const full = _range(p.min ?? 0, p.max ?? 59);
    dispatch('update', { any: true, values: full });
  }

  function toggleValue(v: number) {
    if (p.any) {
      dispatch('update', { any: false, values: [v] });
      return;
    }
    const currentValues = Array.isArray(p.values) ? p.values : [];
    let arr = currentValues.includes(v) ? currentValues.filter((n: number) => n !== v) : uniqSorted([...currentValues, v]);
    const fullCount = (p.max ?? 59) - (p.min ?? 0) + 1;
    if (arr.length === 0) {
      dispatch('update', { any: true, values: _range(p.min ?? 0, p.max ?? 59) });
      return;
    }
    if (arr.length === fullCount) {
      dispatch('update', { any: true, values: _range(p.min ?? 0, p.max ?? 59) });
    } else {
      dispatch('update', { any: false, values: arr });
    }
  }
</script>

<div class={`flex flex-wrap gap-1.5 ${p.class ?? ''}`}>
  <Chip pressed={!!p.any} title="Every *" onclick={setEvery}>Every *</Chip>
  {#each Array.from({ length: (p.max ?? 59) - (p.min ?? 0) + 1 }, (_, i) => (p.min ?? 0) + i) as v (v)}
    <Chip
      pressed={!p.any && Array.isArray(p.values) && p.values.includes(v)}
      onclick={() => toggleValue(v)}
      title={Array.isArray(p.labels) && p.labels[v - (p.min ?? 0)] ? `${p.labels[v - (p.min ?? 0)]} (${v})` : String(v)}
    >
      {Array.isArray(p.labels) && p.labels[v - (p.min ?? 0)] ? `${p.labels[v - (p.min ?? 0)]} (${v})` : String(v)}
    </Chip>
  {/each}
</div>
