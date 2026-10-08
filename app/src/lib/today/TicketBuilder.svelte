<script lang="ts">
  import { enhance } from '$app/forms';
  import { tick } from 'svelte';
  import { makeT, type Locale } from '$lib/i18n';
  import { dollars, parseDollars } from '$lib/money';
  import { fmtCents } from '$lib/time';
  import { busy } from '$lib/ui/forms';
  import { postAction } from '$lib/ui/actions';
  import Avatar from '$lib/ui/Avatar.svelte';
  import MoneyInput from '$lib/ui/MoneyInput.svelte';
  import NumberPad from '$lib/ui/NumberPad.svelte';
  import SegmentedControl from '$lib/ui/SegmentedControl.svelte';
  import { IconCheck, IconAdd, IconRepeat, IconUndo, IconDone, IconNext } from '$lib/ui/icons';

  type Svc = { id: string; en: string; vi: string; price: number };
  type Last = { id: string; workerId: string; name: string; service: string; price: string; tip: string; tipKind: 'card' | 'cash'; payMethod: 'card' | 'cash'; ticketNo: string };
  // Three taps, no typing, for a standard ticket: who, what, tip (R20, R21, R22; research 09 §7).
  let {
    workers,
    services,
    date,
    locale,
    idPrefix = 'tb',
    selected = $bindable(''),
    keypad = false,
    onadded
  }: { workers: { id: string; name: string }[]; services: Svc[]; date: string; locale: Locale; idPrefix?: string; selected?: string; keypad?: boolean; onadded?: (l: Last) => void } = $props();
  const t = $derived(makeT(locale));
  const svcName = (s: Svc) => (locale === 'vi' ? s.vi : s.en);

  let service = $state('');
  let price = $state('');
  let payMethod = $state<'card' | 'cash'>('card');
  let tipKind = $state<'card' | 'cash'>('card');
  let tipKindTouched = $state(false);
  let tip = $state('');
  let tipCustom = $state(false);
  let ticketNo = $state('');
  let time = $state('');
  let showAll = $state(false);
  let showDetails = $state(false);
  let keypadFor = $state<'price' | 'tip' | null>(null);
  let last = $state<Last | null>(null);
  let note = $state('');
  let formEl: HTMLFormElement | undefined = $state();

  const PRESETS = ['3', '5', '10', '20'];
  const visible = $derived(showAll ? services : services.slice(0, 9));
  const priceCents = $derived(price === '' ? null : parseDollars(price));
  const tipCents = $derived(tip === '' ? 0 : (parseDollars(tip) ?? 0));
  const ready = $derived(!!selected && service.trim().length > 0 && priceCents !== null && priceCents >= 0);
  const submitLabel = $derived(
    !selected ? t('bd_choose_tech') : !service.trim() ? t('bd_choose_service') : tipCents > 0 ? t('bd_submit_tip', { amount: fmtCents(priceCents ?? 0), tip: fmtCents(tipCents) }) : t('bd_submit', { amount: fmtCents(priceCents ?? 0) })
  );

  $effect(() => {
    if (!tipKindTouched) tipKind = payMethod;
  });

  function pickService(s: Svc) {
    service = svcName(s);
    price = dollars(s.price);
    keypadFor = null;
  }
  function pickTip(v: string) {
    tip = v;
    tipCustom = false;
    keypadFor = null;
  }
  function resetTicket() {
    service = '';
    price = '';
    tip = '';
    tipCustom = false;
    ticketNo = '';
    time = '';
    keypadFor = null;
    tipKindTouched = false;
  }

  const onSubmit = busy(() => {
    const snap: Omit<Last, 'id'> = { workerId: selected, name: workers.find((w) => w.id === selected)?.name ?? '', service, price, tip, tipKind, payMethod, ticketNo };
    note = '';
    return async ({ result, update }) => {
      await update({ reset: false });
      if (result.type === 'success' && result.data?.id) {
        last = { ...snap, id: String(result.data.id) };
        onadded?.(last);
        resetTicket();
      }
    };
  });

  async function undoLast() {
    if (!last) return;
    const id = last.id;
    last = null;
    await postAction('?/voidTicket', { id, reason: t('bd_undo_reason') });
    note = t('bd_undone');
  }
  async function repeat() {
    if (!last) return;
    selected = last.workerId;
    service = last.service;
    price = last.price;
    tip = last.tip;
    tipKind = last.tipKind;
    tipKindTouched = true;
    payMethod = last.payMethod;
    await tick();
    formEl?.requestSubmit();
  }
