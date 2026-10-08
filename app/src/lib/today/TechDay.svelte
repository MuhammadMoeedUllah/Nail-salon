<script lang="ts" module>
  export type Punch = { id: string; workerId: string; tsIn: string; tsOut: string | null; inLocal: string; outLocal: string | null; minutes: number; open: boolean; stale: boolean; manualBreakMinutes: number; tabletBreakMinutes: number; onBreak: boolean; source: string; photoIn: string | null; photoOut: string | null };
  export type Ticket = { id: string; workerId: string; time: string; ticketNo: string | null; serviceName: string; priceCents: number; tipCardCents: number; tipCashCents: number; tipCardPaidOut: boolean; source: string; voidedAt: string | null; voidReason: string | null };
</script>

<script lang="ts">
  import { makeT, type Locale } from '$lib/i18n';
  import { fmtCents, fmtClock, fmtMinutes } from '$lib/time';
  import Avatar from '$lib/ui/Avatar.svelte';
  import StatusPill from '$lib/ui/StatusPill.svelte';
  import { IconClockIn, IconBreak, IconOut, IconWarn, IconNext, IconEdit, IconClockOut, IconCashTips, IconAdd, IconVoid, IconCheck, IconCamera } from '$lib/ui/icons';

  type Status = { state: 'out' | 'in' | 'break'; staleOpen: boolean } | null;

  // One technician's day: status, shifts with fixes, tickets with void, card tips paid out (UX-23..25).
  let {
    worker,
    punches,
    tickets,
    locale,
    tz,
    isToday,
    expanded = $bindable(true),
    collapsible = false,
    focusId = null,
    onfix,
    onvoid,
    onaddhours,
    onclockout,
    onpayout
  }: {
    worker: { id: string; name: string; status: Status };
    punches: Punch[];
    tickets: Ticket[];
    locale: Locale;
    tz: string;
    isToday: boolean;
    expanded?: boolean;
    collapsible?: boolean;
    focusId?: string | null;
    onfix: (p: Punch) => void;
    onvoid: (t: Ticket) => void;
    onaddhours: () => void;
    onclockout: (p: Punch) => void;
    onpayout: (undo: boolean, amount: number) => void;
  } = $props();
  const t = $derived(makeT(locale));
  const live = $derived(tickets.filter((x) => !x.voidedAt));
  const voided = $derived(tickets.filter((x) => x.voidedAt));
  let showVoided = $state(false);
  const sales = $derived(live.reduce((s, x) => s + x.priceCents, 0));
  const tipCard = $derived(live.reduce((s, x) => s + x.tipCardCents, 0));
  const tipCash = $derived(live.reduce((s, x) => s + x.tipCashCents, 0));
  const paidOut = $derived(live.reduce((s, x) => s + (x.tipCardPaidOut ? x.tipCardCents : 0), 0));
  const minutes = $derived(punches.reduce((s, p) => s + p.minutes, 0));
  const st = $derived(worker.status);
  const srcLabel = (s: string) => (s === 'owner' ? t('td_src_owner') : s === 'tablet-offline' ? t('td_src_offline') : s === 'import' ? t('td_src_import') : '');
</script>

