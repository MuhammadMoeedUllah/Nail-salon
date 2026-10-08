<script lang="ts">
  import { enhance } from '$app/forms';
  import { makeT, type Locale } from '$lib/i18n';
  import { busy } from '$lib/ui/forms';
  import Sheet from '$lib/ui/Sheet.svelte';
  import ConfirmButton from '$lib/ui/ConfirmButton.svelte';
  import ReasonChips from '$lib/today/ReasonChips.svelte';
  // Reopening needs a reason and a second press (R12); the trail keeps the old version.
  let { open = $bindable(false), locale }: { open?: boolean; locale: Locale } = $props();
  const t = $derived(makeT(locale));
  let reason = $state('');
  const submit = busy(() => async ({ result, update }) => {
    await update({ reset: false });
    if (result.type === 'success') open = false;
  });
</script>

<Sheet bind:open title={t('py_reopen_title')} closeLabel={t('close')}>
  <form id="ro-form" method="post" action="?/reopen" use:enhance={submit} class="space-y-4">
    <p class="text-base text-ink-muted">{t('py_reopen_hint')}</p>
    <input type="hidden" name="reason" value={reason} />
    <ReasonChips id="ro-reason" legend={t('reason')} bind:reason options={[t('py_reopen_r1'), t('py_reopen_r2'), t('py_reopen_r3')]} otherLabel={t('fx_reason_other')} writeLabel={t('fx_reason_write')} />
  </form>
  {#snippet footer()}
    <ConfirmButton form="ro-form" danger block size="lg" disabled={reason.trim().length < 2} label={t('py_reopen_confirm')} confirmLabel={t('confirm_prefix', { label: t('py_reopen_confirm') })} cancelLabel={t('cancel')} />
  {/snippet}
</Sheet>
