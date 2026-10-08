<script lang="ts">
  import { makeT, type Locale } from '$lib/i18n';
  import { fmtCents, fmtMinutes } from '$lib/time';
  import Avatar from '$lib/ui/Avatar.svelte';
  import FlagPills from './FlagPills.svelte';
  import Reasons from './Reasons.svelte';
  import { IconOwed, IconFile, IconNext, IconPaid } from '$lib/ui/icons';
  import type { WeekResult } from '$lib/pay/engine';

  // One technician's week on a phone: total first, owed as its own line, the reasons one tap away (UX-35).
  let { line, start, locale, focused = false }: { line: { worker: { id: string; displayName: string }; result: WeekResult; owedCents: number; paid?: { cash: number; check: number; payroll: number; on: string | null } }; start: string; locale: Locale; focused?: boolean } = $props();
  const t = $derived(makeT(locale));
  const r = $derived(line.result);
  let open = $state(false);
  const how = $derived(
    line.paid
      ? [line.paid.cash && `${t('cash')} ${fmtCents(line.paid.cash)}`, line.paid.check && `${t('py_method_check')} ${fmtCents(line.paid.check)}`, line.paid.payroll && `${t('py_method_payroll')} ${fmtCents(line.paid.payroll)}`].filter(Boolean).join(' · ')
      : ''
  );
</script>

<article id="line-{line.worker.id}" class="card p-4 {focused ? 'ring-2 ring-focus' : ''}">
  <div class="flex items-center gap-3">
    <Avatar name={line.worker.displayName} id={line.worker.id} size={44} />
    <div class="min-w-0 flex-1">
      <p class="truncate text-lg font-bold">{line.worker.displayName}</p>
      <p class="text-sm text-ink-muted">{r.overtimeMinutes ? t('py_hours_ot', { hours: fmtMinutes(r.minutesWorked), ot: fmtMinutes(r.overtimeMinutes) }) : t('py_hours_only', { hours: fmtMinutes(r.minutesWorked) })}</p>
    </div>
    <div class="text-right">
      <p class="text-sm text-ink-muted">{t('total_pay')}</p>
      <p class="text-xl font-bold">{fmtCents(r.totalCents)}</p>
    </div>
  </div>
  <dl class="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-sunken p-2 text-center">
    <div><dt class="text-sm text-ink-muted">{t('sales')}</dt><dd class="font-bold">{fmtCents(r.salesCents)}</dd></div>
    <div><dt class="text-sm text-ink-muted">{t('gross_wages')}</dt><dd class="font-bold">{fmtCents(r.grossWagesCents)}</dd></div>
    <div><dt class="text-sm text-ink-muted">{t('tips')}</dt><dd class="font-bold">{fmtCents(r.tipsCardCents + r.tipsCashCents)}</dd></div>
  </dl>
  {#if line.owedCents > 0}
    <p class="mt-3 flex items-center gap-2 rounded-xl bg-owed-soft px-3 py-2 text-base font-bold text-owed-ink"><IconOwed size={20} class="shrink-0" />{t('owed_by_law')}: +{fmtCents(line.owedCents)}</p>
  {/if}
  {#if r.flags.length}<div class="mt-3"><FlagPills flags={r.flags} {locale} /></div>{/if}
  {#if open}
    <div class="mt-3 rounded-xl border border-line p-3"><Reasons breakdown={r.breakdown} {locale} /></div>
  {/if}
  <div class="mt-3 flex flex-wrap items-center gap-2">
    <button type="button" class="btn-secondary min-h-11 px-3 text-base" aria-expanded={open} onclick={() => (open = !open)}>{open ? t('py_hide_why') : t('py_why')}</button>
    <a href="/app/pay/{start}/{line.worker.id}" class="btn-secondary min-h-11 px-3 text-base"><IconFile size={18} />{t('statement')}<IconNext size={18} /></a>
  </div>
  {#if line.paid?.on}<p class="mt-2 flex items-center gap-1.5 text-sm font-bold text-ok-ink"><IconPaid size={16} />{t('py_paid_line', { date: line.paid.on, how })}</p>{/if}
</article>
