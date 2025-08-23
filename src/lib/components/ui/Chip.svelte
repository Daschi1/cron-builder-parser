<script lang="ts">
  type ChildrenFn = (() => unknown) | undefined;
  const all = $props<{
    pressed?: boolean;
    class?: string;
    title?: string;
    children?: ChildrenFn;
    // allow arbitrary rest props (including onclick)
    [key: string]: unknown;
  }>();
  let { pressed = false, class: className = '', title = '', children, ...rest } = all;
</script>

<button
  {...rest}
  class={`px-2.5 py-1.5 rounded-lg border text-sm cursor-pointer select-none transition [@media(hover:hover)]:hover:brightness-110 active:translate-y-px ${
    pressed ? 'border-sky-400 outline outline-1 outline-sky-400 bg-slate-800 text-slate-100' : 'border-slate-800 bg-slate-900 text-slate-100'
  } ${className}`}
  aria-pressed={pressed ? 'true' : 'false'}
  {title}
>
  {@render children?.()}
</button>
