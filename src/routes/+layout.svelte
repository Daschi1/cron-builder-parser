<script lang="ts">
	import '../app.css';

	function goHome(ev: MouseEvent) {
		ev.preventDefault();
		if (typeof window !== 'undefined') {
			const url = window.location;
			if (url.hash) {
				history.replaceState(history.state, '', url.pathname + url.search);
			}
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}
</script>

<svelte:head>
	<title>Strict POSIX cron: Builder & Parser</title>
</svelte:head>

<div class="min-h-dvh bg-neutral-950 text-slate-100 scroll-smooth">
	<a href="#content"
		 class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-neutral-900 focus:px-3 focus:py-2 focus:text-slate-100">Skip
		to content</a>
	<header
		class="sticky top-0 z-10 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60">
		<div class="mx-auto flex max-w-screen-lg items-center justify-between gap-4 px-4 py-3">
			<a href="/"
				 class="text-lg font-bold tracking-tight hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 transition-colors"
				 onclick={goHome}>Strict POSIX Cron Builder & Parser</a>
			<nav class="flex items-center gap-2 text-sm" aria-label="Sections">
				<a
					class="rounded-md border border-transparent px-2 py-1 text-slate-400 hover:border-neutral-800 hover:bg-neutral-900 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 transition-colors"
					href="#builder">Builder</a>
				<a
					class="rounded-md border border-transparent px-2 py-1 text-slate-400 hover:border-neutral-800 hover:bg-neutral-900 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 transition-colors"
					href="#parser">Parser</a>
				<a
					class="rounded-md border border-transparent px-2 py-1 text-slate-400 hover:border-neutral-800 hover:bg-neutral-900 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 transition-colors"
					href="#help">Help</a>
			</nav>
		</div>
	</header>
	<main id="content" class="mx-auto max-w-screen-lg px-4 py-5">
		<slot />
	</main>
</div>
