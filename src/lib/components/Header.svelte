<script lang="ts">
  import Container from "$lib/ui/Container.svelte";
  import LinkButton from "$lib/ui/LinkButton.svelte";
</script>

<header
  class="sticky top-0 z-10 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60"
>
  <Container class="flex items-center justify-between gap-4 py-3">
    <a
      href="/"
      class="text-lg font-bold tracking-tight transition-colors hover:text-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none"
      >Strict POSIX Cron Builder & Parser</a
    >
    <nav class="flex items-center gap-2 text-sm" aria-label="Sections">
      <LinkButton href="/#builder" variant="ghost" size="sm">Builder</LinkButton>
      <LinkButton href="/#parser" variant="ghost" size="sm">Parser</LinkButton>
      <LinkButton href="/#help" variant="ghost" size="sm">Help</LinkButton>
      <LinkButton href="/ipsubnet" variant="ghost" size="sm">IP Subnet</LinkButton>
    </nav>
  </Container>
</header>
