<script lang="ts">
  let {
    type = "button",
    variant = "solid",
    size = "md",
    title,
    ariaLabel,
    class: className = "",
    children,
    onclick
  } = $props<{
    type?: "button" | "submit" | "reset";
    variant?: "solid" | "ghost";
    size?: "sm" | "md";
    title?: string;
    ariaLabel?: string;
    class?: string;
    children?: () => unknown;
    onclick?: (e: MouseEvent) => void;
  }>();

  const base =
    "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none";
  const solid = "border-neutral-800 bg-neutral-900 hover:brightness-110";
  const ghost =
    "border-transparent text-slate-400 hover:border-neutral-800 hover:bg-neutral-900 hover:text-slate-100";
  const sizeSm = "px-2.5 py-1.5 text-xs rounded-md";
</script>

<button
  {type}
  class={`${base} ${variant === "ghost" ? ghost : solid} ${size === "sm" ? sizeSm : ""} ${className}`}
  {title}
  aria-label={ariaLabel}
  {onclick}
>
  {@render children?.()}
</button>
