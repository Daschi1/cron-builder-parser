<script lang="ts">
  let {
    href,
    variant = "ghost",
    size = "sm",
    target,
    rel,
    title,
    ariaLabel,
    class: className = "",
    children
  } = $props<{
    href: string;
    variant?: "solid" | "ghost";
    size?: "sm" | "md";
    target?: "_blank" | "_self" | "_parent" | "_top";
    rel?: string;
    title?: string;
    ariaLabel?: string;
    class?: string;
    children?: () => unknown;
  }>();

  const base =
    "inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none";
  const solid = "border-neutral-800 bg-neutral-900 text-slate-100 hover:brightness-110";
  const ghost =
    "border-transparent text-slate-400 hover:border-neutral-800 hover:bg-neutral-900 hover:text-slate-100";
  const sizeSm = "px-2 py-1";
  const sizeMd = "px-3 py-2 rounded-lg";
</script>

<a
  {href}
  {target}
  rel={target === "_blank" ? (rel ?? "noopener noreferrer") : rel}
  class={`${base} ${variant === "ghost" ? ghost : solid} ${size === "sm" ? sizeSm : sizeMd} ${className}`}
  {title}
  aria-label={ariaLabel}
>
  {@render children?.()}
</a>
