<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import SectionTitle from '$lib/components/ui/SectionTitle.svelte';
  import Chip from '$lib/components/ui/Chip.svelte';
  import ChipGroup from '$lib/components/cron/ChipGroup.svelte';
  import OutputPanel from '$lib/components/cron/OutputPanel.svelte';
  import ParserPanel from '$lib/components/cron/ParserPanel.svelte';
  import { range, MONTH_NAMES, DOW_NAMES, type Fields } from '$lib/utils/cron';

  type Field = { any: boolean; values: number[] };

  let minute = $state<Field>({ any: true, values: range(0, 59) });
  let hour = $state<Field>({ any: true, values: range(0, 23) });
  let dom = $state<Field>({ any: true, values: range(1, 31) });
  let month = $state<Field>({ any: true, values: range(1, 12) });
  let dow = $state<Field>({ any: true, values: range(0, 6) });

  function fields(): Fields {
    return { minute, hour, dom, month, dow };
  }

  function resetAll() {
    minute = { any: true, values: range(0, 59) };
    hour = { any: true, values: range(0, 23) };
    dom = { any: true, values: range(1, 31) };
    month = { any: true, values: range(1, 12) };
    dow = { any: true, values: range(0, 6) };
  }

  function applyPreset(preset: string) {
    resetAll();
    switch (preset) {
      case 'every-minute':
        // all any
        break;
      case 'hourly':
        minute = { any: false, values: [0] };
        break;
      case 'daily-0130':
        minute = { any: false, values: [30] };
        hour = { any: false, values: [1] };
        break;
      case 'weekdays-0900':
        minute = { any: false, values: [0] };
        hour = { any: false, values: [9] };
        dow = { any: false, values: [1, 2, 3, 4, 5] };
        break;
      case 'first-15th-0745':
        minute = { any: false, values: [45] };
        hour = { any: false, values: [7] };
        dom = { any: false, values: [1, 15] };
        break;
      case 'hourly-quarter':
        minute = { any: false, values: [15] };
        break;
      case 'business-hours-5min':
        minute = { any: false, values: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] };
        hour = { any: false, values: Array.from({ length: 17 - 9 + 1 }, (_, i) => 9 + i) };
        dow = { any: false, values: [1, 2, 3, 4, 5] };
        break;
      case 'dom-and-dow-either':
        minute = { any: false, values: [0] };
        hour = { any: false, values: [10] };
        dom = { any: false, values: [1] };
        dow = { any: false, values: [0] };
        break;
      case 'summer-months-noon':
        minute = { any: false, values: [0] };
        hour = { any: false, values: [12] };
        month = { any: false, values: [6, 7, 8] };
        break;
      case 'odd-hours-midnight':
        minute = { any: false, values: [0] };
        hour = { any: false, values: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23] };
        break;
      case 'last-workday-like':
        minute = { any: false, values: [0] };
        hour = { any: false, values: [18] };
        dom = { any: false, values: [28, 29, 30, 31] };
        dow = { any: false, values: [1, 2, 3, 4, 5] };
        break;
      case 'weekend-nights':
        minute = { any: false, values: [30] };
        hour = { any: false, values: [22, 23] };
        dow = { any: false, values: [0, 6] };
        break;
    }
  }
</script>

<svelte:head>
  <title>Strict POSIX Cron - Builder & Parser</title>
</svelte:head>

