<script lang="ts">
  import { enhance } from '$app/forms';
  import { makeT, type Locale } from '$lib/i18n';
  import { fmtCents } from '$lib/time';
  import { busy } from '$lib/ui/forms';
  import Sheet from '$lib/ui/Sheet.svelte';
  import ReasonChips from './ReasonChips.svelte';
  import type { Ticket } from './TechDay.svelte';
  import { IconVoid } from '$lib/ui/icons';

  // Void with a one-tap reason; Undo in the toast brings it back (UX-24).
  let { open = $bindable(false), ticket, name, locale, onsaved }: { open?: boolean; ticket: Ticket | null; name: string; locale: Locale; onsaved: (t: Ticket) => void } = $props();
  const t = $derived(makeT(locale));
  let reason = $state('');
  const submit = busy(() => async ({ result, update }) => {
    await update({ reset: false });
    if (result.type === 'success' && ticket) {
      open = false;
      onsaved(ticket);
    }
  });
</script>

<Sheet bind:open title={t('vd_title')} closeLabel={t('close')}>
  {#if ticket}
    <form id="vd-form" method="post" action="?/voidTicket" use:enhance={submit} class="space-y-5">
      <input type="hidden" name="id" value={ticket.id} />
      <input type="hidden" name="reason" value={reason} />
      <p class="rounded-xl bg-sunken px-4 py-3 text-base"><span class="font-bold">{ticket.serviceName} · {fmtCents(ticket.priceCents)}</span><br /><span class="text-ink-muted">{name} · {ticket.time}{#if ticket.ticketNo} · #{ticket.ticketNo}{/if}</span></p>
      {#key ticket.id}
        <ReasonChips id="vd-reason" legend={t('void_reason')} bind:reason options={[t('vd_reason_dup'), t('vd_reason_tech'), t('vd_reason_price'), t('vd_reason_cancel')]} otherLabel={t('fx_reason_other')} writeLabel={t('fx_reason_write')} />
      {/key}
    </form>
  {/if}
  {#snippet footer()}
    <button type="submit" form="vd-form" class="btn-danger min-h-14 w-full text-lg" disabled={reason.trim().length < 2}><IconVoid size={22} />{t('vd_confirm')}</button>
  {/snippet}
</Sheet>
