<script lang="ts">
  import { enhance } from '$app/forms';
  import { makeT, type Locale } from '$lib/i18n';
  import { fmtMinutes } from '$lib/time';
  import { busy } from '$lib/ui/forms';
  import Sheet from '$lib/ui/Sheet.svelte';
  import TimeStepper from '$lib/ui/TimeStepper.svelte';
  import ConfirmButton from '$lib/ui/ConfirmButton.svelte';
  import ReasonChips from './ReasonChips.svelte';
  import type { Punch } from './TechDay.svelte';

  // Fix a shift in three taps: adjust a time, pick a reason, save (UX-23).
  let { open = $bindable(false), punch, name, locale, onsaved }: { open?: boolean; punch: Punch | null; name: string; locale: Locale; onsaved: (r: { id: string; deleted: boolean; before: { in: string; out: string; breakMinutes: number; voided: boolean } | null }) => void } = $props();
  const t = $derived(makeT(locale));
  let inT = $state('');
  let outT = $state('');
  let extra = $state(0);
  let reason = $state('');
  let error = $state('');
  $effect(() => {
    if (punch && open) {
      inT = punch.inLocal;
      outT = punch.outLocal ?? '';
      extra = punch.manualBreakMinutes;
      error = '';
    }
  });
  const minutes = $derived.by(() => {
    if (!punch || !inT || !outT) return null;
    const [a, b] = [inT, outT].map((x) => x.split(':').map(Number)).map(([h, m]) => h * 60 + m);
    let m = b - a;
    if (m <= 0) m += 1440;
    return Math.max(0, m - punch.tabletBreakMinutes - extra);
  });
  const submit = busy(({ formData, submitter }) => {
    if ((submitter as HTMLButtonElement | null)?.name === 'void' && !String(formData.get('reason') ?? '').trim()) formData.set('reason', t('fx_delete'));
    return async ({ result, update }) => {
      await update({ reset: false });
      if (result.type === 'success' && punch) {
        open = false;
        onsaved({ id: punch.id, deleted: !!result.data?.voided, before: (result.data?.before as { in: string; out: string; breakMinutes: number; voided: boolean }) ?? null });
      } else error = t('reason_hint');
    };
  });
</script>

<Sheet bind:open title={t('fx_title', { name })} closeLabel={t('close')}>
  {#if punch}
    <form id="fx-form" method="post" action="?/fixPunch" use:enhance={submit} class="space-y-5">
      <input type="hidden" name="id" value={punch.id} />
      <input type="hidden" name="reason" value={reason} />
      <input type="hidden" name="breakMinutes" value={extra} />
      <div class="grid gap-4 sm:grid-cols-2">
        <div><label class="label" for="fx-in">{t('clock_in_time')}</label><TimeStepper id="fx-in" name="in" bind:value={inT} required minusLabel={t('minus_15')} plusLabel={t('plus_15')} /></div>
        <div>
          <label class="label" for="fx-out">{t('clock_out_time')}</label><TimeStepper id="fx-out" name="out" bind:value={outT} allowEmpty minusLabel={t('minus_15')} plusLabel={t('plus_15')} />
          <p class="hint">{t('fx_leave_open')}</p>
        </div>
      </div>
      {#if minutes !== null}<p class="rounded-xl bg-sunken px-3 py-2 text-base font-bold">{t('fx_hours_now', { hours: fmtMinutes(minutes) })}</p>{/if}
      {#if punch.tabletBreakMinutes}<p class="text-base text-ink-muted">{t('fx_tablet_breaks', { m: punch.tabletBreakMinutes })}</p>{/if}
      <fieldset>
        <legend class="label">{t('fx_extra_break')}</legend>
        <div class="flex flex-wrap gap-2">
          {#each [0, 15, 30, 45, 60] as m}
            <button type="button" aria-pressed={extra === m} onclick={() => (extra = m)} class="min-h-12 min-w-14 rounded-full border px-4 text-base font-bold tabular-nums {extra === m ? 'border-brand bg-brand-soft text-brand-strong ring-1 ring-brand' : 'border-line-strong bg-surface'}">{m}</button>
          {/each}
        </div>
      </fieldset>
      <ReasonChips id="fx-reason" legend={t('fx_reason')} bind:reason options={[t('fx_reason_forgot'), t('fx_reason_tablet'), t('fx_reason_wrong')]} otherLabel={t('fx_reason_other')} writeLabel={t('fx_reason_write')} initial={punch.stale || punch.open ? t('fx_reason_forgot') : ''} />
      {#if error}<p class="text-base font-bold text-owed" role="alert">{error}</p>{/if}
    </form>
  {/if}
  {#snippet footer()}
    <div class="flex flex-wrap items-start gap-2">
      <button type="submit" form="fx-form" class="btn-primary min-h-14 flex-1 text-lg" disabled={reason.trim().length < 2}>{t('fx_save')}</button>
      <ConfirmButton form="fx-form" name="void" value="1" danger label={t('fx_delete')} confirmLabel={t('fx_delete_confirm')} cancelLabel={t('cancel')} size="lg" />
    </div>
  {/snippet}
</Sheet>