<div class="max-w-5xl mx-auto p-4 space-y-4">
  <header class="flex items-center justify-between gap-3 flex-wrap">
    <h1 class="text-2xl font-bold tracking-tight">Strict POSIX Crontab - Builder & Parser</h1>
    <nav class="flex gap-2 text-sm text-slate-400">
      <a class="hover:text-slate-200" href="#builder">Builder</a>
      <a class="hover:text-slate-200" href="#parser">Parser</a>
      <a class="hover:text-slate-200" href="#help">Help</a>
    </nav>
  </header>

  <Card id="builder">
    <SectionTitle>Builder</SectionTitle>

    <div class="grid md:grid-cols-2 gap-4">
      <Card>
        <SectionTitle>Time</SectionTitle>
        <div class="grid grid-cols-[180px_1fr] items-start gap-3 py-2 border-t border-dashed border-slate-800 first:border-t-0">
          <div class="font-semibold text-slate-300">Minute (0-59)</div>
          <div>
            <ChipGroup any={minute.any} values={minute.values} min={0} max={59} on:update={(e) => (minute = e.detail)} />
            <p class="text-xs text-slate-400 mt-1">Select specific minutes or leave as "Every".</p>
          </div>
        </div>
        <div class="grid grid-cols-[180px_1fr] items-start gap-3 py-2 border-t border-dashed border-slate-800 first:border-t-0">
          <div class="font-semibold text-slate-300">Hour (0-23)</div>
          <div>
            <ChipGroup any={hour.any} values={hour.values} min={0} max={23} on:update={(e) => (hour = e.detail)} />
            <p class="text-xs text-slate-400 mt-1">24 hour clock. 0 = midnight, 23 = 11pm.</p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Date</SectionTitle>
        <div class="grid grid-cols-[180px_1fr] items-start gap-3 py-2 border-t border-dashed border-slate-800 first:border-t-0">
          <div class="font-semibold text-slate-300">Day of Month (1-31)</div>
          <div>
            <ChipGroup any={dom.any} values={dom.values} min={1} max={31} on:update={(e) => (dom = e.detail)} />
            <p class="text-xs text-slate-400 mt-1">If you select both DOM and DOW, POSIX runs when either matches.</p>
          </div>
        </div>
        <div class="grid grid-cols-[180px_1fr] items-start gap-3 py-2 border-t border-dashed border-slate-800 first:border-t-0">
          <div class="font-semibold text-slate-300">Month (1-12)</div>
          <div>
            <ChipGroup any={month.any} values={month.values} min={1} max={12} labels={Array.from(MONTH_NAMES)} on:update={(e) => (month = e.detail)} />
            <p class="text-xs text-slate-400 mt-1">Names shown for readability only; the generated POSIX uses numbers.</p>
          </div>
        </div>
        <div class="grid grid-cols-[180px_1fr] items-start gap-3 py-2 border-t border-dashed border-slate-800 first:border-t-0">
          <div class="font-semibold text-slate-300">Day of Week (0-6)</div>
          <div>
            <ChipGroup any={dow.any} values={dow.values} min={0} max={6} labels={Array.from(DOW_NAMES)} on:update={(e) => (dow = e.detail)} />
            <p class="text-xs text-slate-400 mt-1">0 = Sunday. 7 for Sunday is not POSIX.</p>
          </div>
        </div>
      </Card>
    </div>

    <Card class="mt-4">
      <SectionTitle>Output</SectionTitle>
      <OutputPanel fields={fields()} />
    </Card>

    <Card class="mt-4">
      <SectionTitle>Examples</SectionTitle>
      <div class="flex flex-wrap gap-4 mt-1">
        <div class="flex flex-col gap-1 items-start example">
          <Chip title="* * * * *" onclick={() => applyPreset('every-minute')}>Every minute</Chip>
          <div class="text-xs text-slate-400">Runs every minute.</div>
        </div>
        <div class="flex flex-col gap-1 items-start example">
          <Chip title="0 * * * *" onclick={() => applyPreset('hourly')}>On the hour</Chip>
          <div class="text-xs text-slate-400">At minute 0 of every hour.</div>
        </div>
        <div class="flex flex-col gap-1 items-start example">
          <Chip title="30 1 * * *" onclick={() => applyPreset('daily-0130')}>Daily 01:30</Chip>
          <div class="text-xs text-slate-400">01:30 every day.</div>
        </div>
        <div class="flex flex-col gap-1 items-start example">
          <Chip title="0 9 * * 1-5" onclick={() => applyPreset('weekdays-0900')}>Weekdays 09:00</Chip>
          <div class="text-xs text-slate-400">09:00 Monday to Friday.</div>
        </div>
        <div class="flex flex-col gap-1 items-start example">
          <Chip title="45 7 1,15 * *" onclick={() => applyPreset('first-15th-0745')}>1st and 15th at 07:45</Chip>
          <div class="text-xs text-slate-400">Two specific month days.</div>
        </div>

        <div class="flex flex-col gap-1 items-start example">
          <Chip title="15 * * * *" onclick={() => applyPreset('hourly-quarter')}>At 15 past every hour</Chip>
          <div class="text-xs text-slate-400">Minute 15 each hour.</div>
        </div>
        <div class="flex flex-col gap-1 items-start example">
          <Chip title="0,5,10,15,20,25,30,35,40,45,50,55 9-17 * * 1-5" onclick={() => applyPreset('business-hours-5min')}>Every 5 minutes 09-17 Mon-Fri</Chip>
          <div class="text-xs text-slate-400">Manual minute list - steps are not POSIX.</div>
        </div>
        <div class="flex flex-col gap-1 items-start example">
          <Chip title="0 10 1 * 0" onclick={() => applyPreset('dom-and-dow-either')}>10:00 on 1st and Sundays</Chip>
          <div class="text-xs text-slate-400">Either DOM=1 or DOW=Sun matches.</div>
        </div>
        <div class="flex flex-col gap-1 items-start example">
          <Chip title="0 12 * 6-8 *" onclick={() => applyPreset('summer-months-noon')}>Noon during June-August</Chip>
          <div class="text-xs text-slate-400">Months 6-8 only.</div>
        </div>

        <div class="flex flex-col gap-1 items-start example">
          <Chip title="0 1,3,5,7,9,11,13,15,17,19,21,23 * * *" onclick={() => applyPreset('odd-hours-midnight')}>On the hour of odd hours</Chip>
          <div class="text-xs text-slate-400">Top of every odd-numbered hour.</div>
        </div>
        <div class="flex flex-col gap-1 items-start example">
          <Chip title="0 18 28-31 * 1-5" onclick={() => applyPreset('last-workday-like')}>18:00 on DOM 28-31 and Mon-Fri</Chip>
          <div class="text-xs text-slate-400">Either late month days or weekdays.</div>
        </div>
        <div class="flex flex-col gap-1 items-start example">
          <Chip title="30 22-23 * * 0,6" onclick={() => applyPreset('weekend-nights')}>22:30-23:59 on weekends</Chip>
          <div class="text-xs text-slate-400">Evenings on Saturday and Sunday.</div>
        </div>
      </div>
    </Card>
  </Card>

  <Card id="parser">
    <SectionTitle>Parser</SectionTitle>
    <ParserPanel />
  </Card>

  <Card id="help" class="mt-4">
    <SectionTitle>Spec notes (what this tool enforces)</SectionTitle>
    <ul class="text-xs text-slate-400 list-disc pl-5 space-y-1">
      <li>Exactly 5 fields: minute, hour, day of month, month, day of week.</li>
      <li>Valid ranges: minute 0-59; hour 0-23; day of month 1-31; month 1-12; day of week 0-6 (0=Sun).</li>
      <li>Field syntax: <code>*</code>, single number, comma list, or numeric <code>low-high</code> range.</li>
      <li>No step values (<code>*/5</code>), no names (JAN, MON), no <code>@daily</code> macros, no Sunday=7.</li>
      <li>Command shell, I/O, mailing behavior, and timezone are implementation defined and out of scope.</li>
    </ul>
  </Card>
</div>
