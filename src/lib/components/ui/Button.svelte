<script lang="ts">
  type ChildrenFn = (() => unknown) | undefined;
  const all = $props<{ class?: string; title?: string; type?: 'button' | 'submit' | 'reset'; children?: ChildrenFn; [key: string]: unknown }>();
  let { class: className = '', title = '', type = 'button', children, ...rest } = all;
</script>

<button
  {...rest}
  {type}
  {title}
  class={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 font-semibold [@media(hover:hover)]:hover:brightness-110 ${className}`}
>
  {@render children?.()}
</button>
