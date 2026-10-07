<script lang="ts">
  import { makeT, type Locale } from '$lib/i18n';
  import { fmtCents, fmtDate, fmtDateLong, fmtHours, fmtMinutes, fmtRate, localTime } from '$lib/time';
  let {
    locale,
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
  const r = $derived(line.result);
  const w = $derived(line.worker);
  const days = $derived((line.days as any[]).filter((d) => d.minutes > 0 || d.open || d.punchCount));
  const ticketsByDay = $derived(
    days.map((d) => ({ date: d.date, tickets: (line.tickets as any[]).filter((tk) => tk.workDate === d.date) })).concat(
      // tickets on days with no hours
      [...new Set((line.tickets as any[]).map((tk) => tk.workDate))]
        .filter((date) => !days.some((d) => d.date === date))
        .map((date) => ({ date, tickets: (line.tickets as any[]).filter((tk) => tk.workDate === date) }))
    )
  );
  const basisText = $derived.by(() => {
    switch (w.payBasis) {
      case 'hourly': return `${t('hourly_rate')} ${fmtCents(w.hourlyRateCents)}${t('per_hour')}${w.commissionPct ? ` + ${t('commission')} ${w.commissionPct}%` : ''}`;
      case 'day_rate': return `${t('day_rate')} ${fmtCents(w.dayRateCents)}${t('per_day')}`;
      case 'commission': return `${t('commission')} ${w.commissionPct}%`;
      case 'day_rate_plus_commission': return `${t('day_rate')} ${fmtCents(w.dayRateCents)}${t('per_day')} + ${t('commission')} ${w.commissionPct}%`;
      case 'guarantee_or_commission': return `${t('guarantee')} ${fmtCents(w.guaranteeCents)}${t('per_week')} / ${t('commission')} ${w.commissionPct}%`;
    }
    return w.payBasis;
  });
  const lineLabel = (key: string) =>
    ({
      commission: t('commission'),
      hourly_base: t('hourly_rate'),
      day_rate_base: t('day_rate'),
      guarantee: t('guarantee'),
      regular_rate: t('regular_rate'),
      min_wage_topup: t('min_wage_topup'),
      overtime_premium: t('overtime_premium'),
      spread_of_hours: t('spread_of_hours'),
      gross_wages: t('gross_wages'),
      tips: t('tips')
    })[key] ?? key;
  const fmtInput = (k: string, v: any) => {
    if (typeof v !== 'number') return String(v);
    if (k.endsWith('Cents')) return fmtCents(v);
    if (k === 'minutes' || k.endsWith('Minutes')) return `${fmtHours(v)} ${t('hours_unit')}`;
    if (k === 'regularRate') return fmtRate(v);
    if (k.endsWith('Pct')) return `${v}%`;
    return String(v);
  };
</script>

<article class="statement mx-auto max-w-3xl bg-white p-6 text-stone-900 print:p-0">
  <header class="mb-5 flex items-start justify-between border-b border-stone-300 pb-4">
    <div>
      <h1 class="text-2xl font-bold">{t('statement')}</h1>
      <p class="text-sm text-stone-600">{t('st_period')}: <strong>{fmtDateLong(period.start, locale)} – {fmtDateLong(period.end, locale)}</strong></p>
      <p class="text-xs text-stone-500">{t('st_version')} {version} · {t(`pay_status_${status}` as any)}{#if paid?.on} · {t('pay_paid_on')} {paid.on}{/if}</p>
    </div>
    <div class="text-right text-sm">
      <div class="font-semibold">{t('st_employer')}</div>
      <div>{salon.name}</div>
      {#if salon.address}<div class="text-stone-600">{salon.address}</div>{/if}
      {#if salon.licenseNo}<div class="text-xs text-stone-500">Lic. {salon.licenseNo}</div>{/if}
    </div>
  </header>

  <section class="mb-5 grid grid-cols-2 gap-4 text-sm">
    <div><div class="text-xs uppercase text-stone-500">{t('st_employee')}</div><div class="text-lg font-bold">{w.legalName}</div><div class="text-stone-600">{w.displayName} · {w.occupation}</div></div>
    <div><div class="text-xs uppercase text-stone-500">{t('pay_basis')}</div><div class="font-semibold">{basisText}</div></div>
  </section>

  <section class="mb-5">
    <h2 class="mb-2 font-bold">{t('st_summary')}</h2>
    <table class="table">
      <tbody>
        <tr><td>{t('hours')} ({t('days')}: {r.daysWorked})</td><td class="text-right tabular-nums">{fmtMinutes(r.minutesWorked)} ({fmtHours(r.minutesWorked)} {t('hours_unit')})</td></tr>
        <tr><td>{t('regular_hours')} / {t('overtime_hours')}</td><td class="text-right tabular-nums">{fmtHours(r.regularMinutes)} / <strong>{fmtHours(r.overtimeMinutes)}</strong></td></tr>
        <tr><td>{t('sales')}</td><td class="text-right tabular-nums">{fmtCents(r.salesCents)}</td></tr>
        {#if r.commissionCents || w.commissionPct}<tr><td>{t('commission')} ({w.commissionPct}%)</td><td class="text-right tabular-nums">{fmtCents(r.commissionCents)}</td></tr>{/if}
        {#if r.baseCents}<tr><td>{w.payBasis === 'hourly' ? t('hourly_rate') : w.payBasis === 'guarantee_or_commission' ? t('guarantee') : t('day_rate')}</td><td class="text-right tabular-nums">{fmtCents(r.baseCents)}</td></tr>{/if}
        <tr><td>{t('regular_rate')}</td><td class="text-right tabular-nums">{r.minutesWorked ? fmtRate(r.regularRate) : '—'}</td></tr>
        {#if r.minWageTopupCents}<tr class="text-red-700"><td>{t('min_wage_topup')}</td><td class="text-right tabular-nums">+ {fmtCents(r.minWageTopupCents)}</td></tr>{/if}
        {#if r.overtimePremiumCents}<tr class="text-red-700"><td>{t('overtime_premium')} ({fmtHours(r.overtimeMinutes)} {t('hours_unit')} × ½ × {fmtRate(r.regularRate)})</td><td class="text-right tabular-nums">+ {fmtCents(r.overtimePremiumCents)}</td></tr>{/if}
        {#if r.spreadOfHoursCents}<tr><td>{t('spread_of_hours')}</td><td class="text-right tabular-nums">+ {fmtCents(r.spreadOfHoursCents)}</td></tr>{/if}
        {#if r.deductionsCents}<tr><td>{t('deductions')}</td><td class="text-right tabular-nums">− {fmtCents(r.deductionsCents)}</td></tr>{/if}
        <tr class="font-bold"><td>{t('gross_wages')}</td><td class="text-right tabular-nums">{fmtCents(r.grossWagesCents)}</td></tr>
        <tr><td>{t('tip_card')}</td><td class="text-right tabular-nums">{fmtCents(r.tipsCardCents)}</td></tr>
        {#if r.tipsCardPaidOutCents}
          <tr class="text-stone-600"><td class="pl-6">{t('tips_paid_out')}</td><td class="text-right tabular-nums">− {fmtCents(r.tipsCardPaidOutCents)}</td></tr>
          <tr><td class="pl-6">{t('card_tips_owed_label')}</td><td class="text-right tabular-nums">{fmtCents(r.tipsCardOwedCents)}</td></tr>
        {/if}
        <tr><td>{t('tip_cash')}</td><td class="text-right tabular-nums">{fmtCents(r.tipsCashCents)}</td></tr>
        <tr class="text-lg font-bold"><td>{t('total_pay')} ({t('gross_wages')} + {t('card_tips_owed')})</td><td class="text-right tabular-nums">{fmtCents(r.totalCents)}</td></tr>
        {#if paid && (paid.cash || paid.check || paid.payroll)}
          <tr><td>{t('st_paid_by')}</td><td class="text-right tabular-nums">{#if paid.cash}{t('cash')} {fmtCents(paid.cash)} {/if}{#if paid.check}{t('paid_check')} {fmtCents(paid.check)} {/if}{#if paid.payroll}{t('paid_payroll')} {fmtCents(paid.payroll)}{/if}</td></tr>
        {/if}
      </tbody>
    </table>
    <p class="mt-1 text-xs text-stone-500">{t('st_tips_note')}</p>
  </section>

  <section class="mb-5">
    <h2 class="mb-2 font-bold">{t('st_hours_by_day')}</h2>
    <table class="table">
      <thead><tr><th>{t('date')}</th><th>{t('in')}</th><th>{t('out')}</th><th class="text-right">{t('hours')}</th></tr></thead>
      <tbody>
        {#each days as d}
          <tr><td>{fmtDate(d.date, locale)}</td><td class="tabular-nums">{d.firstIn ? localTime(d.firstIn, tz) : '—'}</td><td class="tabular-nums">{d.lastOut ? localTime(d.lastOut, tz) : d.open ? t('still_in') : '—'}</td><td class="text-right tabular-nums">{fmtMinutes(d.minutes)}</td></tr>
        {:else}
          <tr><td colspan="4" class="text-stone-500">{t('flag_NO_HOURS')}</td></tr>
        {/each}
        <tr class="font-semibold"><td colspan="3">{t('total')}</td><td class="text-right tabular-nums">{fmtMinutes(r.minutesWorked)}</td></tr>
      </tbody>
    </table>
  </section>

  <section class="mb-5">
    <h2 class="mb-2 font-bold">{t('st_your_tickets')}</h2>
    {#if line.tickets.length === 0}
      <p class="text-sm text-stone-500">{t('no_tickets')}</p>
    {:else}
      <table class="table text-xs">
        <thead><tr><th>{t('date')}</th><th>{t('time')}</th><th>{t('ticket_no')}</th><th>{t('service')}</th><th class="text-right">{t('price')}</th><th class="text-right">{t('tip_card')}</th><th class="text-right">{t('tip_cash')}</th></tr></thead>
        <tbody>
          {#each ticketsByDay as g}
            {#each g.tickets as tk, i}
              <tr><td>{i === 0 ? fmtDate(g.date, locale) : ''}</td><td class="tabular-nums">{localTime(tk.ts, tz)}</td><td>{tk.ticketNo ?? ''}</td><td>{tk.serviceName}</td><td class="text-right tabular-nums">{fmtCents(tk.priceCents)}</td><td class="text-right tabular-nums">{tk.tipCardCents ? fmtCents(tk.tipCardCents) : ''}</td><td class="text-right tabular-nums">{tk.tipCashCents ? fmtCents(tk.tipCashCents) : ''}</td></tr>
            {/each}
          {/each}
          <tr class="font-semibold"><td colspan="4">{t('total')} ({line.tickets.length})</td><td class="text-right tabular-nums">{fmtCents(r.salesCents)}</td><td class="text-right tabular-nums">{fmtCents(r.tipsCardCents)}</td><td class="text-right tabular-nums">{fmtCents(r.tipsCashCents)}</td></tr>
        </tbody>
      </table>
    {/if}
  </section>

  <section class="mb-5 break-inside-avoid">
    <h2 class="mb-2 font-bold">{t('st_how_computed')}</h2>
    <table class="table text-xs">
      <tbody>
        {#each r.breakdown as b}
          <tr>
            <td class="font-semibold">{lineLabel(b.key)}</td>
            <td class="text-stone-600">{Object.entries(b.inputs).map(([k, v]) => `${k}: ${fmtInput(k, v)}`).join(' · ')}</td>
            <td class="text-right tabular-nums">{b.resultCents !== undefined ? fmtCents(b.resultCents) : b.resultRate !== undefined ? fmtRate(b.resultRate) : ''}</td>
            <td class="text-stone-500">{b.rule ?? ''}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if r.flags.length}
      <p class="mt-2 text-xs text-stone-600">{t('flags')}: {r.flags.map((f: string) => t(`flag_${f}` as any)).join(' · ')}</p>
    {/if}
  </section>

  <footer class="border-t border-stone-300 pt-3 text-xs text-stone-500">
    <p>{t('st_questions', { date: generatedOn })}</p>
    <p>{t('not_legal_advice')}</p>
  </footer>
</article>
