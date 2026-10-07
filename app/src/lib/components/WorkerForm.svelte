<script lang="ts">
  import { enhance } from '$app/forms';
  import { makeT, type Locale } from '$lib/i18n';
  import { dollars } from '$lib/money';
  let { locale, worker, form }: { locale: Locale; worker: any | null; form: any } = $props();
  const t = $derived(makeT(locale));
  const v = (k: string, fallback: any = '') => form?.values?.[k] ?? worker?.[k] ?? fallback;
  // svelte-ignore state_referenced_locally
  let basis = $state<string>(form?.values?.payBasis ?? worker?.payBasis ?? 'guarantee_or_commission');
  const bases = ['guarantee_or_commission', 'day_rate_plus_commission', 'commission', 'day_rate', 'hourly'];
</script>

<form method="post" use:enhance class="space-y-6">
  {#if form?.error}<p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error}</p>{/if}
  <div class="card space-y-4">
    <div class="grid gap-4 sm:grid-cols-2">
      <div><label class="label" for="displayName">{t('display_name')}</label><input class="input" id="displayName" name="displayName" required value={v('displayName')} /></div>
      <div><label class="label" for="legalName">{t('legal_name')}</label><input class="input" id="legalName" name="legalName" required value={v('legalName')} /></div>
      <div class="sm:col-span-2"><label class="label" for="address">{t('address')}</label><input class="input" id="address" name="address" value={v('address')} /></div>
      <div><label class="label" for="birthDate">{t('birth_date')}</label><input class="input" id="birthDate" name="birthDate" type="date" value={v('birthDate')} /></div>
      <div><label class="label" for="occupation">{t('occupation')}</label><input class="input" id="occupation" name="occupation" value={v('occupation', 'Nail technician')} /></div>
      <div><label class="label" for="hiredOn">{t('hired_on')}</label><input class="input" id="hiredOn" name="hiredOn" type="date" value={v('hiredOn')} /></div>
      <div><label class="label" for="endedOn">{t('ended_on')}</label><input class="input" id="endedOn" name="endedOn" type="date" value={v('endedOn')} /></div>
      <div><label class="label" for="locale">{t('worker_language')}</label>
        <select class="input" id="locale" name="locale" value={v('locale', 'vi')}><option value="vi">Tiếng Việt</option><option value="en">English</option></select></div>
      <div><label class="label" for="classification">{t('classification')}</label>
        <select class="input" id="classification" name="classification" value={v('classification', 'w2')}><option value="w2">W-2</option><option value="1099">1099</option></select>
        <p class="mt-1 text-xs text-amber-700">{t('classification_warning')}</p></div>
      <div><label class="label" for="pin">{t('pin')}</label><input class="input" id="pin" name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="••••" autocomplete="off" required={!worker} /><p class="mt-1 text-xs text-stone-500">{t('pin_hint')}</p></div>
    </div>
  </div>

  <div class="card space-y-4">
    <h2 class="font-semibold">{t('pay_basis')}</h2>
    <div class="grid gap-2">
      {#each bases as b}
        <label class="flex cursor-pointer items-center gap-3 rounded-xl border p-3 {basis === b ? 'border-brand-600 bg-brand-50' : 'border-stone-200'}">
          <input type="radio" name="payBasis" value={b} bind:group={basis} />
          <span>{t(`basis_${b}` as any)}</span>
        </label>
      {/each}
    </div>
    <div class="grid gap-4 sm:grid-cols-2">
      {#if basis === 'hourly'}
        <div><label class="label" for="hourlyRate">{t('hourly_rate')} ($)</label><input class="input" id="hourlyRate" name="hourlyRate" inputmode="decimal" value={form?.values?.hourlyRate ?? (worker ? dollars(worker.hourlyRateCents) : '')} /></div>
      {/if}
      {#if basis === 'day_rate' || basis === 'day_rate_plus_commission'}
        <div><label class="label" for="dayRate">{t('day_rate')} ($)</label><input class="input" id="dayRate" name="dayRate" inputmode="decimal" value={form?.values?.dayRate ?? (worker ? dollars(worker.dayRateCents) : '')} /></div>
      {/if}
      {#if basis === 'guarantee_or_commission'}
        <div><label class="label" for="guarantee">{t('guarantee')} ($)</label><input class="input" id="guarantee" name="guarantee" inputmode="decimal" value={form?.values?.guarantee ?? (worker ? dollars(worker.guaranteeCents) : '')} /></div>
      {/if}
      {#if basis !== 'day_rate'}
        <div><label class="label" for="commissionPct">{t('commission_rate')}</label><input class="input" id="commissionPct" name="commissionPct" type="number" min="0" max="100" value={v('commissionPct', basis === 'hourly' || basis === 'day_rate' ? 0 : 60)} /></div>
      {/if}
    </div>
    <label class="flex items-center gap-2"><input type="checkbox" name="active" checked={worker ? worker.active : true} /> {t('active')}</label>
  </div>
  {#if worker}
    <div class="card"><label class="label" for="reason">{t('reason')}</label><input class="input" id="reason" name="reason" placeholder={t('reason_hint')} /></div>
  {/if}
  <div class="flex gap-3">
    <button class="btn-primary" type="submit">{t('save')}</button>
    <a class="btn-secondary" href="/app/workers">{t('cancel')}</a>
  </div>
</form>
