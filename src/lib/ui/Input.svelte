<script lang="ts">
  let {
    id,
    value = $bindable<string>(""),
    placeholder,
    ariaInvalid = false,
    type = "text",
    class: className = ""
  } = $props<{
    id?: string;
    value?: string; // bindable via $bindable()
    placeholder?: string;
    ariaInvalid?: boolean;
    type?: "text" | "email" | "search" | "url" | "password";
    class?: string;
  }>();
</script>

<input
  {id}
  {type}
  class={`w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-slate-100 transition-colors outline-none focus:ring-2 focus:ring-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none ${className}`}
  {placeholder}
  bind:value
  spellcheck={false}
  autocomplete="off"
  aria-invalid={ariaInvalid}
/>
