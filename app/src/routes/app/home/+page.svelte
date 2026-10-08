<script lang="ts">
  import { enhance } from '$app/forms';
  import { makeT } from '$lib/i18n';
  import { fmtCents, fmtClock, fmtDate, fmtDateLong, fmtMinutes, fmtWeekday, minutesBetween } from '$lib/time';
  import PageHeader from '$lib/ui/PageHeader.svelte';
  import Button from '$lib/ui/Button.svelte';
  import KeyNumber from '$lib/ui/KeyNumber.svelte';
  import Avatar from '$lib/ui/Avatar.svelte';
  import StatusPill from '$lib/ui/StatusPill.svelte';
  import Steps from '$lib/ui/Steps.svelte';
  import { busy } from '$lib/ui/forms';
  import { IconNext, IconWarn, IconPay, IconMessage, IconDone, IconClockIn, IconBreak, IconToday, IconHide } from '$lib/ui/icons';
  let { data } = $props();
  const t = $derived(makeT(data.locale));
  const L = $derived(data.locale);
  const tz = $derived(data.salon.timezone);
  const firstName = $derived(data.user.name.trim().split(/\s+/)[0]);
  const working = $derived(data.people.filter((p) => p.state !== 'out' && !p.stale));
  const stale = $derived(data.people.filter((p) => p.stale));
  const counts = $derived({ in: working.filter((p) => p.state === 'in').length, brk: working.filter((p) => p.state === 'break').length, out: data.people.length - working.length });
  const steps = $derived(
    data.setup
      ? [
          { label: t('setup_techs'), hint: t('setup_techs_hint'), href: '/app/workers/new', done: data.setup.techs },
          { label: t('setup_tablet'), hint: t('setup_tablet_hint'), href: '/app/tablets', done: data.setup.tablet },
          { label: t('setup_first_punch'), hint: t('setup_first_punch_hint'), href: '/kiosk', done: data.setup.punch },
          { label: t('setup_first_ticket'), hint: t('setup_first_ticket_hint'), href: '/app/today', done: data.setup.ticket },
          { label: t('setup_first_week'), hint: t('setup_first_week_hint'), href: '/app/pay', done: data.setup.week }
        ]
      : []
  );
  const setupOpen = $derived(steps.length > 0 && steps.some((s) => !s.done));
  const todoText = (td: (typeof data.todos)[number]) => {
    switch (td.kind) {
      case 'open_punch': return t('todo_open_punch', { name: td.name, day: fmtDate(td.date, L) });
      case 'tickets_no_hours': return t('todo_tickets_no_hours', { name: td.name });
      case 'unapproved': return t('todo_unapproved', { start: fmtDate(td.start, L) });
      case 'approved_unpaid': return t('todo_approved_unpaid', { start: fmtDate(td.start, L) });
      case 'unsent': return t('todo_unsent', { n: td.n, start: fmtDate(td.start, L) });
    }
  };
  const todoIcon = (k: string) => (k === 'unsent' ? IconMessage : k === 'approved_unpaid' || k === 'unapproved' ? IconPay : IconWarn);
</script>

<svelte:head><title>{t('nav_home')} · {data.salon.name}</title></svelte:head>

<PageHeader title={t('home_greeting', { name: firstName })} subtitle="{fmtWeekday(data.today, L)}, {fmtDateLong(data.today, L)} · {data.salon.name}" />

