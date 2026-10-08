<script lang="ts">
  import { addDays } from '$lib/time';
  import { IconBack, IconNext } from '$lib/ui/icons';
  // The workweek as seven tappable days, with a dot where records exist (UX-19).
  let { days, date, today, locale, prevLabel, nextLabel, dataLabel }: { days: { date: string; busy: boolean }[]; date: string; today: string; locale: 'en' | 'vi'; prevLabel: string; nextLabel: string; dataLabel: string } = $props();
  const fmt = $derived(new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { timeZone: 'UTC', weekday: 'short' }));
  const dayName = (d: string) => fmt.format(new Date(d + 'T12:00:00Z'));
</script>

<nav class="flex items-stretch gap-1.5" aria-label={dataLabel}>
  <a href="?date={addDays(date, -7)}" class="btn-secondary hidden w-11 shrink-0 !px-0 sm:flex" aria-label={prevLabel} title={prevLabel}><IconBack size={22} /></a>
  <ol class="grid flex-1 grid-cols-7 gap-1.5">
    {#each days as d (d.date)}
      {@const sel = d.date === date}
      <li>
        <a
          href="?date={d.date}"
          aria-current={sel ? 'date' : undefined}
          class="flex min-h-14 flex-col items-center justify-center rounded-xl border text-center leading-tight transition-colors {sel ? 'border-brand bg-brand text-white shadow-raise' : d.date === today ? 'border-brand bg-surface text-brand-strong' : 'border-line bg-surface text-ink hover:bg-sunken'}"
        >
          <span class="text-xs font-bold {sel ? 'text-white/90' : 'text-ink-muted'}">{dayName(d.date)}</span>
          <span class="text-lg font-bold">{Number(d.date.slice(8))}</span>
          <span class="mt-0.5 size-1.5 rounded-full {d.busy ? (sel ? 'bg-white' : 'bg-brand') : 'bg-transparent'}" aria-hidden="true"></span>
          {#if d.busy}<span class="sr-only">{dataLabel}</span>{/if}
        </a>
      </li>
    {/each}
  </ol>
  <a href="?date={addDays(date, 7)}" class="btn-secondary hidden w-11 shrink-0 !px-0 sm:flex" aria-label={nextLabel} title={nextLabel}><IconNext size={22} /></a>
</nav>
