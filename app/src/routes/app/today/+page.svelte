<script lang="ts">
  import { enhance } from '$app/forms';
  import { tick } from 'svelte';
  import { makeT } from '$lib/i18n';
  import { fmtCents, fmtDateLong, fmtMinutes } from '$lib/time';
  import { dollars } from '$lib/money';
  let { data, form } = $props();
  const t = $derived(makeT(data.locale));
  const byWorker = $derived(
    data.workers
      .map((w) => {
        const tk = data.tickets.filter((x) => x.workerId === w.id && !x.voidedAt);
        const ps = data.punches.filter((p) => p.workerId === w.id);
        return {
          ...w,
          tickets: data.tickets.filter((x) => x.workerId === w.id),
          sales: tk.reduce((s, x) => s + x.priceCents, 0),
          tipCard: tk.reduce((s, x) => s + x.tipCardCents, 0),
          tipCardPaidOut: tk.reduce((s, x) => s + (x.tipCardPaidOut ? x.tipCardCents : 0), 0),
          tipCash: tk.reduce((s, x) => s + x.tipCashCents, 0),
          minutes: ps.reduce((s, p) => s + (p.minutes ?? 0), 0),
          punches: ps
        };
      })
      .filter((w) => w.active || w.tickets.length || w.punches.length)
  );
  const totals = $derived({
    sales: byWorker.reduce((s, w) => s + w.sales, 0),
    tipCard: byWorker.reduce((s, w) => s + w.tipCard, 0),
    tipCash: byWorker.reduce((s, w) => s + w.tipCash, 0),
    minutes: byWorker.reduce((s, w) => s + w.minutes, 0)
  });
  let showAdd = $state(true);
  let fixing = $state<string | null>(null);
  let voiding = $state<string | null>(null);
  let addingPunch = $state(false);
  let price = $state('');
  let lastWorker = $state('');
  let serviceName = $state('');
  let tipCard = $state('');
  let tipCash = $state('');
  let payMethod = $state('');
  let showAllServices = $state(false);
  let toast = $state('');
  let lastTicket = $state<{ workerId: string; serviceName: string; price: string; tipCard: string; tipCash: string; payMethod: string } | null>(null);
  let formEl: HTMLFormElement | undefined = $state();
  async function repeatLast() {
    if (!lastTicket) return;
    lastWorker = lastTicket.workerId;
    serviceName = lastTicket.serviceName;
    price = lastTicket.price;
    tipCard = lastTicket.tipCard;
    tipCash = lastTicket.tipCash;
    payMethod = lastTicket.payMethod;
    await tick();
    formEl?.requestSubmit();
  }
  const quickTips = [0, 3, 5, 10, 20];
  function pickService(s: { en: string; vi: string; price: number }) {
    serviceName = svcName(s);
    price = dollars(s.price);
  }
  function setTip(kind: 'card' | 'cash', v: number) {
    if (kind === 'card') { tipCard = v ? String(v) : ''; if (v) tipCash = ''; }
    else { tipCash = v ? String(v) : ''; if (v) tipCard = ''; }
    if (v && !payMethod) payMethod = kind;
  }
  $effect(() => {
    if (form?.ok && form.form === 'ticket') {
      lastTicket = { workerId: lastWorker, serviceName, price, tipCard, tipCash, payMethod };
      price = '';
      serviceName = '';
      tipCard = '';
      tipCash = '';
      payMethod = '';
      lastWorker = form.lastWorkerId ?? '';
      toast = t('added');
      setTimeout(() => (toast = ''), 1800);
    }
    if (form?.ok && (form.form === 'punch' || form.form === 'addPunch')) {
      fixing = null;
      addingPunch = false;
    }
    if (form?.ok && form.form === 'void') voiding = null;
  });
  const svcName = (s: { en: string; vi: string }) => (data.locale === 'vi' ? s.vi : s.en);
</script>

<svelte:head><title>{t('today_title')} · {fmtDateLong(data.date, data.locale)}</title></svelte:head>

