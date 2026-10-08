<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import { tick } from 'svelte';
  import { makeT } from '$lib/i18n';
  import { dollars } from '$lib/money';
  import { fmtCents, fmtDate, fmtHours, fmtMinutes, fmtRate, fmtWeekday } from '$lib/time';
  import { busy } from '$lib/ui/forms';
  import PageHeader from '$lib/ui/PageHeader.svelte';
  import Menu from '$lib/ui/Menu.svelte';
  import Banner from '$lib/ui/Banner.svelte';
  import KeyNumber from '$lib/ui/KeyNumber.svelte';
  import StatusStepper from '$lib/ui/StatusStepper.svelte';
  import SegmentedControl from '$lib/ui/SegmentedControl.svelte';
  import DataTable from '$lib/ui/DataTable.svelte';
  import ConfirmButton from '$lib/ui/ConfirmButton.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Avatar from '$lib/ui/Avatar.svelte';
  import WeekTechCard from '$lib/pay-ui/WeekTechCard.svelte';
  import FlagPills from '$lib/pay-ui/FlagPills.svelte';
  import Reasons from '$lib/pay-ui/Reasons.svelte';
  import PaySheet from '$lib/pay-ui/PaySheet.svelte';
  import ReopenSheet from '$lib/pay-ui/ReopenSheet.svelte';
  import { IconDownload, IconHistory, IconApprove, IconPaid, IconMessage, IconToday, IconFile, IconNext, IconOwed } from '$lib/ui/icons';

  let { data, form } = $props();
  const t = $derived(makeT(data.locale));
  const L = $derived(data.locale);
  const focus = $derived(page.url.searchParams.get('focus'));
  const unsent = $derived(data.lines.filter((l) => !l.sentAt).length);
  const step = $derived(data.status === 'draft' ? 0 : data.status === 'approved' ? 1 : unsent > 0 ? 2 : 3);
  const steps = $derived([t('py_step_draft'), t('py_step_approved'), t('py_step_paid'), t('py_step_sent')]);
  // what blocks approval and what is worth a look, with links to the day to fix it
  const problems = $derived.by(() => {
    const block: { text: string; href: string }[] = [];
    const warn: { text: string; href: string }[] = [];
    for (const l of data.lines) {
      for (const d of l.days) {
        if (d.open) block.push({ text: t('py_open_on', { name: l.worker.displayName, day: fmtWeekday(d.date, L) }), href: `/app/today?date=${d.date}` });
        else if (d.minutes === 0 && l.tickets.some((x) => x.workDate === d.date)) warn.push({ text: t('py_tickets_no_hours_on', { name: l.worker.displayName, day: fmtWeekday(d.date, L) }), href: `/app/today?date=${d.date}` });
      }
      for (const date of new Set(l.tickets.map((x) => x.workDate)))
        if (!l.days.some((d) => d.date === date)) warn.push({ text: t('py_tickets_no_hours_on', { name: l.worker.displayName, day: fmtWeekday(date, L) }), href: `/app/today?date=${date}` });
    }
    return { block, warn };
  });
  const blocked = $derived(data.status === 'draft' && problems.block.length > 0);
  const empty = $derived(data.totals.minutes === 0 && data.lines.every((l) => l.result.salesCents === 0));
  let view = $state('summary');
  let payOpen = $state(false);
  let reopenOpen = $state(false);
  const exportItems = $derived([
    { label: 'Gusto CSV', icon: IconDownload, href: `/app/pay/${data.start}/export?format=gusto`, reload: true },
    { label: 'ADP RUN CSV', icon: IconDownload, href: `/app/pay/${data.start}/export?format=adp`, reload: true },
    { label: t('payroll_export'), icon: IconDownload, href: `/app/pay/${data.start}/export?format=generic`, reload: true }
  ]);
  const menuItems = $derived(data.status === 'draft' ? [] : [...exportItems, { label: t('py_reopen_title'), icon: IconHistory, onSelect: () => (reopenOpen = true), danger: true }]);

  $effect(() => {
    const f = focus;
    if (f) tick().then(() => document.getElementById(`line-${f}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  });
</script>

<svelte:head><title>{t('py_week_title', { start: fmtDate(data.start, L), end: fmtDate(data.end, L) })}</title></svelte:head>

<PageHeader back={{ href: '/app/pay', label: t('pay_title') }} title={t('py_week_title', { start: fmtDate(data.start, L), end: fmtDate(data.end, L) })}>
  {#snippet actions()}
    {#if menuItems.length}<Menu label={t('options')} items={menuItems} />{/if}
  {/snippet}
</PageHeader>

<div class="space-y-4">
  <div class="card px-4 py-3" data-testid="run-status"><StatusStepper {steps} current={step} label={t('py_steps_label')} /></div>

  {#if form?.error}
    <Banner kind="error">{form.error === 'open_punch' ? t('py_blocked') : form.error === 'reason_required' ? t('reason_hint') : t('something_wrong')}</Banner>
  {/if}
  {#if data.status === 'draft' && problems.block.length}
    <Banner kind="error" title={t('py_fix_first')}>
      <p class="mb-1">{t('py_blocked')}</p>
      <ul class="space-y-1">{#each problems.block as p}<li><a class="font-bold underline" href={p.href}>{p.text}</a></li>{/each}</ul>
    </Banner>
  {/if}
  {#if data.status === 'draft' && problems.warn.length}
    <Banner kind="warn" title={t('py_check_these')}>
      <ul class="space-y-1">{#each problems.warn as p}<li><a class="font-bold underline" href={p.href}>{p.text}</a></li>{/each}</ul>
    </Banner>
  {/if}
  {#if data.isCurrentWeek && data.status === 'draft'}
    <Banner kind="info" icon={IconToday}>{t('home_week_in_progress', { day: fmtWeekday(data.end, L, 'short') })}</Banner>
  {/if}

  <section class="card grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:items-center" aria-label={t('st_summary')}>
    <KeyNumber value={fmtCents(data.totals.owed)} label={data.totals.owed > 0 ? t('owed_by_law') : t('home_nothing_owed')} tone={data.totals.owed > 0 ? 'owed' : 'ok'} />
    <dl class="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
      <div><dt class="text-sm text-ink-muted">{t('total_pay')}</dt><dd class="text-lg font-bold">{fmtCents(data.totals.total)}</dd></div>
      <div><dt class="text-sm text-ink-muted">{t('gross_wages')}</dt><dd class="text-lg font-bold">{fmtCents(data.totals.gross)}</dd></div>
      <div><dt class="text-sm text-ink-muted">{t('hours')}</dt><dd class="text-lg font-bold">{fmtMinutes(data.totals.minutes)}</dd></div>
      <div><dt class="text-sm text-ink-muted">{t('tip_card')}</dt><dd class="text-lg font-bold">{fmtCents(data.totals.tipsCard)}</dd></div>
      <div><dt class="text-sm text-ink-muted">{t('tip_cash')}</dt><dd class="text-lg font-bold">{fmtCents(data.totals.tipsCash)}</dd></div>
    </dl>
  </section>

  <!-- phones and portrait tablets: one card per technician -->
  <div class="space-y-3 lg:hidden">
    {#each data.lines as l (l.worker.id)}
      <WeekTechCard line={l} start={data.start} locale={L} focused={focus === l.worker.id} />
    {/each}
  </div>

  <!-- wide screens: the table, summary first -->
  <section class="hidden space-y-3 lg:block">
    <SegmentedControl label={t('details')} bind:value={view} class="max-w-xl" options={[{ value: 'summary', label: t('py_view_summary') }, { value: 'full', label: t('py_view_full') }, { value: 'rules', label: t('rules_used') }]} />
    {#if view === 'rules'}
      <DataTable caption={t('rules_used')}>
        <thead><tr><th>{t('state')}</th><th>{t('rules_used')}</th><th class="num">{t('effective')}</th><th>{t('source')}</th><th class="num">{t('checked')}</th></tr></thead>
        <tbody>
          {#each data.rules as e}
            <tr>
              <td>{e.jurisdiction}{e.region ? ' · ' + e.region : ''}</td>
              <td><span class="font-bold">{e.key === 'min_wage' ? t('min_wage') : e.key === 'ot_weekly_threshold_hours' ? t('ot_after') : e.key}</span> · {e.key === 'min_wage' ? fmtCents(Number(e.value)) + t('per_hour') : e.value + (e.unit === 'hours' ? ' ' + t('hours_unit') : '')}</td>
              <td class="num">{e.effective_from}</td>
              <td><a class="font-bold text-brand-strong underline" href={e.source_url} target="_blank" rel="noopener">{e.source_title}</a></td>
              <td class="num">{e.checked_on}</td>
            </tr>
          {/each}
        </tbody>
      </DataTable>
    {:else}
      <DataTable caption={t('pay_week')} sticky pin>
        <thead>
          <tr>
            <th>{t('technician')}</th>
            <th class="num">{t('days')}</th>
            <th class="num">{t('hours')}</th>
            <th class="num">{t('overtime_hours')}</th>
            <th class="num">{t('sales')}</th>
            {#if view === 'full'}<th class="num">{t('commission')}</th><th class="num">{t('day_rate')}/{t('guarantee')}</th><th class="num">{t('regular_rate')}</th><th class="num">{t('min_wage_topup')}</th><th class="num">{t('overtime_premium')}</th>{/if}
            <th class="num">{t('gross_wages')}</th>
            <th class="num">{t('owed_by_law')}</th>
            <th class="num">{t('tips')}</th>
            <th class="num">{t('total_pay')}</th>
            <th><span class="sr-only">{t('statement')}</span></th>
          </tr>
        </thead>
        <tbody>
          {#each data.lines as l (l.worker.id)}
            {@const r = l.result}
            <tr id="line-{l.worker.id}" class={focus === l.worker.id ? 'bg-brand-soft' : ''}>
              <td class="min-w-56">
                <span class="flex items-center gap-2"><Avatar name={l.worker.displayName} id={l.worker.id} size={32} /><span class="font-bold">{l.worker.displayName}</span></span>
                {#if r.flags.length}
                  <details class="mt-1">
                    <summary class="inline-flex min-h-11 cursor-pointer items-center text-sm font-bold text-ink-muted">{t('py_notes', { n: r.flags.length })} · {t('py_reasons')}</summary>
                    <div class="mt-2 max-w-md space-y-3"><FlagPills flags={r.flags} locale={L} /><Reasons breakdown={r.breakdown} locale={L} /></div>
                  </details>
                {/if}
              </td>
              <td class="num">{r.daysWorked}</td>
              <td class="num">{fmtHours(r.minutesWorked)}</td>
              <td class="num {r.overtimeMinutes ? 'font-bold text-owed' : 'text-ink-muted'}">{r.overtimeMinutes ? fmtHours(r.overtimeMinutes) : '—'}</td>
              <td class="num">{fmtCents(r.salesCents)}</td>
              {#if view === 'full'}
                <td class="num">{fmtCents(r.commissionCents)}</td>
                <td class="num">{r.baseCents ? fmtCents(r.baseCents) : '—'}</td>
                <td class="num">{r.minutesWorked ? fmtRate(r.regularRate) : '—'}</td>
                <td class="num {r.minWageTopupCents ? 'font-bold text-owed' : 'text-ink-muted'}">{r.minWageTopupCents ? fmtCents(r.minWageTopupCents) : '—'}</td>
                <td class="num {r.overtimePremiumCents ? 'font-bold text-owed' : 'text-ink-muted'}">{r.overtimePremiumCents ? fmtCents(r.overtimePremiumCents) : '—'}</td>
              {/if}
              <td class="num">{fmtCents(r.grossWagesCents)}</td>
              <td class="num">{#if l.owedCents}<span class="inline-flex items-center gap-1 font-bold text-owed"><IconOwed size={16} />{fmtCents(l.owedCents)}</span>{:else}<span class="text-ink-muted">—</span>{/if}</td>
              <td class="num">{fmtCents(r.tipsCardCents + r.tipsCashCents)}</td>
              <td class="num font-bold">{fmtCents(r.totalCents)}</td>
              <td><a href="/app/pay/{data.start}/{l.worker.id}" class="btn-secondary min-h-11 px-3 text-base"><IconFile size={18} />{t('statement')}</a></td>
            </tr>
          {/each}
        </tbody>
      </DataTable>
    {/if}
  </section>

  <details class="card p-4 lg:hidden">
    <summary class="flex min-h-11 cursor-pointer items-center text-base font-bold">{t('rules_used')}</summary>
    <ul class="mt-2 space-y-2 text-base">
      {#each data.rules as e}
        <li><span class="font-bold">{e.key === 'min_wage' ? t('min_wage') : e.key === 'ot_weekly_threshold_hours' ? t('ot_after') : e.key}</span> · {e.key === 'min_wage' ? fmtCents(Number(e.value)) + t('per_hour') : e.value + (e.unit === 'hours' ? ' ' + t('hours_unit') : '')} · <a class="text-brand-strong underline" href={e.source_url} target="_blank" rel="noopener">{e.source_title}</a></li>
      {/each}
    </ul>
  </details>

  <div class="h-24 lg:h-4" aria-hidden="true"></div>
</div>

<!-- one action at a time, always within thumb reach (R3, R12) -->
<div class="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:sticky lg:bottom-0 lg:-mx-8 lg:mt-4 lg:px-8">
  <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-end gap-2">
    {#if data.status === 'draft'}
      <form method="post" action="?/approve" use:enhance={busy()} class="w-full sm:w-auto">
        {#if blocked || empty}
          <Button variant="primary" size="lg" block disabled icon={IconApprove}>{t('py_approve', { amount: fmtCents(data.totals.total) })}</Button>
        {:else}
          <ConfirmButton size="lg" block icon={IconApprove} label={t('py_approve', { amount: fmtCents(data.totals.total) })} confirmLabel={t('py_approve_confirm', { amount: fmtCents(data.totals.total) })} cancelLabel={t('cancel')} hint={t('py_approve_hint')} />
        {/if}
      </form>
    {:else if data.status === 'approved'}
      <Button size="lg" onclick={() => (payOpen = true)}>{t('py_adjust')}</Button>
      <form method="post" action="?/pay" use:enhance={busy()} class="w-full sm:w-auto">
        <input type="hidden" name="paidOn" value={data.today} />
        {#each data.lines as l}<input type="hidden" name="check_{l.worker.id}" value={dollars(l.result.totalCents)} />{/each}
        <ConfirmButton size="lg" block icon={IconPaid} label={t('py_pay_check', { amount: fmtCents(data.totals.total) })} confirmLabel={t('py_pay_confirm', { amount: fmtCents(data.totals.total) })} cancelLabel={t('cancel')} />
      </form>
    {:else}
      {#if unsent > 0}
        <Button href="/app/pay/{data.start}/send" variant="primary" size="lg" icon={IconMessage} iconRight={IconNext}>{t('py_send_count', { n: unsent })}</Button>
      {:else}
        <Button href="/app/pay/{data.start}/send" size="lg" icon={IconMessage}>{t('py_all_sent')}</Button>
      {/if}
    {/if}
  </div>
</div>

{#if data.status === 'approved'}
  <PaySheet bind:open={payOpen} lines={data.lines} lastMethods={data.lastMethods} today={data.today} locale={L} />
{/if}
<ReopenSheet bind:open={reopenOpen} locale={L} />