<div class="grid items-start gap-4 lg:grid-cols-2 lg:gap-6">
  <div class="space-y-4">
    <section class="card p-5" aria-labelledby="h-week">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 id="h-week" class="eyebrow">{t('home_week')} · {fmtDate(data.week.start, L)} – {fmtDate(data.week.end, L)}</h2>
        <StatusPill kind="neutral" icon={IconToday}>{t('home_week_in_progress', { day: fmtWeekday(data.week.end, L, 'short') })}</StatusPill>
      </div>
      <KeyNumber class="mt-4" value={fmtCents(data.week.owedCents)} label={data.week.owedCents > 0 ? t('owed_by_law') : t('home_nothing_owed')} tone={data.week.owedCents > 0 ? 'owed' : 'ok'} />
      <dl class="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-sunken p-3 text-center">
        <div><dt class="text-sm text-ink-muted">{t('gross_wages')}</dt><dd class="text-lg font-bold">{fmtCents(data.week.grossCents)}</dd></div>
        <div><dt class="text-sm text-ink-muted">{t('hours')}</dt><dd class="text-lg font-bold">{fmtMinutes(data.week.minutes)}</dd></div>
        <div><dt class="text-sm text-ink-muted">{t('nav_workers')}</dt><dd class="text-lg font-bold">{data.week.techs}</dd></div>
      </dl>
      <Button href="/app/pay/{data.week.start}" variant="primary" size="lg" block class="mt-4" iconRight={IconNext}>{t('home_review_week')}</Button>
    </section>

    <section class="card p-5" aria-labelledby="h-now">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 id="h-now" class="eyebrow">{t('home_now')}</h2>
        <p class="text-sm font-bold text-ink-muted">{t('home_in_count', { n: counts.in })} · {t('home_break_count', { n: counts.brk })} · {t('home_out_count', { n: counts.out })}</p>
      </div>
      {#if working.length}
        <ul class="mt-3 divide-y divide-line">
          {#each working as p (p.id)}
            <li class="flex items-center gap-3 py-2.5">
              <Avatar name={p.name} id={p.id} size={44} />
              <div class="min-w-0 flex-1">
                <p class="truncate text-base font-bold">{p.name}</p>
                <p class="text-sm text-ink-muted">
                  {#if p.state === 'in' && p.since}{t('home_in_since', { time: fmtClock(p.since, tz, L), elapsed: fmtMinutes(minutesBetween(p.since, data.now)) })}{:else if p.since}{t('home_break_since', { time: fmtClock(p.since, tz, L) })}{/if}
                </p>
              </div>
              {#if p.state === 'in'}<StatusPill kind="ok" icon={IconClockIn}>{t('td_in')}</StatusPill>{:else}<StatusPill kind="warn" icon={IconBreak}>{t('td_on_break')}</StatusPill>{/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="mt-2 text-base text-ink-muted">{t('home_nobody_in')}</p>
      {/if}
      {#if stale.length}
        <p class="mt-3 flex items-start gap-2 rounded-xl bg-warn-soft px-3 py-2 text-base font-bold text-warn-ink"><IconWarn size={20} class="mt-0.5 shrink-0" />{stale.map((p) => p.name).join(', ')} · {t('td_forgot_out')}</p>
      {/if}
    </section>
  </div>

  <div class="space-y-4">
    {#if setupOpen}
      <section class="card p-5">
        <Steps steps={steps} title={t('setup_title')} progressLabel={t('setup_progress', { done: steps.filter((s) => s.done).length, total: steps.length })} />
        <form method="post" action="?/dismissSetup" use:enhance={busy()} class="mt-3 flex justify-end">
          <button class="btn btn-ghost text-ink-muted"><IconHide size={20} />{t('setup_hide')}</button>
        </form>
      </section>
    {/if}

    <section class="card p-5" aria-labelledby="h-todo">
      <h2 id="h-todo" class="eyebrow">{t('home_todo')}</h2>
      {#if data.todos.length}
        <ul class="mt-2 space-y-2">
          {#each data.todos as td (td.href + td.kind)}
            {@const Ico = todoIcon(td.kind)}
            <li>
              <a href={td.href} class="flex min-h-14 items-center gap-3 rounded-xl border border-line px-3 py-2 hover:bg-sunken">
                <span class="flex size-9 shrink-0 items-center justify-center rounded-full {td.kind === 'open_punch' || td.kind === 'tickets_no_hours' ? 'bg-warn-soft text-warn-ink' : 'bg-info-soft text-info-ink'}"><Ico size={20} strokeWidth={2.25} /></span>
                <span class="min-w-0 flex-1 text-base leading-snug font-bold">
                  {todoText(td)}
                  {#if (td.kind === 'unapproved' || td.kind === 'approved_unpaid') && td.payBy}<span class="block text-sm font-normal text-ink-muted">{t('todo_pay_by', { date: fmtDate(td.payBy, L) })}</span>{/if}
                </span>
                <IconNext size={20} class="shrink-0 text-ink-muted" />
              </a>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="mt-2 flex items-center gap-2 text-base font-bold text-ok-ink"><IconDone size={22} />{t('home_todo_empty')}</p>
      {/if}
    </section>

    <section class="card p-5" aria-labelledby="h-y">
      <h2 id="h-y" class="eyebrow">{t('home_yesterday')}</h2>
      {#if data.yesterday.tickets || data.yesterday.minutes}
        <p class="mt-1 text-base">{t('home_yesterday_line', { sales: fmtCents(data.yesterday.sales), tickets: data.yesterday.tickets, hours: fmtMinutes(data.yesterday.minutes) })}</p>
      {:else}
        <p class="mt-1 text-base text-ink-muted">{t('home_yesterday_none')}</p>
      {/if}
    </section>
  </div>
</div>
