<script lang="ts">
	import type { FieldSpec } from '$lib/utils/cron';
	import { toggleValue, setEvery } from '$lib/utils/cron';

	let { title, spec = $bindable<FieldSpec>(), min, max, labels = null } = $props<{
		title: string;
		spec?: FieldSpec; // bindable via $bindable()
		min: number;
		max: number;
		labels?: string[] | null;
	}>();

	function onEvery() {
		spec = setEvery(spec, min, max);
	}

	function onToggle(v: number) {
		spec = toggleValue(spec, v, min, max);
	}
</script>

<div class="space-y-2">
	<div class="text-sm font-semibold text-slate-300">{title}</div>
	<div class="flex flex-wrap gap-2">
		<button type="button"
						class="chip cursor-pointer rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm font-medium md:px-2.5 md:py-1.5 md:text-xs hover:brightness-110 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 transition-colors aria-pressed:border-emerald-500 aria-pressed:text-emerald-200 aria-pressed:bg-emerald-900/40"
						aria-pressed={spec.any} onclick={onEvery}>Every *
		</button>
		{#each Array.from({ length: max - min + 1 }, (_, i) => min + i) as v (v)}
			<button type="button"
							class="chip cursor-pointer rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm font-medium md:px-2.5 md:py-1.5 md:text-xs hover:brightness-110 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 transition-colors aria-pressed:border-emerald-500 aria-pressed:text-emerald-200 aria-pressed:bg-emerald-900/40"
							aria-pressed={!spec.any && spec.values.includes(v)} onclick={() => onToggle(v)}>
				{#if labels && labels[v - min]}
					{labels[v - min]} ({v})
				{:else}
					{v}
				{/if}
			</button>
		{/each}
	</div>
</div>
