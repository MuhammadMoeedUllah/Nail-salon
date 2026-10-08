<script lang="ts">
  import { enhance } from '$app/forms';
  import { makeT, type Locale } from '$lib/i18n';
  import { busy } from '$lib/ui/forms';
  import Sheet from '$lib/ui/Sheet.svelte';
  import TimeStepper from '$lib/ui/TimeStepper.svelte';
  import Avatar from '$lib/ui/Avatar.svelte';
  import ReasonChips from './ReasonChips.svelte';
  import { IconAdd } from '$lib/ui/icons';

  // Hours for someone who worked but did not clock in (UX-23, UX-26).
  let { open = $bindable(false), workers, workerId = $bindable(''), date, closingTime, locale, onsaved }: { open?: boolean; workers: { id: string; name: string }[]; workerId?: string; date: string; closingTime: string; locale: Locale; onsaved: (r: { id: string; name: string }) => void } = $props();
  const t = $derived(makeT(locale));
  let inT = $state('09:00');
  // svelte-ignore state_referenced_locally
  let outT = $state(closingTime);
  let extra = $state(0);
  let reason = $state('');
  const submit = busy(() => async ({ result, update }) => {
    await update({ reset: false });
    if (result.type === 'success' && result.data?.id) {
      open = false;
      onsaved({ id: String(result.data.id), name: workers.find((w) => w.id === workerId)?.name ?? '' });
    }
  });
</script>

<Sheet bind:open title={t('ah_title')} closeLabel={t('close')}>
  <form id="ah-form" method="post" action="?/addPunch" use:enhance={submit} class="space-y-5">
    <input type="hidden" name="date" value={date} />
    <input type="hidden" name="workerId" value={workerId} />
    <input type="hidden" name="reason" value={reason} />
    <input type="hidden" name="breakMinutes" value={extra} />
    <fieldset>
      <legend class="label">{t('technician')}</legend>
      <div class="flex flex-wrap gap-2">
        {#each workers as w (w.id)}
          <button type="button" aria-pressed={workerId === w.id} onclick={() => (workerId = w.id)} class="inline-flex min-h-12 items-center gap-2 rounded-full border py-1 pr-4 pl-1.5 text-base font-bold {workerId === w.id ? 'border-brand bg-brand-soft text-brand-strong ring-1 ring-brand' : 'border-line-strong bg-surface'}"><Avatar name={w.name} id={w.id} size={32} />{w.name}</button>
        {/each}
      </div>
    </fieldset>
    <div class="grid gap-4 sm:grid-cols-2">
      <div><label class="label" for="ah-in">{t('clock_in_time')}</label><TimeStepper id="ah-in" name="in" bind:value={inT} required minusLabel={t('minus_15')} plusLabel={t('plus_15')} /></div>
      <div><label class="label" for="ah-out">{t('clock_out_time')}</label><TimeStepper id="ah-out" name="out" bind:value={outT} required minusLabel={t('minus_15')} plusLabel={t('plus_15')} /></div>
    </div>
    <fieldset>
      <legend class="label">{t('fx_extra_break')}</legend>
      <div class="flex flex-wrap gap-2">
        {#each [0, 15, 30, 45, 60] as m}
          <button type="button" aria-pressed={extra === m} onclick={() => (extra = m)} class="min-h-12 min-w-14 rounded-full border px-4 text-base font-bold tabular-nums {extra === m ? 'border-brand bg-brand-soft text-brand-strong ring-1 ring-brand' : 'border-line-strong bg-surface'}">{m}</button>
        {/each}
      </div>
    </fieldset>
    <ReasonChips id="ah-reason" legend={t('fx_reason')} bind:reason options={[t('ah_reason_default'), t('fx_reason_tablet')]} otherLabel={t('fx_reason_other')} writeLabel={t('fx_reason_write')} initial={t('ah_reason_default')} />
  </form>
  {#snippet footer()}
    <button type="submit" form="ah-form" class="btn-primary min-h-14 w-full text-lg" disabled={!workerId || reason.trim().length < 2}><IconAdd size={22} />{t('ah_save')}</button>
  {/snippet}
</Sheet>
