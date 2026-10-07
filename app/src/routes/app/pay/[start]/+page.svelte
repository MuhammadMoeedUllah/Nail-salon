<script lang="ts">
  import { enhance } from '$app/forms';
  import { makeT } from '$lib/i18n';
  import { fmtCents, fmtDate, fmtMinutes, fmtRate, fmtHours } from '$lib/time';
  import { dollars } from '$lib/money';
  let { data, form } = $props();
  const t = $derived(makeT(data.locale));
  let paying = $state(false);
  let reopening = $state(false);
  const basisShort = (l: any) => {
    const w = l.worker;
    switch (w.payBasis) {
      case 'hourly': return `${fmtCents(w.hourlyRateCents)}/h${w.commissionPct ? ` + ${w.commissionPct}%` : ''}`;
      case 'day_rate': return `${fmtCents(w.dayRateCents)}/d`;
      case 'commission': return `${w.commissionPct}%`;
      case 'day_rate_plus_commission': return `${fmtCents(w.dayRateCents)}/d + ${w.commissionPct}%`;
      case 'guarantee_or_commission': return `${fmtCents(w.guaranteeCents)}/wk ∨ ${w.commissionPct}%`;
    }
    return '';
  };
</script>

<svelte:head><title>{t('pay_week')} {fmtDate(data.start, data.locale)}</title></svelte:head>