</script>

<form bind:this={formEl} method="post" action="?/addTicket" use:enhance={onSubmit} class="@container space-y-5">
  <input type="hidden" name="date" value={date} />
  <input type="hidden" name="workerId" value={selected} />
  <input type="hidden" name="serviceName" value={service} />
  <input type="hidden" name="paymentMethod" value={payMethod} />
  <input type="hidden" name={tipKind === 'card' ? 'tipCard' : 'tipCash'} value={tip} />

  {#if last}
    <div class="flex flex-wrap items-center gap-2 rounded-xl bg-ok-soft px-3 py-2 text-ok-ink" role="status">
      <IconDone size={22} class="shrink-0" />
      <p class="min-w-0 flex-1 text-base font-bold">{t('bd_added', { service: last.service, price: fmtCents(parseDollars(last.price) ?? 0), name: last.name })}</p>
      <button type="button" class="btn-secondary min-h-11 px-3 text-base" onclick={undoLast}><IconUndo size={18} />{t('undo')}</button>
      <button type="button" class="btn-secondary min-h-11 px-3 text-base" onclick={repeat}><IconRepeat size={18} />{t('bd_repeat')}</button>
    </div>
  {:else if note}
    <p class="rounded-xl bg-sunken px-3 py-2 text-base text-ink-muted" role="status">{note}</p>
  {/if}

  <fieldset>
    <legend class="eyebrow mb-2">1 · {t('bd_step_who')}</legend>
    <div class="flex flex-wrap gap-2">
      {#each workers as w (w.id)}
        <button type="button" aria-pressed={selected === w.id} onclick={() => (selected = w.id)} class="inline-flex min-h-12 items-center gap-2 rounded-full border py-1 pr-4 pl-1.5 text-base font-bold transition-colors {selected === w.id ? 'border-brand bg-brand-soft text-brand-strong ring-1 ring-brand' : 'border-line-strong bg-surface hover:bg-sunken'}">
          <Avatar name={w.name} id={w.id} size={34} />{w.name}{#if selected === w.id}<IconCheck size={18} strokeWidth={3} />{/if}
        </button>
      {/each}
    </div>
  </fieldset>

  <fieldset>
    <legend class="eyebrow mb-2">2 · {t('bd_step_service')}</legend>
    <div class="grid grid-cols-2 gap-2 @md:grid-cols-3">
      {#each visible as s (s.id)}
        {@const on = service === svcName(s)}
        <button type="button" aria-pressed={on} onclick={() => pickService(s)} class="flex min-h-14 flex-col items-start justify-center rounded-xl border px-3 py-1.5 text-left leading-snug transition-colors {on ? 'border-brand bg-brand-soft ring-1 ring-brand' : 'border-line bg-surface hover:bg-sunken'}">
          <span class="flex w-full items-start justify-between gap-1 text-base font-bold {on ? 'text-brand-strong' : ''}"><span class="line-clamp-2">{svcName(s)}</span>{#if on}<IconCheck size={18} strokeWidth={3} class="mt-0.5 shrink-0" />{/if}</span>
          <span class="text-sm text-ink-muted tabular-nums">{fmtCents(s.price)}</span>
        </button>
      {/each}
      {#if services.length > 9}
        <button type="button" class="flex min-h-14 items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong px-3 text-base font-bold text-ink-muted hover:bg-sunken" onclick={() => (showAll = !showAll)}>
          {showAll ? t('bd_fewer_services') : t('bd_more_services')}<IconNext size={18} class={showAll ? '-rotate-90' : 'rotate-90'} />
        </button>
      {/if}
    </div>
    <div class="mt-3 grid grid-cols-[1fr_8.5rem] gap-2">
      <div>
        <label class="label" for="{idPrefix}-svc">{t('service')}</label>
        <input id="{idPrefix}-svc" name="service_free" class="input" bind:value={service} autocomplete="off" list="{idPrefix}-svc-list" placeholder={t('bd_other_service')} />
        <datalist id="{idPrefix}-svc-list">{#each services as s}<option value={svcName(s)}></option>{/each}</datalist>
      </div>
      <div>
        <label class="label" for="{idPrefix}-price">{t('price')}</label>
        <MoneyInput id="{idPrefix}-price" name="price" bind:value={price} required inputmode={keypad ? 'none' : 'decimal'} onfocus={() => keypad && (keypadFor = 'price')} />
      </div>
    </div>
    {#if keypad && keypadFor === 'price'}
      <div class="mt-2"><NumberPad bind:value={price} label={t('bd_price_amount')} doneLabel={t('keypad_done')} clearLabel={t('keypad_clear')} backLabel={t('keypad_delete')} ondone={() => (keypadFor = null)} /></div>
    {/if}
  </fieldset>

  <fieldset class="space-y-3">
    <legend class="eyebrow mb-2">3 · {t('bd_step_pay')}</legend>
    <SegmentedControl label={t('bd_paid_by')} showLabel bind:value={payMethod} options={[{ value: 'card', label: t('card') }, { value: 'cash', label: t('cash') }]} />
    <div>
      <p class="label">{t('tips')}</p>
      <div class="flex flex-wrap gap-2">
        <button type="button" aria-pressed={tip === '' && !tipCustom} onclick={() => pickTip('')} class="min-h-12 rounded-full border px-4 text-base font-bold {tip === '' && !tipCustom ? 'border-brand bg-brand-soft text-brand-strong ring-1 ring-brand' : 'border-line-strong bg-surface'}">{t('bd_no_tip')}</button>
        {#each PRESETS as v}
          <button type="button" aria-pressed={tip === v && !tipCustom} onclick={() => pickTip(v)} class="min-h-12 min-w-14 rounded-full border px-4 text-base font-bold tabular-nums {tip === v && !tipCustom ? 'border-brand bg-brand-soft text-brand-strong ring-1 ring-brand' : 'border-line-strong bg-surface'}">${v}</button>
        {/each}
        <button type="button" aria-pressed={tipCustom} onclick={() => { tipCustom = true; tip = ''; if (keypad) keypadFor = 'tip'; }} class="min-h-12 rounded-full border px-4 text-base font-bold {tipCustom ? 'border-brand bg-brand-soft text-brand-strong ring-1 ring-brand' : 'border-line-strong bg-surface'}">{t('bd_other_amount')}</button>
      </div>
      {#if tipCustom && !keypad}
        <div class="mt-2 max-w-40"><MoneyInput id="{idPrefix}-tip" bind:value={tip} aria-label={t('bd_tip_amount')} autofocus /></div>
      {/if}
      {#if keypad && keypadFor === 'tip'}
        <div class="mt-2"><NumberPad bind:value={tip} label={t('bd_tip_amount')} doneLabel={t('keypad_done')} clearLabel={t('keypad_clear')} backLabel={t('keypad_delete')} ondone={() => (keypadFor = null)} /></div>
      {/if}
    </div>
    {#if tipCents > 0}
      <SegmentedControl label={t('bd_tip_in')} showLabel bind:value={tipKind} onchange={() => (tipKindTouched = true)} options={[{ value: 'card', label: t('tip_card') }, { value: 'cash', label: t('tip_cash') }]} />
    {/if}
    <details bind:open={showDetails}>
      <summary class="flex min-h-11 cursor-pointer items-center gap-1 text-base font-bold text-brand-strong">{t('bd_details')}</summary>
      <div class="mt-2 grid grid-cols-2 gap-2">
        <div><label class="label" for="{idPrefix}-no">{t('ticket_no')}</label><input id="{idPrefix}-no" name="ticketNo" class="input" bind:value={ticketNo} inputmode="numeric" autocomplete="off" /></div>
        <div><label class="label" for="{idPrefix}-time">{t('time')}</label><input id="{idPrefix}-time" name="time" type="time" class="input" bind:value={time} /></div>
      </div>
    </details>
  </fieldset>

  <button type="submit" class="btn-primary min-h-14 w-full text-lg" disabled={!ready}><IconAdd size={22} strokeWidth={2.5} />{submitLabel}</button>
</form>
