<script lang="ts">
  import { enhance } from '$app/forms';
  import { beforeNavigate, goto } from '$app/navigation';
  import { tick } from 'svelte';
  import { makeT, type Locale, type MessageKey } from '$lib/i18n';
  import { dollars, parseDollars } from '$lib/money';
  import Field from '$lib/ui/Field.svelte';
  import MoneyInput from '$lib/ui/MoneyInput.svelte';
  import SegmentedControl from '$lib/ui/SegmentedControl.svelte';
  import Switch from '$lib/ui/Switch.svelte';
  import Banner from '$lib/ui/Banner.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { busy } from '$lib/ui/forms';
  import { toast } from '$lib/ui/toast.svelte';
  import { BASES, basisSentence } from '$lib/workers/basis';
  import { IconKey, IconPrint, IconCheck, IconWarn } from '$lib/ui/icons';

  // One page, three numbered cards: name and PIN, how they are paid, details for the records (UX-44, UX-45).
  let { locale, worker, form, salonName }: { locale: Locale; worker: any | null; form: any; salonName: string } = $props();
  const t = $derived(makeT(locale));

  // svelte-ignore state_referenced_locally
  const init = (k: string, fallback: string) => String(form?.values?.[k] ?? fallback);
  // svelte-ignore state_referenced_locally
  const w = worker;
  let displayName = $state(init('displayName', w?.displayName ?? ''));
  let legalName = $state(init('legalName', w?.legalName ?? ''));
  let lang = $state(init('locale', w?.locale ?? 'vi'));
  let pin = $state(init('pin', ''));
  let basis = $state(init('payBasis', w?.payBasis ?? 'guarantee_or_commission'));
  let guarantee = $state(init('guarantee', w ? dollars(w.guaranteeCents) : ''));
  let dayRate = $state(init('dayRate', w ? dollars(w.dayRateCents) : ''));
  let hourlyRate = $state(init('hourlyRate', w ? dollars(w.hourlyRateCents) : ''));
  let pct = $state(init('commissionPct', String(w ? w.commissionPct : 60)));
  let classification = $state(init('classification', w?.classification ?? 'w2'));
  let active = $state(w ? !!w.active : true);
  const pctBack = w?.commissionPct || 60;

  let dirty = $state(false);
  let saving = false;
  let leaveTo = $state<URL | null>(null);
  let pinBusy = $state(false);
  let formEl = $state<HTMLFormElement>();

  const errors = $derived<Record<string, string>>(form?.errors ?? {});
  const err = (k: string) => (errors[k] ? t(errors[k] as MessageKey) : null);
  const plan = $derived(
    basisSentence({ payBasis: basis, hourlyRateCents: parseDollars(hourlyRate) ?? 0, dayRateCents: parseDollars(dayRate) ?? 0, guaranteeCents: parseDollars(guarantee) ?? 0, commissionPct: Number(pct) || 0 }, t)
  );
  const pinReady = $derived(/^\d{4}$/.test(pin));
  const tc = $derived(makeT(lang === 'en' ? 'en' : 'vi'));

  function onBasis(b: string) {
    if (b === 'hourly' || b === 'day_rate') pct = '0';
    else if (!Number(pct)) pct = String(pctBack);
  }
  async function makePin() {
    pinBusy = true;
    try {
      const r = await fetch(`/app/workers/pin${w ? `?except=${w.id}` : ''}`, { headers: { accept: 'application/json' } });
      if (r.ok) {
        pin = (await r.json()).pin;
        dirty = true;
      } else toast(t('something_wrong'), { kind: 'info' });
    } finally {
      pinBusy = false;
    }
  }
  // print only the card: a copy goes straight under <body> and the print style hides everything else
  function printCard() {
    const tpl = document.querySelector<HTMLElement>('[data-print-card]');
    if (!tpl) return;
    document.querySelectorAll('[data-print-clone]').forEach((n) => n.remove());
    const card = tpl.cloneNode(true) as HTMLElement;
    card.removeAttribute('data-print-card');
    card.setAttribute('data-print-clone', '');
    card.classList.remove('hidden');
    document.body.append(card);
    document.body.classList.add('print-card');
    addEventListener('afterprint', () => document.body.classList.remove('print-card'), { once: true });
    print();
  }
  $effect(() => () => {
    document.body.classList.remove('print-card');
    document.querySelectorAll('[data-print-clone]').forEach((n) => n.remove());
  });

  beforeNavigate((nav) => {
    if (!dirty || saving) return;
    nav.cancel();
    if (!nav.willUnload && nav.to) leaveTo = nav.to.url;
  });
  function leave() {
    const to = leaveTo;
    dirty = false;
    leaveTo = null;
    if (to) goto(to);
  }
</script>

