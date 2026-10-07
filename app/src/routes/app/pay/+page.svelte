<script lang="ts">
  import { makeT } from '$lib/i18n';
  import { fmtCents, fmtDate, fmtMinutes } from '$lib/time';
  let { data } = $props();
  const t = $derived(makeT(data.locale));
  const chip = (s: string) => (s === 'paid' ? 'bg-emerald-100 text-emerald-800' : s === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-700');
</script>

<svelte:head><title>{t('pay_title')}</title></svelte:head>
<h1 class="mb-4 text-2xl font-bold">{t('pay_title')}</h1>
<div class="card overflow-x-auto">
  <table class="table">
    <thead><tr><th>{t('pay_week')}</th><th></th><th class="text-right">{t('nav_workers')}</th><th class="text-right">{t('hours')}</th><th class="text-right">{t('gross_wages')}</th><th class="text-right">{t('owed_by_law')}</th><th></th></tr></thead>
    <tbody>
      {#each data.rows as r}
        <tr>
          <td class="font-semibold"><a class="underline" href="/app/pay/{r.periodStart}">{fmtDate(r.periodStart, data.locale)} – {fmtDate(r.periodEnd, data.locale)}</a></td>
          <td><span class="badge {chip(r.status)}">{t(`pay_status_${r.status}` as any)}</span></td>
          <td class="text-right tabular-nums">{r.workers}</td>
          <td class="text-right tabular-nums">{fmtMinutes(r.minutes)}</td>
          <td class="text-right tabular-nums">{fmtCents(r.gross)}</td>
          <td class="text-right tabular-nums {r.owed > 0 ? 'cell-owed' : ''}">{r.owed > 0 ? fmtCents(r.owed) : '—'}</td>
          <td class="text-right"><a class="btn-secondary py-1" href="/app/pay/{r.periodStart}">{t('pay_open')}</a></td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<p class="mt-3 text-sm text-stone-500">{t('owed_by_law_hint')}</p>
