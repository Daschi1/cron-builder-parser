<script lang="ts">
  type ChildrenFn = (() => unknown) | undefined;
  let { kind = 'muted', class: className = '', children } = $props<{
    kind?: 'muted' | 'ok' | 'err' | 'warn';
    class?: string;
    children?: ChildrenFn;
  }>();

  const map: Record<'muted' | 'ok' | 'err' | 'warn', string> = {
    muted: 'text-slate-400',
    ok: 'text-emerald-400',
    err: 'text-rose-400',
    warn: 'text-amber-400'
  } as const;

</script>

<p class={`text-sm ${kind === 'muted' ? map.muted : kind === 'ok' ? map.ok : kind === 'err' ? map.err : map.warn} ${className}`}>
  {@render children?.()}
</p>
