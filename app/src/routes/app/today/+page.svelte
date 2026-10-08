<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { tick } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import { makeT } from '$lib/i18n';
  import { fmtCents, fmtClock, fmtDateLong, fmtMinutes, fmtWeekday } from '$lib/time';
  import PageHeader from '$lib/ui/PageHeader.svelte';
  import Menu from '$lib/ui/Menu.svelte';
  import Sheet from '$lib/ui/Sheet.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import { toast } from '$lib/ui/toast.svelte';
  import { postAction } from '$lib/ui/actions';
  import DayStrip from '$lib/today/DayStrip.svelte';
  import TicketBuilder from '$lib/today/TicketBuilder.svelte';
  import TechDay, { type Punch, type Ticket } from '$lib/today/TechDay.svelte';
  import FixPunchSheet from '$lib/today/FixPunchSheet.svelte';
  import VoidSheet from '$lib/today/VoidSheet.svelte';
  import AddHoursSheet from '$lib/today/AddHoursSheet.svelte';
  import { IconCalendar, IconImport, IconAdd, IconOwed, IconDone, IconNext, IconCashTips, IconToday } from '$lib/ui/icons';

  let { data } = $props();
  const t = $derived(makeT(data.locale));
  const L = $derived(data.locale);
  const wide = new MediaQuery('min-width: 1024px', false);
  const isToday = $derived(data.date === data.today);
  const focus = $derived(page.url.searchParams.get('focus'));
  const nameOf = (id: string) => data.workers.find((w) => w.id === id)?.name ?? '';
  const active = $derived(data.workers.filter((w) => w.active).map((w) => ({ id: w.id, name: w.name })));
  // everyone active, plus anyone inactive who has records that day
  const people = $derived(data.workers.filter((w) => w.active || data.tickets.some((x) => x.workerId === w.id) || data.punches.some((p) => p.workerId === w.id)));
  const live = $derived(data.tickets.filter((x) => !x.voidedAt));
  const totals = $derived({
    sales: live.reduce((s, x) => s + x.priceCents, 0),
    tips: live.reduce((s, x) => s + x.tipCardCents + x.tipCashCents, 0),
    minutes: data.punches.reduce((s, p) => s + p.minutes, 0),
    unpaidCard: live.reduce((s, x) => s + (x.tipCardPaidOut ? 0 : x.tipCardCents), 0),
    unpaidPeople: new Set(live.filter((x) => x.tipCardCents && !x.tipCardPaidOut).map((x) => x.workerId)).size
  });
  const empty = $derived(data.tickets.length === 0 && data.punches.length === 0);

  let selected = $state('');
  let builderOpen = $state(false);
  let open = $state<Record<string, boolean>>({});
  let fixing = $state<Punch | null>(null);
  let fixOpen = $state(false);
  let voiding = $state<Ticket | null>(null);
  let voidOpen = $state(false);
  let hoursFor = $state('');
  let hoursOpen = $state(false);

  // deep links from Home (?focus=<punch or ticket id>) open that technician and scroll to them (UX-33)
  $effect(() => {
    const f = focus;
    if (!f) return;
    const owner = data.punches.find((p) => p.id === f)?.workerId ?? data.tickets.find((x) => x.id === f)?.workerId;
    if (!owner) return;
    open[owner] = true;
    tick().then(() => document.getElementById(`tech-${owner}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  });

  function pickDate(e: Event) {
    const v = (e.currentTarget as HTMLInputElement).value;
    if (v) goto(`?date=${v}`);
  }
  function onFixSaved(r: { id: string; deleted: boolean; before: { in: string; out: string; breakMinutes: number; voided: boolean } | null }) {
    const name = fixing ? nameOf(fixing.workerId) : '';
    const before = r.before;
    toast(r.deleted ? t('ts_deleted_shift') : t('ts_fixed', { name }), {
      undo: before ? () => postAction('?/fixPunch', { id: r.id, in: before.in, out: before.out, breakMinutes: String(before.breakMinutes), reason: t('ts_reason_undo') }) : undefined
    });
  }
  function onVoided(x: Ticket) {
    toast(t('ts_voided', { service: x.serviceName }), { undo: () => postAction('?/unvoidTicket', { id: x.id }) });
  }
  async function clockOut(p: Punch) {
    const r = await postAction('?/clockOutNow', { workerId: p.workerId });
    if (r.type === 'success') toast(t('ts_clocked_out', { name: nameOf(p.workerId), time: fmtClock(String(r.data?.ts ?? new Date().toISOString()), data.tz, L) }), { undo: () => postAction('?/reopenPunch', { id: p.id }) });
  }
  async function payOut(workerId: string, undo: boolean, amount: number) {
    const r = await postAction('?/payOutTips', { workerId, date: data.date, undo: undo ? '1' : '' });
    if (r.type !== 'success') return;
    if (undo) toast(t('ts_undone'), { kind: 'info' });
    else toast(t('ts_tips_paid', { amount: fmtCents(amount) }), { undo: () => postAction('?/payOutTips', { workerId, date: data.date, undo: '1' }) });
  }
  function addHours(workerId: string) {
    hoursFor = workerId;
    hoursOpen = true;
  }
</script>

<svelte:head><title>{isToday ? t('today') : fmtWeekday(data.date, L)} · {fmtDateLong(data.date, L)}</title></svelte:head>

<PageHeader title={isToday ? t('today') : fmtWeekday(data.date, L)} subtitle={isToday ? `${fmtWeekday(data.date, L)}, ${fmtDateLong(data.date, L)}` : fmtDateLong(data.date, L)}>
  {#snippet actions()}
    {#if !isToday}<a href="?date={data.today}" class="btn-secondary hidden px-3 sm:inline-flex"><IconToday size={20} />{t('td_back_today')}</a>{/if}
    <label class="btn-secondary relative size-12 !p-0" title={t('td_pick_date')}>
      <IconCalendar size={22} />
      <input type="date" class="absolute inset-0 cursor-pointer opacity-0" value={data.date} onchange={pickDate} aria-label={t('td_pick_date')} />
    </label>
    <Menu label={t('td_actions')} items={[{ label: t('import_csv'), icon: IconImport, href: '/app/tickets/import' }, { label: t('td_add_hours'), icon: IconAdd, onSelect: () => addHours('') }]} />
  {/snippet}
</PageHeader>

<div class="lg:grid lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
  <section class="card hidden p-5 lg:sticky lg:top-6 lg:block lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto" aria-labelledby="builder-h">
    <h2 id="builder-h" class="mb-4 text-xl font-bold">{t('add_ticket')}</h2>
    {#if wide.current}
      <TicketBuilder workers={active} services={data.services} date={data.date} locale={L} idPrefix="tbp" bind:selected keypad onadded={(l) => (open[l.workerId] = true)} />
    {/if}
  </section>

  <div class="space-y-4">
    <DayStrip days={data.weekDays} date={data.date} today={data.today} locale={L} prevLabel={t('td_prev_week')} nextLabel={t('td_next_week')} dataLabel={t('td_has_data')} />

    <section class="card p-4" aria-label={t('today')}>
      <dl class="grid grid-cols-3 gap-2 text-center">
        <div><dt class="text-sm text-ink-muted">{t('sales')}</dt><dd class="text-xl font-bold">{fmtCents(totals.sales)}</dd></div>
        <div><dt class="text-sm text-ink-muted">{t('tips')}</dt><dd class="text-xl font-bold">{fmtCents(totals.tips)}</dd></div>
        <div><dt class="text-sm text-ink-muted">{t('hours')}</dt><dd class="text-xl font-bold">{fmtMinutes(totals.minutes)}</dd></div>
      </dl>
      {#await data.week}
        <div class="mt-3 h-12 animate-pulse rounded-xl bg-sunken"></div>
      {:then w}
        <a href="/app/pay/{w.start}" class="mt-3 flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-base font-bold {w.owedCents > 0 ? 'bg-owed-soft text-owed-ink' : 'bg-ok-soft text-ok-ink'}">
          {#if w.owedCents > 0}<IconOwed size={20} class="shrink-0" />{t('td_this_week_owed', { amount: fmtCents(w.owedCents) })}{:else}<IconDone size={20} class="shrink-0" />{t('td_this_week_ok')}{/if}
          <span class="ml-auto flex shrink-0 items-center">{t('td_review')}<IconNext size={18} /></span>
        </a>
      {/await}
      {#if totals.unpaidPeople > 1}
        <button type="button" class="btn-secondary mt-3 min-h-12 w-full" onclick={() => payOut('*', false, totals.unpaidCard)}><IconCashTips size={20} />{t('td_pay_out_all', { amount: fmtCents(totals.unpaidCard) })}</button>
      {/if}
    </section>

    {#if empty}
      <div class="card">
        <EmptyState icon={IconToday} title={t('em_day_title', { day: fmtWeekday(data.date, L) })} text={t('em_day_text')}>
          <button type="button" class="btn-primary lg:hidden" onclick={() => (builderOpen = true)}><IconAdd size={20} />{t('add_ticket')}</button>
          <a href="/app/tickets/import" class="btn-secondary"><IconImport size={20} />{t('import_csv')}</a>
        </EmptyState>
      </div>
    {/if}

    <div class="space-y-3">
      {#each people as w (w.id)}
        <TechDay
          worker={{ id: w.id, name: w.name, status: w.status }}
          punches={data.punches.filter((p) => p.workerId === w.id)}
          tickets={data.tickets.filter((x) => x.workerId === w.id)}
          locale={L}
          tz={data.tz}
          {isToday}
          collapsible={!wide.current}
          bind:expanded={() => open[w.id] ?? false, (v) => (open[w.id] = v)}
          focusId={focus}
          onfix={(p) => { fixing = p; fixOpen = true; }}
          onvoid={(x) => { voiding = x; voidOpen = true; }}
          onaddhours={() => addHours(w.id)}
          onclockout={clockOut}
          onpayout={(undo, amount) => payOut(w.id, undo, amount)}
        />
      {/each}
    </div>
    <div class="h-20 lg:hidden" aria-hidden="true"></div>
  </div>
</div>

<div class="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 px-4 pb-3 lg:hidden">
  <button type="button" class="btn-primary mx-auto flex min-h-14 w-full max-w-xl text-lg shadow-float" onclick={() => (builderOpen = true)}><IconAdd size={22} strokeWidth={2.5} />{t('add_ticket')}</button>
</div>

<Sheet bind:open={builderOpen} title={t('add_ticket')} closeLabel={t('close')}>
  {#if !wide.current}
    <TicketBuilder workers={active} services={data.services} date={data.date} locale={L} idPrefix="tbs" bind:selected onadded={(l) => (open[l.workerId] = true)} />
  {/if}
</Sheet>

<FixPunchSheet bind:open={fixOpen} punch={fixing} name={fixing ? nameOf(fixing.workerId) : ''} locale={L} onsaved={onFixSaved} />
<VoidSheet bind:open={voidOpen} ticket={voiding} name={voiding ? nameOf(voiding.workerId) : ''} locale={L} onsaved={onVoided} />
<AddHoursSheet bind:open={hoursOpen} workers={active} bind:workerId={hoursFor} date={data.date} closingTime={data.closingTime} locale={L} onsaved={(r) => toast(t('ts_hours_added', { name: r.name }), { undo: () => postAction('?/fixPunch', { id: r.id, void: '1', reason: t('ts_reason_undo') }) })} />