<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
  <div class="flex items-center gap-2">
    <a class="btn-secondary px-3" href="/app/today?date={data.prev}" aria-label="previous day">‹</a>
    <h1 class="text-xl font-bold sm:text-2xl">{data.date === data.today ? t('today') + ' · ' : ''}<span class="text-stone-500">{fmtDateLong(data.date, data.locale)}</span></h1>
    <a class="btn-secondary px-3" href="/app/today?date={data.next}" aria-label="next day">›</a>
    <form method="get" class="hidden sm:block"><input class="input py-2" type="date" name="date" value={data.date} onchange={(e) => (e.currentTarget as HTMLInputElement).form?.requestSubmit()} /></form>
  </div>
  <div class="flex gap-2 text-sm">
    <a class="btn-secondary py-2" href="/app/tickets/import">⇪ {t('import_csv')}</a>
    <button class="btn-secondary py-2" onclick={() => (addingPunch = !addingPunch)}>{t('add_punch')}</button>
  </div>
</div>

<a href="/app/pay/{data.week.start}" class="card mb-4 flex flex-wrap items-center justify-between gap-3 border-l-4 {data.week.owedCents > 0 ? 'border-red-500' : 'border-emerald-500'} hover:bg-stone-50">
  <div>
    <div class="text-xs uppercase text-stone-500">{t('week_card_title')} · {t('week_of', { start: fmtDateLong(data.week.start, data.locale) })}</div>
    <div class="flex flex-wrap items-baseline gap-x-6 gap-y-1">
      <span class="text-2xl font-bold tabular-nums {data.week.owedCents > 0 ? 'text-red-700' : 'text-emerald-700'}">{fmtCents(data.week.owedCents)} <span class="text-sm font-normal text-stone-600">{t('owed_by_law')}</span></span>
      <span class="text-sm text-stone-600">{t('gross_wages')} <strong class="tabular-nums">{fmtCents(data.week.grossCents)}</strong></span>
      <span class="text-sm text-stone-600">{t('hours')} <strong class="tabular-nums">{fmtMinutes(data.week.minutes)}</strong></span>
      {#if data.week.stillIn}<span class="badge bg-emerald-100 text-emerald-800">{t('still_in_count', { n: data.week.stillIn })}</span>{/if}
      {#if data.week.stale}<span class="badge bg-amber-100 text-amber-800">{t('open_punch_count', { n: data.week.stale })}</span>{/if}
    </div>
  </div>
  <span class="btn-secondary">{t('week_card_open')} ›</span>
</a>

<div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
  <div class="card py-3"><div class="text-xs uppercase text-stone-500">{t('sales')}</div><div class="text-xl font-bold tabular-nums">{fmtCents(totals.sales)}</div></div>
  <div class="card py-3"><div class="text-xs uppercase text-stone-500">{t('tip_card')}</div><div class="text-xl font-bold tabular-nums">{fmtCents(totals.tipCard)}</div></div>
  <div class="card py-3"><div class="text-xs uppercase text-stone-500">{t('tip_cash')}</div><div class="text-xl font-bold tabular-nums">{fmtCents(totals.tipCash)}</div></div>
  <div class="card py-3"><div class="text-xs uppercase text-stone-500">{t('hours')}</div><div class="text-xl font-bold tabular-nums">{fmtMinutes(totals.minutes)}</div></div>
</div>

{#if addingPunch}
  <form method="post" action="?/addPunch" use:enhance class="card mb-4 grid gap-3 sm:grid-cols-6">
    <input type="hidden" name="date" value={data.date} />
    <div class="sm:col-span-2"><label class="label" for="ap-w">{t('technician')}</label><select class="input" id="ap-w" name="workerId" required>{#each data.workers.filter((w) => w.active) as w}<option value={w.id}>{w.name}</option>{/each}</select></div>
    <div><label class="label" for="ap-in">{t('clock_in_time')}</label><input class="input" id="ap-in" name="in" type="time" required /></div>
    <div><label class="label" for="ap-out">{t('clock_out_time')}</label><input class="input" id="ap-out" name="out" type="time" required /></div>
    <div><label class="label" for="ap-b">{t('break_minutes')}</label><input class="input" id="ap-b" name="breakMinutes" type="number" min="0" value="0" /></div>
    <div class="sm:col-span-5"><label class="label" for="ap-r">{t('reason')}</label><input class="input" id="ap-r" name="reason" required placeholder={t('reason_hint')} /></div>
    <div class="flex items-end gap-2"><button class="btn-primary" type="submit">{t('save')}</button><button type="button" class="btn-ghost" onclick={() => (addingPunch = false)}>{t('cancel')}</button></div>
  </form>
{/if}

<div class="grid gap-6 lg:grid-cols-[1fr_360px]">
  <section class="order-last space-y-4 lg:order-none">
    {#each byWorker as w (w.id)}
      <div class="card">
        <div class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="text-lg font-bold">{w.name}
            {#if w.status?.state === 'in'}<span class="badge ml-2 bg-emerald-100 text-emerald-800">{t('still_in')}</span>{/if}
            {#if w.status?.state === 'break'}<span class="badge ml-2 bg-amber-100 text-amber-800">{t('kiosk_start_break')}</span>{/if}
          </h2>
          <div class="flex flex-wrap items-center gap-2 text-sm text-stone-600 tabular-nums">
            <span>{t('hours')} <strong>{fmtMinutes(w.minutes)}</strong> · {t('sales')} <strong>{fmtCents(w.sales)}</strong> · {t('tips')} <strong>{fmtCents(w.tipCard + w.tipCash)}</strong></span>
            {#if w.tipCard > 0}
              <form method="post" action="?/payOutTips" use:enhance class="inline">
                <input type="hidden" name="workerId" value={w.id} /><input type="hidden" name="date" value={data.date} />
                {#if w.tipCardPaidOut >= w.tipCard}
                  <input type="hidden" name="undo" value="1" />
                  <button class="badge bg-emerald-100 text-emerald-800" title={t('tips_undo_pay_out')}>✓ {t('tips_paid_out')} {fmtCents(w.tipCardPaidOut)}</button>
                {:else}
                  <button class="rounded-md bg-white px-2 py-1 text-xs font-semibold text-stone-700 ring-1 ring-stone-300 hover:bg-stone-100">💵 {t('tips_pay_out_btn')} ({fmtCents(w.tipCard - w.tipCardPaidOut)})</button>
                {/if}
              </form>
            {/if}
          </div>
        </div>
        <!-- punches -->
        <div class="mb-3 flex flex-wrap gap-2 text-sm">
          {#each w.punches as p (p.id)}
            <div class="flex items-center gap-2 rounded-lg bg-stone-100 px-2 py-1">
              {#if p.photoIn}<img src="/app/photos/{p.photoIn}" alt="" class="h-8 w-8 rounded object-cover" loading="lazy" />{/if}
              <span class="tabular-nums">{p.inLocal} → {p.outLocal ?? '…'}{#if p.breakMinutes} <span class="text-stone-500">(−{p.breakMinutes}m)</span>{/if}</span>
              {#if p.minutes !== null}<span class="font-semibold tabular-nums">{fmtMinutes(p.minutes)}</span>{/if}
              {#if p.source !== 'tablet'}<span class="badge bg-stone-200 text-stone-700">{p.source}</span>{/if}
              {#if !p.outLocal}
                <form method="post" action="?/clockOutNow" use:enhance class="inline"><input type="hidden" name="workerId" value={w.id} /><button class="rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">{t('clock_out_now')}</button></form>
              {/if}
              <button class="text-brand-700 underline" onclick={() => (fixing = fixing === p.id ? null : p.id)}>{t('fix_time')}</button>
            </div>
            {#if fixing === p.id}
              <form method="post" action="?/fixPunch" use:enhance class="grid w-full gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-5">
                <input type="hidden" name="id" value={p.id} />
                <div><label class="label" for="in-{p.id}">{t('clock_in_time')}</label><input class="input" id="in-{p.id}" type="time" name="in" value={p.inLocal} required /></div>
                <div><label class="label" for="out-{p.id}">{t('clock_out_time')}</label><input class="input" id="out-{p.id}" type="time" name="out" value={p.outLocal ?? ''} /></div>
                <div><label class="label" for="b-{p.id}">{t('break_minutes')}</label><input class="input" id="b-{p.id}" type="number" min="0" name="breakMinutes" value={p.breakMinutes} /></div>
                <div class="sm:col-span-2"><label class="label" for="r-{p.id}">{t('reason')}</label><input class="input" id="r-{p.id}" name="reason" required placeholder={t('reason_hint')} /></div>
                {#if form?.form === 'punch' && form?.error && (form as any).id === p.id}<p class="text-sm text-red-700 sm:col-span-5">{t('reason_hint')}</p>{/if}
                <div class="flex gap-2 sm:col-span-5">
                  <button class="btn-primary" type="submit">{t('save')}</button>
                  <button class="btn-danger" type="submit" name="void" value="1">{t('void')}</button>
                  <button class="btn-ghost" type="button" onclick={() => (fixing = null)}>{t('cancel')}</button>
                </div>
              </form>
            {/if}
          {:else}
            <span class="text-stone-500">{t('no_punches')}</span>
          {/each}
        </div>
        <!-- tickets -->
        {#if w.tickets.length}
          <table class="table">
            <thead><tr><th>{t('time')}</th><th>{t('ticket_no')}</th><th>{t('service')}</th><th class="text-right">{t('price')}</th><th class="text-right">{t('tip_card')}</th><th class="text-right">{t('tip_cash')}</th><th></th></tr></thead>
            <tbody>
              {#each w.tickets as tk (tk.id)}
                <tr class={tk.voidedAt ? 'line-through opacity-50' : ''}>
                  <td class="tabular-nums">{tk.time}</td>
                  <td>{tk.ticketNo ?? ''}{#if tk.source !== 'manual'} <span class="badge bg-stone-100 text-stone-600">{tk.source.replace('csv:', '')}</span>{/if}</td>
                  <td>{tk.serviceName}</td>
                  <td class="text-right tabular-nums">{fmtCents(tk.priceCents)}</td>
                  <td class="text-right tabular-nums">{tk.tipCardCents ? fmtCents(tk.tipCardCents) : ''}{#if tk.tipCardPaidOut}<span class="ml-1 text-xs text-emerald-700" title={t('tips_paid_out')}>💵</span>{/if}</td>
                  <td class="text-right tabular-nums">{tk.tipCashCents ? fmtCents(tk.tipCashCents) : ''}</td>
                  <td class="text-right">
                    {#if !tk.voidedAt}
                      {#if voiding === tk.id}
                        <form method="post" action="?/voidTicket" use:enhance class="flex gap-1">
                          <input type="hidden" name="id" value={tk.id} />
                          <input class="input py-1" name="reason" placeholder={t('void_reason')} required />
                          <button class="btn-danger py-1" type="submit">{t('void')}</button>
                          <button class="btn-ghost py-1" type="button" onclick={() => (voiding = null)}>✕</button>
                        </form>
                      {:else}
                        <button class="text-stone-500 underline" onclick={() => (voiding = tk.id)}>{t('void')}</button>
                      {/if}
                    {:else}
                      <span class="text-xs">{t('voided')}: {tk.voidReason}</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {:else}
          <p class="text-sm text-stone-500">{t('no_tickets')}</p>
        {/if}
      </div>
    {/each}
  </section>

  <aside class="lg:sticky lg:top-20 lg:self-start">
    <form method="post" action="?/addTicket" use:enhance class="card space-y-3" bind:this={formEl}>
      <div class="flex items-center justify-between">
        <h2 class="font-bold">{t('add_ticket')}</h2>
        <div class="flex items-center gap-2">
          {#if toast}<span class="badge bg-emerald-100 text-emerald-800">✓ {toast}</span>{/if}
          {#if lastTicket}<button type="button" class="rounded-md px-2 py-1 text-xs font-semibold text-brand-800 ring-1 ring-brand-200 hover:bg-brand-50" onclick={repeatLast} title={lastTicket.serviceName}>↻ {t('repeat_last')}</button>{/if}
        </div>
      </div>
      {#if form?.form === 'ticket' && form?.error}<p class="rounded-lg bg-red-50 p-2 text-sm text-red-700">{t('invalid')}</p>{/if}
      <input type="hidden" name="date" value={data.date} />
      <input type="hidden" name="workerId" value={lastWorker} />
      <input type="hidden" name="serviceName" value={serviceName} />
      <input type="hidden" name="paymentMethod" value={payMethod} />
      <!-- 1. technician: one tap -->
      <div class="flex flex-wrap gap-1.5">
        {#each data.workers.filter((w) => w.active) as w}
          <button type="button" class="rounded-full px-3 py-2 text-sm font-semibold ring-1 transition {lastWorker === w.id ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-stone-800 ring-stone-300 hover:bg-stone-100'}" onclick={() => (lastWorker = w.id)}>{w.name}</button>
        {/each}
      </div>
      <!-- 2. service: one tap, price pre-filled -->
      <div class="grid grid-cols-2 gap-1.5">
        {#each (showAllServices ? data.services : data.services.slice(0, 8)) as s}
          <button type="button" class="flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm ring-1 transition {serviceName === svcName(s) ? 'bg-brand-50 ring-brand-600' : 'bg-white ring-stone-200 hover:bg-stone-50'}" onclick={() => pickService(s)}>
            <span class="truncate">{svcName(s)}</span><span class="ml-1 shrink-0 tabular-nums text-stone-500">{dollars(s.price)}</span>
          </button>
        {/each}
        {#if data.services.length > 8 && !showAllServices}
          <button type="button" class="rounded-lg px-2.5 py-2 text-sm text-stone-600 ring-1 ring-stone-200" onclick={() => (showAllServices = true)}>{t('more_services')}</button>
        {/if}
      </div>
      <div class="grid grid-cols-[1fr_auto] gap-2">
        <input class="input py-2" name="service_free" placeholder={t('service')} bind:value={serviceName} autocomplete="off" />
        <div class="relative"><span class="absolute left-2 top-2.5 text-stone-500">$</span><input class="input w-24 py-2 pl-5" id="tk-p" name="price" inputmode="decimal" required bind:value={price} placeholder="0" /></div>
      </div>
      <!-- 3. tip: one tap -->
      <div>
        <div class="mb-1 flex items-center justify-between text-xs text-stone-500"><span>{t('tip_card')}</span><span>{t('tip_cash')}</span></div>
        <div class="flex items-center gap-1">
          {#each quickTips.slice(1) as v}<button type="button" class="h-9 w-10 rounded-md text-sm font-semibold ring-1 {tipCard === String(v) ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white ring-stone-300'}" onclick={() => setTip('card', v)}>{v}</button>{/each}
          <input class="input h-9 w-16 py-0 text-sm" name="tipCard" inputmode="decimal" bind:value={tipCard} placeholder="$" />
          <span class="mx-1 text-stone-300">|</span>
          {#each quickTips.slice(1) as v}<button type="button" class="h-9 w-10 rounded-md text-sm font-semibold ring-1 {tipCash === String(v) ? 'bg-emerald-700 text-white ring-emerald-700' : 'bg-white ring-stone-300'}" onclick={() => setTip('cash', v)}>{v}</button>{/each}
          <input class="input h-9 w-16 py-0 text-sm" name="tipCash" inputmode="decimal" bind:value={tipCash} placeholder="$" />
        </div>
      </div>
      <details class="text-sm">
        <summary class="cursor-pointer text-stone-500">{t('payment')} · {t('ticket_no')} · {t('time')}</summary>
        <div class="mt-2 grid grid-cols-3 gap-2">
          <div class="inline-flex overflow-hidden rounded-lg ring-1 ring-stone-300">
            <button type="button" class="flex-1 px-2 py-2 {payMethod === 'card' ? 'bg-brand-700 text-white' : 'bg-white'}" onclick={() => (payMethod = payMethod === 'card' ? '' : 'card')}>{t('card')}</button>
            <button type="button" class="flex-1 px-2 py-2 {payMethod === 'cash' ? 'bg-emerald-700 text-white' : 'bg-white'}" onclick={() => (payMethod = payMethod === 'cash' ? '' : 'cash')}>{t('cash')}</button>
          </div>
          <input class="input py-2" name="ticketNo" placeholder={t('ticket_no')} />
          <input class="input py-2" name="time" type="time" />
        </div>
      </details>
      <button class="btn-primary w-full" type="submit" disabled={!lastWorker || !serviceName || !price}>+ {t('add_ticket')}</button>
    </form>
  </aside>
</div>