{#snippet head(n: number, id: string, title: string, hint?: string)}
  <div class="mb-4 flex items-start gap-3">
    <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-base font-bold text-brand-strong" aria-hidden="true">{n}</span>
    <div class="min-w-0">
      <h2 {id} class="text-xl leading-8 font-bold">{title}</h2>
      {#if hint}<p class="text-sm text-ink-muted">{hint}</p>{/if}
    </div>
  </div>
{/snippet}

{#snippet percent(id: string, label: string)}
  <Field {id} {label} error={err('commissionPct')}>
    <div class="relative w-36">
      <input class="input pr-9 text-right tabular-nums" {id} name="commissionPct" inputmode="numeric" pattern="[0-9]*" maxlength="3" bind:value={pct} aria-invalid={!!errors.commissionPct} aria-describedby="{id}-error" />
      <span class="pointer-events-none absolute inset-y-0 right-3.5 flex items-center font-bold text-ink-muted" aria-hidden="true">%</span>
    </div>
  </Field>
{/snippet}

{#snippet money(id: string, name: string, label: string, get: () => string, set: (v: string) => void)}
  <Field {id} {label}>
    <div class="w-44"><MoneyInput {id} {name} bind:value={get, set} /></div>
  </Field>
{/snippet}

<form
  method="post"
  bind:this={formEl}
  class="space-y-4"
  oninput={() => ((dirty = true), (leaveTo = null))}
  use:enhance={busy(() => {
    saving = true;
    return async ({ result, update }) => {
      if (result.type === 'redirect') {
        dirty = false;
        toast(t(w ? 'wk_saved' : 'wk_added', { name: displayName }));
      }
      await update({ reset: false });
      saving = false;
      if (result.type === 'failure') tick().then(() => formEl?.querySelector<HTMLElement>('[aria-invalid=true]')?.focus());
    };
  })}
>
  {#if form?.errors}<Banner kind="error">{t('wk_check_form')}</Banner>{/if}

  <section class="card" aria-labelledby="wf-s1">
    {@render head(1, 'wf-s1', t('wk_s1'))}
    <div class="grid gap-4 sm:grid-cols-2">
      <Field id="displayName" label={t('display_name')} hint={t('wk_display_hint')} error={err('displayName')}>
        <input class="input" id="displayName" name="displayName" required maxlength="40" autocomplete="off" bind:value={displayName} aria-invalid={!!errors.displayName} aria-describedby="displayName-hint displayName-error" />
      </Field>
      <Field id="legalName" label={t('legal_name')} hint={t('wk_legal_hint')} error={err('legalName')}>
        <input class="input" id="legalName" name="legalName" required maxlength="120" autocomplete="off" bind:value={legalName} aria-invalid={!!errors.legalName} aria-describedby="legalName-hint legalName-error" />
      </Field>
      <SegmentedControl label={t('worker_language')} showLabel name="locale" bind:value={lang} options={[{ value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'English' }]} />
      <Field id="pin" label={t('pin')} hint={w ? t('wk_pin_edit_hint') : t('wk_pin_new_hint')} error={err('pin')}>
        <div class="flex flex-wrap items-center gap-2">
          <input class="input w-36 text-center text-2xl font-bold tracking-[0.4em] tabular-nums" id="pin" name="pin" inputmode="numeric" pattern={'[0-9]{4}'} maxlength="4" autocomplete="off" placeholder={w ? '••••' : ''} required={!w} bind:value={pin} aria-invalid={!!errors.pin} aria-describedby="pin-hint pin-error" />
          <Button type="button" icon={IconKey} pending={pinBusy} onclick={makePin}>{w ? t('wk_pin_change') : t('wk_pin_generate')}</Button>
        </div>
      </Field>
    </div>
    {#if pinReady}
      <div class="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-brand-soft px-4 py-3" role="status">
        <IconCheck size={20} class="shrink-0 text-brand-strong" />
        <p class="min-w-0 flex-1 text-base font-bold text-brand-strong">{t('wk_pin_write', { name: displayName || '…' })}</p>
        <Button type="button" size="sm" icon={IconPrint} onclick={printCard}>{t('wk_pin_print')}</Button>
      </div>
    {/if}
  </section>

  <section class="card" aria-labelledby="wf-s2">
    {@render head(2, 'wf-s2', t('wk_s2'))}
    <fieldset class="space-y-2">
      <legend class="sr-only">{t('wk_s2')}</legend>
      {#each BASES as b (b)}
        <div class="rounded-xl border-2 transition-colors {basis === b ? 'border-brand bg-brand-soft/50' : 'border-line hover:border-line-strong'}">
          <label class="flex cursor-pointer items-start gap-3 p-4">
            <input type="radio" name="payBasis" value={b} bind:group={basis} onchange={() => onBasis(b)} class="mt-0.5 size-5 shrink-0 accent-brand" />
            <span class="min-w-0">
              <span class="block text-base font-bold">{t(`wk_t_${b}` as MessageKey)}</span>
              <span class="block text-sm text-ink-muted">{t(`wk_x_${b}` as MessageKey)}</span>
            </span>
          </label>
          {#if basis === b}
            <div class="flex flex-wrap gap-4 px-4 pb-4 sm:pl-12">
              {#if b === 'guarantee_or_commission'}{@render money('guarantee', 'guarantee', t('wk_guarantee_week'), () => guarantee, (v) => (guarantee = v))}{/if}
              {#if b === 'day_rate' || b === 'day_rate_plus_commission'}{@render money('dayRate', 'dayRate', t('wk_day_rate'), () => dayRate, (v) => (dayRate = v))}{/if}
              {#if b === 'hourly'}{@render money('hourlyRate', 'hourlyRate', t('wk_hourly_rate'), () => hourlyRate, (v) => (hourlyRate = v))}{/if}
              {#if b !== 'day_rate'}{@render percent('commissionPct', b === 'hourly' ? t('wk_commission_optional') : t('wk_commission'))}{/if}
            </div>
          {/if}
        </div>
      {/each}
    </fieldset>
    <p class="mt-4 rounded-xl bg-sunken px-4 py-3 text-base"><span class="font-bold">{t('wk_plan_preview')}:</span> {plan}</p>
  </section>

  <section class="card" aria-labelledby="wf-s3">
    {@render head(3, 'wf-s3', t('wk_s3'), t('wk_s3_hint'))}
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="sm:col-span-2">
        <SegmentedControl label={t('classification')} showLabel name="classification" bind:value={classification} class="max-w-md" options={[{ value: 'w2', label: t('wk_tax_w2') }, { value: '1099', label: t('wk_tax_1099') }]} />
        {#if classification === '1099'}<Banner kind="warn" icon={IconWarn} class="mt-3">{t('classification_warning')}</Banner>{/if}
      </div>
      <Field id="occupation" label={t('occupation')}><input class="input" id="occupation" name="occupation" maxlength="60" value={init('occupation', w?.occupation ?? 'Nail technician')} /></Field>
      <Field id="hiredOn" label={t('hired_on')}><input class="input" id="hiredOn" name="hiredOn" type="date" value={init('hiredOn', w?.hiredOn ?? '')} /></Field>
      <Field id="address" label={t('address')} class="sm:col-span-2"><input class="input" id="address" name="address" maxlength="200" autocomplete="off" value={init('address', w?.address ?? '')} /></Field>
      <Field id="birthDate" label={t('birth_date')}><input class="input" id="birthDate" name="birthDate" type="date" value={init('birthDate', w?.birthDate ?? '')} /></Field>
      {#if w}
        <Field id="endedOn" label={t('ended_on')}><input class="input" id="endedOn" name="endedOn" type="date" value={init('endedOn', w?.endedOn ?? '')} /></Field>
        <div class="sm:col-span-2"><Switch name="active" label={t('active')} hint={t('wk_active_hint')} bind:checked={active} /></div>
        <Field id="reason" label={t('wk_reason_label')} hint={t('wk_reason_hint')} class="sm:col-span-2"><input class="input" id="reason" name="reason" maxlength="200" aria-describedby="reason-hint" /></Field>
      {:else}
        <input type="hidden" name="active" value="on" />
      {/if}
    </div>
  </section>

  <div class="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 lg:bottom-4">
    <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface/95 p-3 shadow-float backdrop-blur" aria-live="polite">
      {#if leaveTo}
        <p class="min-w-0 flex-1 text-base font-bold text-warn-ink">{t('wk_leave_q')}</p>
        <Button type="button" onclick={() => (leaveTo = null)}>{t('wk_stay')}</Button>
        <Button type="button" variant="danger" onclick={leave}>{t('wk_leave')}</Button>
      {:else}
        {#if dirty}<p class="flex min-w-0 flex-1 items-center gap-2 text-base font-bold text-warn-ink"><span class="size-2.5 shrink-0 rounded-full bg-warn" aria-hidden="true"></span>{t('wk_unsaved')}</p>{:else}<span class="flex-1"></span>{/if}
        <Button href="/app/workers" variant="ghost">{t('cancel')}</Button>
        <Button type="submit" variant="primary" size="lg" icon={IconCheck}>{t('save')}</Button>
      {/if}
    </div>
  </div>
</form>

<!-- printed alone by "Print PIN card"; in the technician's language -->
<div data-print-card class="hidden" lang={lang}>
  <div class="pin-card">
    <p class="text-sm">{salonName}</p>
    <p class="mt-1 text-2xl font-bold">{displayName}</p>
    <p class="mt-4 text-base">{tc('wk_pin_card_title')}</p>
    <p class="text-5xl font-bold tracking-[0.3em]">{pin}</p>
    <p class="mt-4 text-base">{tc('wk_pin_card_steps')}</p>
    <p class="mt-2 text-sm">{tc('wk_pin_card_keep')}</p>
  </div>
</div>
