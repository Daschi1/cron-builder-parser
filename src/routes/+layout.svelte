<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import { onMount } from 'svelte';

  let { children } = $props();

  type Theme = 'light' | 'dark';
  let theme = $state<Theme>('dark');

  function applyTheme(t: Theme) {
    theme = t;
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.toggle('dark', t === 'dark');
      root.setAttribute('data-theme', t);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', t);
    }
  }

  function toggleTheme() {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }

  onMount(() => {
    try {
      const saved = localStorage.getItem('theme') as Theme | null;
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(saved ?? (prefersDark ? 'dark' : 'dark'));
    } catch {
      applyTheme('dark');
    }
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <meta name="color-scheme" content="dark light" />
  <meta name="theme-color" content="#0b0f14" />
</svelte:head>

<div class="min-h-dvh bg-slate-950 text-slate-100">
  <header class="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
    <div class="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
      <h1 class="text-lg font-semibold tracking-tight">Strict POSIX Cron — Builder & Parser</h1>
      <button
        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-100 text-sm [@media(hover:hover)]:hover:brightness-110"
        aria-pressed={theme === 'dark' ? 'true' : 'false'}
        onclick={toggleTheme}
        title="Toggle dark mode"
      >
        {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
      </button>
    </div>
  </header>

  {@render children?.()}
</div>
