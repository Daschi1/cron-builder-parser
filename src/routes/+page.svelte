<script lang="ts">
  import CronBuilder from "$lib/components/CronBuilder.svelte";
  import CronParser from "$lib/components/CronParser.svelte";
  import Card from "$lib/ui/Card.svelte";
  import SectionLabel from "$lib/ui/SectionLabel.svelte";
</script>

<svelte:head>
  <title>Strict POSIX cron: Builder & Parser</title>
  <meta
    name="description"
    content="Build and validate strict POSIX 5‑field cron expressions. Interactive cron builder, parser, and help with exact ranges and POSIX behavior (no steps, names, or macros)."
  />
</svelte:head>

<div class="space-y-5">
  <CronBuilder />
  <CronParser />

  <SectionLabel>Help</SectionLabel>
  <section id="help">
    <Card>
      <p class="text-sm text-slate-300">
        This tool enforces strict POSIX cron. See the official spec for more info: <a
          class="text-emerald-300 underline underline-offset-2"
          href="https://pubs.opengroup.org/onlinepubs/9699919799/utilities/crontab.html#tag_20_25_07"
          target="_blank"
          rel="noopener noreferrer">POSIX crontab</a
        >.
      </p>
      <ul class="list-disc pl-5 text-sm text-slate-300">
        <li>Exactly 5 fields: minute, hour, day of month, month, day of week.</li>
        <li>
          Valid ranges: minute 0-59; hour 0-23; day of month 1-31; month 1-12; day of week 0-6
          (0=Sun).
        </li>
        <li>Field syntax: * (any), single number, comma list, or numeric low-high range.</li>
        <li>No step values (*/5), no names (JAN, MON), no @daily macros, no Sunday=7.</li>
        <li>DOM vs DOW: If both are restricted (not *), POSIX runs when either matches.</li>
      </ul>
    </Card>
  </section>
</div>
