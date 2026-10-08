<script lang="ts">
  import { makeT, type Locale, type MessageKey } from '$lib/i18n';
  import { fmtCents, fmtDate, fmtDateLong, fmtHours, fmtMinutes, localTime } from '$lib/time';
  import Reasons from '$lib/pay-ui/Reasons.svelte';
  import FlagPills from '$lib/pay-ui/FlagPills.svelte';
  // One document for the technician and the bookkeeper: the technician's language first, the other under it (UX-40, R29).
  let {
    locale,
    second = null,
    salon,
    line,
    period,
    status,
    tz,
    generatedOn,
    version = 1,
    paid = null
  }: {
    locale: Locale;
    second?: Locale | null;
    salon: { name: string; address?: string | null; licenseNo?: string | null; state: string };
    line: any;
    period: { start: string; end: string };
    status: string;
    tz: string;
    generatedOn: string;
    version?: number;
    paid?: { cash: number; check: number; payroll: number; on: string | null } | null;
  } = $props();
  const t = $derived(makeT(locale));
  const t2 = $derived(second ? makeT(second) : null);
  const r = $derived(line.result);
  const w = $derived(line.worker);
  const days = $derived((line.days as any[]).filter((d) => d.minutes > 0 || d.open || d.punchCount));
  const ticketsByDay = $derived.by(() => {
    const dates = [...new Set([...days.map((d) => d.date), ...(line.tickets as any[]).map((tk) => tk.workDate)])].sort();
    return dates.map((date) => ({ date, tickets: (line.tickets as any[]).filter((tk) => tk.workDate === date) })).filter((g) => g.tickets.length);
  });
  const basis = (tt: typeof t) => {
    switch (w.payBasis) {
      case 'hourly': return `${tt('hourly_rate')} ${fmtCents(w.hourlyRateCents)}${tt('per_hour')}${w.commissionPct ? ` + ${tt('commission')} ${w.commissionPct}%` : ''}`;
      case 'day_rate': return `${tt('day_rate')} ${fmtCents(w.dayRateCents)}${tt('per_day')}`;
      case 'commission': return `${tt('commission')} ${w.commissionPct}%`;
      case 'day_rate_plus_commission': return `${tt('day_rate')} ${fmtCents(w.dayRateCents)}${tt('per_day')} + ${tt('commission')} ${w.commissionPct}%`;
      case 'guarantee_or_commission': return `${tt('guarantee')} ${fmtCents(w.guaranteeCents)}${tt('per_week')} / ${tt('commission')} ${w.commissionPct}%`;
    }
    return w.payBasis;
  };
  const paidHow = (tt: typeof t) =>
    paid ? [paid.cash && `${tt('cash')} ${fmtCents(paid.cash)}`, paid.check && `${tt('py_method_check')} ${fmtCents(paid.check)}`, paid.payroll && `${tt('py_method_payroll')} ${fmtCents(paid.payroll)}`].filter(Boolean).join(' · ') : '';
</script>

