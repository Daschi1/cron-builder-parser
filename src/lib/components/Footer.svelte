<script lang="ts">
  import Container from "$lib/ui/Container.svelte";
</script>

<footer
  class="border-t border-neutral-900 bg-neutral-950/80 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60"
>
  <Container
    class="flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2 py-4 text-sm text-slate-400"
  >
    <nav class="flex items-center gap-3" aria-label="Footer">
      <a
        class="text-emerald-300 underline underline-offset-2 transition-colors hover:text-emerald-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none"
        href="https://github.com/Daschi1/cron-builder-parser"
        target="_blank"
        rel="noopener noreferrer"
      >
        Source
      </a>
      <a
        class="text-emerald-300 underline underline-offset-2 transition-colors hover:text-emerald-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none"
        href="/licenses"
      >
        Licenses
      </a>
    </nav>
    <p class="text-slate-400">
      Created with <span aria-hidden="true">❤️</span><span class="sr-only">love</span> by
      <a
        class="text-emerald-300 underline underline-offset-2 transition-colors hover:text-emerald-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none"
        href="https://github.com/Daschi1"
        target="_blank"
        rel="noopener noreferrer"
      >
        Daschi
      </a>
    </p>
  </Container>
</footer>