<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
  <div>
    <a class="text-sm text-stone-500 underline" href="/app/pay">← {t('pay_title')}</a>
    <h1 class="text-2xl font-bold">{t('pay_week')}: {fmtDate(data.start, data.locale)} – {fmtDate(data.end, data.locale)}
      <span class="badge ml-2 align-middle {data.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : data.status === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-700'}">{t(`pay_status_${data.status}` as any)}</span>
    </h1>
  </div>
  <div class="flex flex-wrap gap-2">
    {#if data.status !== 'draft'}
      <a class="btn-secondary" href="/app/pay/{data.start}/export?format=gusto">⇩ Gusto CSV</a>
      <a class="btn-secondary" href="/app/pay/{data.start}/export?format=adp">⇩ ADP RUN CSV</a>
      <a class="btn-secondary" href="/app/pay/{data.start}/export?format=generic">⇩ {t('payroll_export')}</a>
    {/if}
    {#if data.status === 'draft'}
      <form method="post" action="?/approve" use:enhance><button class="btn-primary" disabled={data.isCurrentWeek && data.totals.minutes === 0}>{t('pay_approve')}</button></form>
    {:else if data.status === 'approved'}
      <button class="btn-primary" onclick={() => (paying = !paying)}>{t('pay_mark_paid')}</button>
      <button class="btn-secondary" onclick={() => (reopening = !reopening)}>{t('pay_reopen')}</button>
    {:else}
      <button class="btn-secondary" onclick={() => (reopening = !reopening)}>{t('pay_reopen')}</button>
    {/if}
  </div>
</div>

{#if data.status === 'draft'}<p class="mb-3 text-sm text-stone-600">{t('pay_approve_hint')}</p>{/if}
{#if data.isCurrentWeek && data.status === 'draft'}<p class="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t('this_week')} · {t('today')}: {fmtDate(data.today, data.locale)}</p>{/if}
{#if form?.error}<p class="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error === 'reason_required' ? t('reason_hint') : t('invalid')}</p>{/if}

{#if reopening}
  <form method="post" action="?/reopen" use:enhance class="card mb-4 flex flex-wrap items-end gap-3">
    <div class="grow"><label class="label" for="ro">{t('reason')}</label><input class="input" id="ro" name="reason" required placeholder={t('reason_hint')} /></div>
    <button class="btn-danger">{t('pay_reopen')}</button>
    <button type="button" class="btn-ghost" onclick={() => (reopening = false)}>{t('cancel')}</button>
  </form>
{/if}

<div class="mb-4 grid gap-3 sm:grid-cols-5">
  <div class="card py-3"><div class="text-xs uppercase text-stone-500">{t('hours')}</div><div class="text-xl font-bold tabular-nums">{fmtMinutes(data.totals.minutes)}</div></div>
  <div class="card py-3"><div class="text-xs uppercase text-stone-500">{t('gross_wages')}</div><div class="text-xl font-bold tabular-nums">{fmtCents(data.totals.gross)}</div></div>
  <div class="card py-3"><div class="text-xs uppercase text-stone-500">{t('tip_card')}</div><div class="text-xl font-bold tabular-nums">{fmtCents(data.totals.tipsCard)}</div></div>
  <div class="card py-3"><div class="text-xs uppercase text-stone-500">{t('tip_cash')}</div><div class="text-xl font-bold tabular-nums">{fmtCents(data.totals.tipsCash)}</div></div>
  <div class="card py-3 {data.totals.owed > 0 ? 'ring-2 ring-red-300' : ''}"><div class="text-xs uppercase text-stone-500">{t('owed_by_law')}</div><div class="text-xl font-bold tabular-nums {data.totals.owed > 0 ? 'text-red-700' : 'text-emerald-700'}">{fmtCents(data.totals.owed)}</div></div>
</div>

<form method="post" action="?/pay" use:enhance>
  <div class="card overflow-x-auto p-0">
    <table class="table">
      <thead>
        <tr>
          <th>{t('technician')}</th><th class="hidden xl:table-cell">{t('pay_basis')}</th>
          <th class="text-right">{t('days')}</th><th class="text-right">{t('hours')}</th><th class="text-right">{t('overtime_hours')}</th>
          <th class="text-right">{t('sales')}</th><th class="text-right">{t('commission')}</th><th class="text-right">{t('day_rate')}/{t('guarantee')}</th>
          <th class="text-right">{t('regular_rate')}</th><th class="text-right">{t('min_wage_topup')}</th><th class="text-right">{t('overtime_premium')}</th>
          <th class="text-right">{t('gross_wages')}</th><th class="text-right">{t('tip_card')}</th><th class="text-right">{t('tip_cash')}</th><th class="text-right">{t('total_pay')}</th>
          {#if paying}<th>{t('cash')}</th><th>{t('paid_check')}</th><th>{t('paid_payroll')}</th>{/if}
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each data.lines as l (l.worker.id)}
          {@const r = l.result}
          <tr>
            <td class="font-semibold">
              <a class="text-brand-800 underline decoration-brand-200 underline-offset-2" href="/app/pay/{data.start}/{l.worker.id}">{l.worker.displayName}</a>
              {#if r.flags.length}
                <div class="mt-1 flex flex-wrap gap-1">
                  {#each r.flags as f}<span class="badge {f === 'OT_OWED' || f === 'MIN_WAGE_TOPUP' ? 'bg-red-100 text-red-800' : f === 'OPEN_PUNCH' || f === 'TICKETS_WITHOUT_HOURS' || f === 'LONG_DAY' ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-700'}" title={t(`flag_${f}` as any)}>{t(`flag_${f}` as any)}</span>{/each}
                </div>
              {/if}
            </td>
            <td class="hidden text-xs text-stone-600 xl:table-cell">{basisShort(l)}</td>
            <td class="text-right tabular-nums">{r.daysWorked}</td>
            <td class="text-right tabular-nums">{fmtHours(r.minutesWorked)}</td>
            <td class="text-right tabular-nums {r.overtimeMinutes ? 'cell-owed' : ''}">{r.overtimeMinutes ? fmtHours(r.overtimeMinutes) : '—'}</td>
            <td class="text-right tabular-nums">{fmtCents(r.salesCents)}</td>
            <td class="text-right tabular-nums">{fmtCents(r.commissionCents)}</td>
            <td class="text-right tabular-nums">{r.baseCents ? fmtCents(r.baseCents) : '—'}</td>
            <td class="text-right tabular-nums text-xs">{r.minutesWorked ? fmtRate(r.regularRate) : '—'}</td>
            <td class="text-right tabular-nums {r.minWageTopupCents ? 'cell-owed' : ''}">{r.minWageTopupCents ? fmtCents(r.minWageTopupCents) : '—'}</td>
            <td class="text-right tabular-nums {r.overtimePremiumCents ? 'cell-owed' : ''}">{r.overtimePremiumCents ? fmtCents(r.overtimePremiumCents) : '—'}</td>
            <td class="text-right font-semibold tabular-nums">{fmtCents(r.grossWagesCents)}</td>
            <td class="text-right tabular-nums">{fmtCents(r.tipsCardCents)}</td>
            <td class="text-right tabular-nums">{fmtCents(r.tipsCashCents)}</td>
            <td class="text-right font-bold tabular-nums">{fmtCents(r.totalCents)}</td>
            {#if paying}
              <td><input class="input w-24 py-1" name="cash_{l.worker.id}" inputmode="decimal" value={l.paid?.cash ? dollars(l.paid.cash) : ''} /></td>
              <td><input class="input w-24 py-1" name="check_{l.worker.id}" inputmode="decimal" value={l.paid?.check ? dollars(l.paid.check) : dollars(r.totalCents)} /></td>
              <td><input class="input w-24 py-1" name="payroll_{l.worker.id}" inputmode="decimal" value={l.paid?.payroll ? dollars(l.paid.payroll) : ''} /></td>
            {/if}
            <td class="whitespace-nowrap text-right">
              <a class="text-brand-700 underline" href="/app/pay/{data.start}/{l.worker.id}">{t('statement')}</a>
              {#if l.paid?.on}<div class="text-xs text-stone-500">{t('pay_paid_on')} {l.paid.on}</div>{/if}
            </td>
          </tr>
        {:else}
          <tr><td colspan="16" class="text-stone-500">{t('none_yet')}</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
  {#if paying}
    <div class="card mt-3 flex flex-wrap items-end gap-3">
      <div><label class="label" for="paidOn">{t('pay_paid_on')}</label><input class="input" id="paidOn" name="paidOn" type="date" value={data.paidOn ?? data.today} required /></div>
      <button class="btn-primary">{t('pay_mark_paid')}</button>
      <button type="button" class="btn-ghost" onclick={() => (paying = false)}>{t('cancel')}</button>
      <p class="text-xs text-stone-500">{t('paid_cash')} / {t('paid_check')} / {t('paid_payroll')}</p>
    </div>
  {/if}
</form>

<details class="card mt-4">
  <summary class="cursor-pointer font-semibold">{t('rules_used')}</summary>
  <table class="table mt-2">
    <thead><tr><th>{t('state')}</th><th></th><th></th><th>{t('effective')}</th><th>{t('source')}</th><th>{t('checked')}</th></tr></thead>
    <tbody>
      {#each data.rules as e}
        <tr><td>{e.jurisdiction}{e.region ? ' · ' + e.region : ''}</td><td>{e.key}</td><td class="tabular-nums">{e.key === 'min_wage' ? fmtCents(Number(e.value)) + t('per_hour') : e.value + (e.unit === 'hours' ? ' ' + t('hours_unit') : '')}</td><td>{e.effective_from}</td><td><a class="underline" href={e.source_url} target="_blank" rel="noopener">{e.source_title}</a></td><td>{e.checked_on}</td></tr>
      {/each}
    </tbody>
  </table>
  <p class="mt-2 text-xs text-stone-500">{t('not_legal_advice')}</p>
</details>