{#snippet lbl(key: MessageKey, params?: Record<string, string | number>)}
  <span>{t(key, params)}</span>{#if t2}<span class="block text-sm font-normal text-ink-muted" lang={second}>{t2(key, params)}</span>{/if}
{/snippet}

<article class="statement mx-auto max-w-3xl bg-surface p-5 text-ink sm:p-8 print:p-0" lang={locale}>
  <header class="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
    <div>
      <h1 class="text-2xl leading-tight font-bold">{@render lbl('statement')}</h1>
      <p class="mt-2 text-base">{t('st_period')}: <strong>{fmtDateLong(period.start, locale)} – {fmtDateLong(period.end, locale)}</strong></p>
      <p class="text-sm text-ink-muted">{t('st_version')} {version} · {t(`pay_status_${status}` as MessageKey)}{#if paid?.on} · {t('pay_paid_on')} {paid.on}{/if}</p>
    </div>
    <div class="text-right text-base">
      <p class="text-sm font-bold text-ink-muted">{@render lbl('st_employer')}</p>
      <p class="font-bold">{salon.name}</p>
      {#if salon.address}<p class="text-ink-muted">{salon.address}</p>{/if}
      {#if salon.licenseNo}<p class="text-sm text-ink-muted">Lic. {salon.licenseNo}</p>{/if}
    </div>
  </header>

  <section class="mb-6 grid gap-4 sm:grid-cols-2">
    <div>
      <p class="text-sm font-bold text-ink-muted">{@render lbl('st_employee')}</p>
      <p class="text-xl font-bold">{w.legalName}</p>
      <p class="text-base text-ink-muted">{w.displayName} · {w.occupation}</p>
    </div>
    <div>
      <p class="text-sm font-bold text-ink-muted">{@render lbl('pay_basis')}</p>
      <p class="text-base font-bold">{basis(t)}</p>
      {#if t2}<p class="text-sm text-ink-muted" lang={second}>{basis(t2)}</p>{/if}
    </div>
  </section>

  <section class="mb-6 rounded-2xl bg-brand-soft p-5" aria-label={t('st_total_label')}>
    <p class="text-base font-bold text-brand-strong">{@render lbl('st_total_label')}</p>
    <p class="mt-1 text-[2rem] leading-none font-bold">{fmtCents(r.totalCents)}</p>
    <p class="mt-2 text-base text-ink-muted">{t('gross_wages')} {fmtCents(r.grossWagesCents)} + {t('card_tips_owed')} {fmtCents(r.tipsCardOwedCents ?? r.tipsCardCents)}</p>
    {#if paid && (paid.cash || paid.check || paid.payroll)}<p class="mt-1 text-base font-bold">{t('st_paid_by')}: {paidHow(t)}</p>{/if}
  </section>

  <section class="mb-6">
    <h2 class="mb-2 text-lg font-bold">{@render lbl('st_summary')}</h2>
    <table class="table">
      <tbody>
        <tr><td>{@render lbl('hours')}</td><td class="num">{fmtMinutes(r.minutesWorked)} ({r.daysWorked} {t('days').toLowerCase()})</td></tr>
        <tr><td>{@render lbl('overtime_hours')}</td><td class="num {r.overtimeMinutes ? 'font-bold' : ''}">{fmtHours(r.overtimeMinutes)}</td></tr>
        <tr><td>{@render lbl('sales')}</td><td class="num">{fmtCents(r.salesCents)}</td></tr>
        {#if r.commissionCents || w.commissionPct}<tr><td>{@render lbl('commission')} ({w.commissionPct}%)</td><td class="num">{fmtCents(r.commissionCents)}</td></tr>{/if}
        {#if r.baseCents}<tr><td>{@render lbl(w.payBasis === 'hourly' ? 'hourly_rate' : w.payBasis === 'guarantee_or_commission' ? 'guarantee' : 'day_rate')}</td><td class="num">{fmtCents(r.baseCents)}</td></tr>{/if}
        {#if r.minWageTopupCents}<tr class="text-owed-ink"><td>{@render lbl('min_wage_topup')}</td><td class="num font-bold">+ {fmtCents(r.minWageTopupCents)}</td></tr>{/if}
        {#if r.overtimePremiumCents}<tr class="text-owed-ink"><td>{@render lbl('overtime_premium')}</td><td class="num font-bold">+ {fmtCents(r.overtimePremiumCents)}</td></tr>{/if}
        {#if r.spreadOfHoursCents}<tr><td>{@render lbl('spread_of_hours')}</td><td class="num">+ {fmtCents(r.spreadOfHoursCents)}</td></tr>{/if}
        {#if r.deductionsCents}<tr><td>{@render lbl('deductions')}</td><td class="num">− {fmtCents(r.deductionsCents)}</td></tr>{/if}
        <tr class="font-bold"><td>{@render lbl('gross_wages')}</td><td class="num">{fmtCents(r.grossWagesCents)}</td></tr>
        <tr><td>{@render lbl('tip_card')}</td><td class="num">{fmtCents(r.tipsCardCents)}</td></tr>
        {#if r.tipsCardPaidOutCents}<tr><td class="pl-6">{@render lbl('tips_paid_out')}</td><td class="num">− {fmtCents(r.tipsCardPaidOutCents)}</td></tr>{/if}
        <tr><td>{@render lbl('tip_cash')}</td><td class="num">{fmtCents(r.tipsCashCents)}</td></tr>
      </tbody>
    </table>
    <p class="mt-2 text-sm text-ink-muted">{t('st_tips_note')}{#if t2} · <span lang={second}>{t2('st_tips_note')}</span>{/if}</p>
  </section>

  <section class="mb-6">
    <h2 class="mb-2 text-lg font-bold">{@render lbl('st_hours_by_day')}</h2>
    <table class="table">
      <thead><tr><th>{t('date')}</th><th>{t('in')}</th><th>{t('out')}</th><th class="num">{t('hours')}</th></tr></thead>
      <tbody>
        {#each days as d}
          <tr><td>{fmtDate(d.date, locale)}</td><td class="tabular-nums">{d.firstIn ? localTime(d.firstIn, tz) : '—'}</td><td class="tabular-nums">{d.lastOut ? localTime(d.lastOut, tz) : d.open ? t('still_in') : '—'}</td><td class="num">{fmtMinutes(d.minutes)}</td></tr>
        {:else}
          <tr><td colspan="4" class="text-ink-muted">{t('flag_NO_HOURS')}</td></tr>
        {/each}
        <tr class="font-bold"><td colspan="3">{t('total')}</td><td class="num">{fmtMinutes(r.minutesWorked)}</td></tr>
      </tbody>
    </table>
  </section>

  <section class="mb-6">
    <h2 class="mb-2 text-lg font-bold">{@render lbl('st_your_tickets')}</h2>
    {#if line.tickets.length === 0}
      <p class="text-base text-ink-muted">{t('no_tickets')}</p>
    {:else}
      <div class="overflow-x-auto">
        <table class="table table-compact">
          <thead><tr><th>{t('date')}</th><th>{t('service')}</th><th class="num">{t('price')}</th><th class="num">{t('tip_card')}</th><th class="num">{t('tip_cash')}</th></tr></thead>
          <tbody>
            {#each ticketsByDay as g}
              {#each g.tickets as tk, i}
                <tr>
                  <td class="whitespace-nowrap">{#if i === 0}<span class="font-bold">{fmtDate(g.date, locale)}</span><br />{/if}<span class="text-sm text-ink-muted tabular-nums">{localTime(tk.ts, tz)}{#if tk.ticketNo} · #{tk.ticketNo}{/if}</span></td>
                  <td>{tk.serviceName}</td>
                  <td class="num">{fmtCents(tk.priceCents)}</td>
                  <td class="num">{tk.tipCardCents ? fmtCents(tk.tipCardCents) : ''}</td>
                  <td class="num">{tk.tipCashCents ? fmtCents(tk.tipCashCents) : ''}</td>
                </tr>
              {/each}
            {/each}
            <tr class="font-bold"><td colspan="2">{t('total')} ({line.tickets.length})</td><td class="num">{fmtCents(r.salesCents)}</td><td class="num">{fmtCents(r.tipsCardCents)}</td><td class="num">{fmtCents(r.tipsCashCents)}</td></tr>
          </tbody>
        </table>
      </div>
    {/if}
  </section>

  <section class="mb-6 break-inside-avoid">
    <h2 class="mb-3 text-lg font-bold">{@render lbl('st_how_computed')}</h2>
    <Reasons breakdown={r.breakdown} {locale} {second} />
    {#if r.flags.length}<div class="mt-4"><FlagPills flags={r.flags} {locale} /></div>{/if}
  </section>

  <footer class="border-t border-line pt-4 text-sm text-ink-muted">
    <p>{t('st_questions', { date: generatedOn })}</p>
    {#if t2}<p lang={second}>{t2('st_questions', { date: generatedOn })}</p>{/if}
    <p class="mt-1">{t('not_legal_advice')}</p>
  </footer>
</article>