<article class="card p-0 {focusId && (punches.some((p) => p.id === focusId) || tickets.some((x) => x.id === focusId)) ? 'ring-2 ring-focus' : ''}" id="tech-{worker.id}">
  {#snippet head()}
    <Avatar name={worker.name} id={worker.id} size={44} />
    <span class="min-w-0 flex-1">
      <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="truncate text-lg font-bold">{worker.name}</span>
        {#if isToday && st}
          {#if st.staleOpen}<StatusPill kind="warn" icon={IconWarn}>{t('td_forgot_out')}</StatusPill>
          {:else if st.state === 'in'}<StatusPill kind="ok" icon={IconClockIn}>{t('td_in')}</StatusPill>
          {:else if st.state === 'break'}<StatusPill kind="warn" icon={IconBreak}>{t('td_on_break')}</StatusPill>
          {:else}<StatusPill kind="neutral" icon={IconOut}>{t('td_not_in')}</StatusPill>{/if}
        {/if}
      </span>
      <span class="mt-0.5 block text-sm text-ink-muted">
        {live.length === 1 ? t('kiosk_ticket_one') : t('kiosk_tickets_short', { n: live.length })} · {t('td_day_line', { sales: fmtCents(sales), tips: fmtCents(tipCard + tipCash), hours: fmtMinutes(minutes) })}
      </span>
    </span>
    {#if collapsible}<IconNext size={22} class="shrink-0 text-ink-muted transition-transform {expanded ? 'rotate-90' : ''}" />{/if}
  {/snippet}
  {#if collapsible}
    <button type="button" aria-expanded={expanded} onclick={() => (expanded = !expanded)} class="flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left hover:bg-sunken">{@render head()}</button>
  {:else}
    <div class="flex w-full items-center gap-3 px-4 py-3">{@render head()}</div>
  {/if}

  {#if expanded || !collapsible}
    <div class="space-y-3 border-t border-line px-4 pt-3 pb-4">
      {#if punches.length}
        <ul class="space-y-2">
          {#each punches as p (p.id)}
            <li class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 rounded-xl px-3 py-2 {p.stale ? 'bg-warn-soft' : 'bg-sunken'} {focusId === p.id ? 'ring-2 ring-focus' : ''}">
              {#if p.photoIn}<img src="/app/photos/{p.photoIn}" alt="" class="size-10 rounded-lg object-cover" loading="lazy" />{:else}<span class="flex size-10 items-center justify-center rounded-lg bg-line text-ink-muted" aria-hidden="true"><IconCamera size={18} /></span>{/if}
              <span class="min-w-0">
                <span class="block text-base font-bold tabular-nums">{fmtClock(p.tsIn, tz, locale)} → {p.tsOut ? fmtClock(p.tsOut, tz, locale) : p.stale ? t('td_forgot_out') : '…'}</span>
                <span class="block text-sm text-ink-muted">{fmtMinutes(p.minutes)} h{p.open && !p.stale ? ` ${t('td_running')}` : ''}{p.tabletBreakMinutes + p.manualBreakMinutes > 0 ? ` · ${t('td_break_short', { m: p.tabletBreakMinutes + p.manualBreakMinutes })}` : ''}{srcLabel(p.source) ? ` · ${srcLabel(p.source)}` : ''}</span>
              </span>
              <span class="col-span-2 flex flex-wrap gap-2">
                {#if p.open && isToday && !p.stale}
                  <button type="button" class="btn-secondary min-h-11 flex-1 px-3 text-base" onclick={() => onclockout(p)}><IconClockOut size={18} />{t('clock_out_now')}</button>
                {/if}
                <button type="button" class="{p.stale ? 'btn-primary' : 'btn-secondary'} min-h-11 flex-1 px-3 text-base" onclick={() => onfix(p)}><IconEdit size={18} />{t('fix_time')}</button>
              </span>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="flex items-center justify-between gap-2 rounded-xl bg-sunken px-3 py-2 text-base text-ink-muted">{t('td_no_clock_in')}</p>
      {/if}

      {#if live.length}
        <ul class="divide-y divide-line">
          {#each live as x (x.id)}
            <li class="flex items-center gap-3 py-2 {focusId === x.id ? 'rounded-lg ring-2 ring-focus' : ''}">
              <span class="min-w-0 flex-1">
                <span class="flex items-baseline justify-between gap-2">
                  <span class="truncate text-base font-bold">{x.serviceName}</span>
                  <span class="text-base font-bold tabular-nums">{fmtCents(x.priceCents)}</span>
                </span>
                <span class="flex flex-wrap items-center gap-x-2 text-sm text-ink-muted">
                  <span class="tabular-nums">{x.time}</span>
                  {#if x.ticketNo}<span>#{x.ticketNo}</span>{/if}
                  {#if x.tipCardCents}<span class="font-bold text-ink">{t('td_tip_card_short', { amount: fmtCents(x.tipCardCents) })}{#if x.tipCardPaidOut} · {t('td_paid_out_short')}{/if}</span>{/if}
                  {#if x.tipCashCents}<span class="font-bold text-ink">{t('td_tip_cash_short', { amount: fmtCents(x.tipCashCents) })}</span>{/if}
                  {#if x.source !== 'manual'}<span>· {t('td_src_import')}</span>{/if}
                </span>
              </span>
              <button type="button" class="btn-secondary min-h-11 px-3 text-base" onclick={() => onvoid(x)}><IconVoid size={18} />{t('void')}</button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-base text-ink-muted">{t('no_tickets')}</p>
      {/if}

      {#if voided.length}
        <button type="button" class="min-h-11 text-base font-bold text-ink-muted underline" onclick={() => (showVoided = !showVoided)}>{showVoided ? t('td_hide_voided') : t('td_voided_count', { n: voided.length })}</button>
        {#if showVoided}
          <ul class="space-y-1 text-base text-ink-muted">
            {#each voided as x (x.id)}<li><span class="line-through">{x.time} {x.serviceName} {fmtCents(x.priceCents)}</span> · {x.voidReason}</li>{/each}
          </ul>
        {/if}
      {/if}

      <div class="flex flex-wrap gap-2 pt-1">
        {#if tipCard > 0}
          {#if paidOut >= tipCard}
            <button type="button" class="btn min-h-11 rounded-full bg-ok-soft px-3 text-base text-ok-ink" onclick={() => onpayout(true, paidOut)}><IconCheck size={18} strokeWidth={3} />{t('tips_paid_out')} {fmtCents(paidOut)}</button>
          {:else}
            <button type="button" class="btn-secondary min-h-11 px-3 text-base" onclick={() => onpayout(false, tipCard - paidOut)}><IconCashTips size={18} />{t('tips_pay_out_btn')} · {fmtCents(tipCard - paidOut)}</button>
          {/if}
        {/if}
        <button type="button" class="btn-ghost min-h-11 px-3 text-base" onclick={onaddhours}><IconAdd size={18} />{t('td_add_hours')}</button>
      </div>
    </div>
  {/if}
</article>
