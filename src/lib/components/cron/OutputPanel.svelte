<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import StatusText from '$lib/components/ui/StatusText.svelte';
  import { condense, humanize, range, type Fields } from '$lib/utils/cron';

  let { fields } = $props<{ fields: Fields }>();

  let copied = $state<{ plain: boolean; withCmd: boolean }>({ plain: false, withCmd: false });

  function buildCron(): string {
    const minute = condense(fields.minute.values, 0, 59);
    const hour = condense(fields.hour.values, 0, 23);
    const dom = condense(fields.dom.values, 1, 31);
    const month = condense(fields.month.values, 1, 12);
    const dow = condense(fields.dow.values, 0, 6);
    return `${minute} ${hour} ${dom} ${month} ${dow}`;
  }

  function humanPlain(): string {
    const mAny = fields.minute.values.length === range(0, 59).length;
    const hAny = fields.hour.values.length === range(0, 23).length;
    const dAny = fields.dom.values.length === range(1, 31).length;
    const monAny = fields.month.values.length === range(1, 12).length;
    const dowAny = fields.dow.values.length === range(0, 6).length;
    const html = humanize({
      minute: { any: mAny, values: fields.minute.values },
      hour: { any: hAny, values: fields.hour.values },
      dom: { any: dAny, values: fields.dom.values },
      month: { any: monAny, values: fields.month.values },
      dow: { any: dowAny, values: fields.dow.values }
    });
    return html.replace(/<[^>]+>/g, '');
  }

  async function copyPlain() {
    await navigator.clipboard.writeText(buildCron());
    copied.plain = true;
    setTimeout(() => (copied.plain = false), 1200);
  }
  async function copyWithCmd() {
    await navigator.clipboard.writeText(buildCron() + ' your-command-here');
    copied.withCmd = true;
    setTimeout(() => (copied.withCmd = false), 1200);
  }
</script>

<div class="flex flex-wrap items-center gap-2">
  <div class="font-mono text-sm rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
    {buildCron()}
  </div>
  <Button class="ml-1" title="Copy cron expression" onclick={copyPlain}>{copied.plain ? 'Copied!' : 'Copy'}</Button>
  <Button title="Copy cron with placeholder command" onclick={copyWithCmd}>{copied.withCmd ? 'Copied!' : 'Copy with command'}</Button>
</div>
<p class="text-sky-100 text-base mt-2">{humanPlain()}</p>
{#if fields.dom.values.length !== range(1,31).length && fields.dow.values.length !== range(0,6).length}
  <StatusText kind="muted" class="mt-1">Both DOM and DOW are restricted - POSIX runs when <em>either</em> matches.</StatusText>
{:else}
  <StatusText kind="muted" class="mt-1">Strict POSIX: no steps (*/5), no names in fields, no @macros.</StatusText>
{/if}
