<script lang="ts">
  import StatusText from '$lib/components/ui/StatusText.svelte';
  import Note from '$lib/components/ui/Note.svelte';
  import { parseCronText } from '$lib/utils/cron';

  let cronText = $state('');

  function status(): { kind: 'muted' | 'ok' | 'err'; text: string; human?: string } {
    const res = parseCronText(cronText);
    if ('empty' in res) {
      return { kind: 'muted', text: 'Waiting for input...' };
    }
    if ('error' in res) {
      return { kind: 'err', text: `✖ ${res.error}` };
    }
    return { kind: 'ok', text: '✔ Valid strict POSIX.', human: res.human.replace(/<[^>]+>/g, '') };
  }
</script>

<div class="space-y-3">
  <div>
    <input
      type="text"
      bind:value={cronText}
      placeholder="e.g. 30 1 * * *"
      spellcheck={false}
      autocomplete="off"
      class="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm"
    />
    <p class="text-xs text-slate-400 mt-1">Allowed per field: * , numbers, comma lists, or low-high ranges. No steps, no names, exactly 5 fields.</p>
  </div>

  {#if status().kind === 'muted'}
    <StatusText kind="muted">{status().text}</StatusText>
  {:else if status().kind === 'err'}
    <StatusText kind="err">{status().text}</StatusText>
  {:else}
    <StatusText kind="ok">{status().text}</StatusText>
  {/if}

  <div>
    <p class={`text-base ${status().human ? 'text-sky-100' : 'text-slate-400'}`}>{status().human ?? '-'}</p>
  </div>

  <Note>
    <strong>DOM vs DOW rule:</strong> If day of month and day of week are both restricted (not *), POSIX runs the command when either field matches.
  </Note>
</div>
