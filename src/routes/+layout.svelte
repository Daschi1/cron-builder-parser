<script lang="ts">
  import "../app.css";
  import Footer from "$lib/components/Footer.svelte";
  import Header from "$lib/components/Header.svelte";
</script>

<svelte:head>
  <title>Strict POSIX cron: Builder & Parser</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />

  <!-- Hint to user agents that the page uses a dark color scheme so built-in UI
			 (form controls, scrollbars, etc.) renders appropriately -->
  <meta name="color-scheme" content="dark" />
  <!-- Theme color for dark mode capable user agents (e.g., address bar color).
			 We include a media-queried variant plus a non-conditional fallback for
			 browsers/PWAs that do not evaluate the media attribute. -->
  <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
  <meta name="theme-color" content="#0a0a0a" />
</svelte:head>

<div class="flex min-h-dvh flex-col bg-neutral-950 text-slate-100">
  <a
    href="#content"
    class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-neutral-900 focus:px-3 focus:py-2 focus:text-slate-100"
    >Skip to content</a
  >
  <Header />
  <main id="content" class="mx-auto w-full max-w-screen-lg flex-1 px-4 py-5">
    <slot />
  </main>
  <Footer />
</div>
