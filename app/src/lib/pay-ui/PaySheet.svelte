<script lang="ts">
  import { enhance } from '$app/forms';
  import { makeT, type Locale } from '$lib/i18n';
  import { dollars, parseDollars } from '$lib/money';
  import { fmtCents } from '$lib/time';
  import { busy } from '$lib/ui/forms';
  import Sheet from '$lib/ui/Sheet.svelte';
  import SegmentedControl from '$lib/ui/SegmentedControl.svelte';
  import MoneyInput from '$lib/ui/MoneyInput.svelte';
  import Avatar from '$lib/ui/Avatar.svelte';
  import Banner from '$lib/ui/Banner.svelte';
  import { IconPaid } from '$lib/ui/icons';

  type M = 'check' | 'cash' | 'payroll' | 'split';
  // Record how each technician was paid, pre-filled the way they were paid last week (UX-38).
  let { open = $bindable(false), lines, lastMethods, today, locale }: { open?: boolean; lines: { worker: { id: string; displayName: string }; result: { totalCents: number } }[]; lastMethods: Record<string, M>; today: string; locale: Locale } = $props();
  const t = $derived(makeT(locale));
  let methods = $state<Record<string, M>>({});
  let cash = $state<Record<string, string>>({});
  let check = $state<Record<string, string>>({});
  // svelte-ignore state_referenced_locally
  let paidOn = $state(today);
  $effect(() => {
    if (!open) return;
    for (const l of lines) {
      methods[l.worker.id] = lastMethods[l.worker.id] ?? 'check';
      cash[l.worker.id] = '';
      check[l.worker.id] = dollars(l.result.totalCents);
    }
  });
  const amounts = (id: string, total: number) => {
    const m = methods[id] ?? 'check';
    if (m === 'split') {
      const c = parseDollars(cash[id] ?? '') ?? 0;
      const k = parseDollars(check[id] ?? '') ?? 0;
      return { cash: c, check: k, payroll: 0 };
    }
    return { cash: m === 'cash' ? total : 0, check: m === 'check' ? total : 0, payroll: m === 'payroll' ? total : 0 };
  };
  const total = $derived(lines.reduce((s, l) => s + l.result.totalCents, 0));
  const recorded = $derived(lines.reduce((s, l) => { const a = amounts(l.worker.id, l.result.totalCents); return s + a.cash + a.check + a.payroll; }, 0));
  const submit = busy(() => async ({ result, update }) => {
    await update({ reset: false });
    if (result.type === 'success') open = false;
  });
</script>

<Sheet bind:open title={t('py_adjust_title')} closeLabel={t('close')} wide>
  <form id="pay-form" method="post" action="?/pay" use:enhance={submit} class="space-y-4">
    <div>
      <label class="label" for="paid-on">{t('pay_paid_on')}</label>
      <input id="paid-on" name="paidOn" type="date" class="input max-w-52" bind:value={paidOn} required />
    </div>
    {#if Object.keys(lastMethods).length}<p class="text-base text-ink-muted">{t('py_like_last_week')}</p>{/if}
    <ul class="divide-y divide-line">
      {#each lines as l (l.worker.id)}
        {@const a = amounts(l.worker.id, l.result.totalCents)}
        <li class="space-y-2 py-3">
          <div class="flex items-center gap-2">
            <Avatar name={l.worker.displayName} id={l.worker.id} size={36} />
            <span class="min-w-0 flex-1 truncate text-base font-bold">{l.worker.displayName}</span>
            <span class="text-base font-bold">{fmtCents(l.result.totalCents)}</span>
          </div>
          <SegmentedControl label="{l.worker.displayName}: {t('payment')}" bind:value={methods[l.worker.id]} options={[{ value: 'check', label: t('py_method_check') }, { value: 'cash', label: t('cash') }, { value: 'payroll', label: t('py_method_payroll') }, { value: 'split', label: t('py_method_split') }]} />
          {#if methods[l.worker.id] === 'split'}
            <div class="grid grid-cols-2 gap-2">
              <div><label class="label" for="c-{l.worker.id}">{t('cash')}</label><MoneyInput id="c-{l.worker.id}" bind:value={cash[l.worker.id]} /></div>
              <div><label class="label" for="k-{l.worker.id}">{t('py_method_check')}</label><MoneyInput id="k-{l.worker.id}" bind:value={check[l.worker.id]} /></div>
            </div>
          {/if}
          <input type="hidden" name="cash_{l.worker.id}" value={dollars(a.cash)} />
          <input type="hidden" name="check_{l.worker.id}" value={dollars(a.check)} />
          <input type="hidden" name="payroll_{l.worker.id}" value={dollars(a.payroll)} />
        </li>
      {/each}
    </ul>
    <p class="text-base font-bold {recorded === total ? 'text-ok-ink' : 'text-warn-ink'}">{t('py_recorded', { recorded: fmtCents(recorded), total: fmtCents(total) })}</p>
    {#if recorded !== total}<Banner kind="warn">{t('py_mismatch')}</Banner>{/if}
  </form>
  {#snippet footer()}
    <button type="submit" form="pay-form" class="btn-primary min-h-14 w-full text-lg"><IconPaid size={22} />{t('py_save_paid')}</button>
  {/snippet}
</Sheet>
