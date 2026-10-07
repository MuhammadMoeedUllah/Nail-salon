<script lang="ts">
  import { enhance } from '$app/forms';
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
  $effect(() => {
    if (form?.ok && form.form === 'ticket') {
      price = '';
      lastWorker = form.lastWorkerId ?? '';
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

<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
  <div class="flex items-center gap-2">
    <a class="btn-secondary px-3" href="/app/today?date={data.prev}" aria-label="previous day">‹</a>
    <h1 class="text-2xl font-bold">{data.date === data.today ? t('today') : ''} <span class="text-stone-500">{fmtDateLong(data.date, data.locale)}</span></h1>
    <a class="btn-secondary px-3" href="/app/today?date={data.next}" aria-label="next day">›</a>
    <form method="get" class="ml-2"><input class="input py-2" type="date" name="date" value={data.date} onchange={(e) => (e.currentTarget as HTMLInputElement).form?.requestSubmit()} /></form>
  </div>
  <div class="flex gap-2">
    <a class="btn-secondary" href="/app/tickets/import">⇪ {t('import_csv')}</a>
    <button class="btn-secondary" onclick={() => (addingPunch = !addingPunch)}>{t('add_punch')}</button>
  </div>
</div>

<div class="mb-4 grid gap-3 sm:grid-cols-4">
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
  <section class="space-y-4">
    {#each byWorker as w (w.id)}
      <div class="card">
        <div class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="text-lg font-bold">{w.name}
            {#if w.status?.state === 'in'}<span class="badge ml-2 bg-emerald-100 text-emerald-800">{t('still_in')}</span>{/if}
            {#if w.status?.state === 'break'}<span class="badge ml-2 bg-amber-100 text-amber-800">{t('kiosk_start_break')}</span>{/if}
          </h2>
          <div class="text-sm text-stone-600 tabular-nums">{t('hours')} <strong>{fmtMinutes(w.minutes)}</strong> · {t('sales')} <strong>{fmtCents(w.sales)}</strong> · {t('tips')} <strong>{fmtCents(w.tipCard + w.tipCash)}</strong></div>
        </div>
        <!-- punches -->
        <div class="mb-3 flex flex-wrap gap-2 text-sm">
          {#each w.punches as p (p.id)}
            <div class="flex items-center gap-2 rounded-lg bg-stone-100 px-2 py-1">
              {#if p.photoIn}<img src="/app/photos/{p.photoIn}" alt="" class="h-8 w-8 rounded object-cover" loading="lazy" />{/if}
              <span class="tabular-nums">{p.inLocal} → {p.outLocal ?? '…'}{#if p.breakMinutes} <span class="text-stone-500">(−{p.breakMinutes}m)</span>{/if}</span>
              {#if p.minutes !== null}<span class="font-semibold tabular-nums">{fmtMinutes(p.minutes)}</span>{/if}
              {#if p.source !== 'tablet'}<span class="badge bg-stone-200 text-stone-700">{p.source}</span>{/if}
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
                  <td class="text-right tabular-nums">{tk.tipCardCents ? fmtCents(tk.tipCardCents) : ''}</td>
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
    <form method="post" action="?/addTicket" use:enhance class="card space-y-3">
      <h2 class="font-bold">{t('add_ticket')}</h2>
      {#if form?.form === 'ticket' && form?.error}<p class="rounded-lg bg-red-50 p-2 text-sm text-red-700">{t('invalid')}</p>{/if}
      <input type="hidden" name="date" value={data.date} />
      <div><label class="label" for="tk-w">{t('technician')}</label>
        <select class="input" id="tk-w" name="workerId" required value={lastWorker}>
          <option value="" disabled>—</option>
          {#each data.workers.filter((w) => w.active) as w}<option value={w.id}>{w.name}</option>{/each}
        </select></div>
      <div><label class="label" for="tk-s">{t('service')}</label>
        <input class="input" id="tk-s" name="serviceName" list="svc" required autocomplete="off" oninput={(e) => { const m = data.services.find((s) => svcName(s) === (e.currentTarget as HTMLInputElement).value); if (m && !price) price = dollars(m.price); }} />
        <datalist id="svc">{#each data.services as s}<option value={svcName(s)}></option>{/each}</datalist></div>
      <div class="grid grid-cols-3 gap-2">
        <div><label class="label" for="tk-p">{t('price')} $</label><input class="input" id="tk-p" name="price" inputmode="decimal" required bind:value={price} /></div>
        <div><label class="label" for="tk-tc">{t('tip_card')} $</label><input class="input" id="tk-tc" name="tipCard" inputmode="decimal" /></div>
        <div><label class="label" for="tk-tx">{t('tip_cash')} $</label><input class="input" id="tk-tx" name="tipCash" inputmode="decimal" /></div>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div><label class="label" for="tk-pm">{t('payment')}</label><select class="input" id="tk-pm" name="paymentMethod"><option value="">—</option><option value="card">{t('card')}</option><option value="cash">{t('cash')}</option></select></div>
        <div><label class="label" for="tk-n">{t('ticket_no')}</label><input class="input" id="tk-n" name="ticketNo" /></div>
        <div><label class="label" for="tk-t">{t('time')}</label><input class="input" id="tk-t" name="time" type="time" /></div>
      </div>
      <button class="btn-primary w-full" type="submit">+ {t('add_ticket')}</button>
    </form>
  </aside>
</div>
