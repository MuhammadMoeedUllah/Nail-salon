<script lang="ts">
  import { makeT } from '$lib/i18n';
  import { fmtCents } from '$lib/time';
  let { data } = $props();
  const t = $derived(makeT(data.locale));
  const activeCount = $derived(data.workers.filter((w) => w.active).length);
  const basisLabel = (b: string) => t(`basis_${b}` as any);
</script>

<svelte:head><title>{t('workers_title')}</title></svelte:head>

<div class="mb-4 flex items-center justify-between">
  <h1 class="text-2xl font-bold">{t('workers_title')}</h1>
  <a class="btn-primary" href="/app/workers/new">+ {t('worker_new')}</a>
</div>
{#if data.welcome}
  <div class="card mb-4 border-l-4 border-brand-600">
    <p class="font-semibold">{t('tagline')}</p>
    <ol class="mt-2 list-decimal space-y-1 pl-5 text-sm text-stone-700">
      <li>{t('worker_new')} → {t('pin')}, {t('pay_basis')}</li>
      <li>{t('kiosk_pair')}: <a class="underline" href="/kiosk/pair">/kiosk/pair</a></li>
      <li>{t('nav_today')} → {t('add_ticket')} / {t('import_csv')}</li>
      <li>{t('nav_pay')} → {t('pay_approve')} → {t('statement')}</li>
    </ol>
  </div>
{/if}
<div class="card overflow-x-auto">
  <table class="table">
    <thead><tr><th>{t('display_name')}</th><th>{t('legal_name')}</th><th>{t('pay_basis')}</th><th class="text-right">{t('day_rate')}</th><th class="text-right">{t('commission_rate')}</th><th>{t('worker_language')}</th><th></th></tr></thead>
    <tbody>
      {#each data.workers as w}
        <tr class={w.active ? '' : 'opacity-50'}>
          <td class="font-semibold">{w.displayName}</td>
          <td>{w.legalName}</td>
          <td>{basisLabel(w.payBasis)}</td>
          <td class="text-right tabular-nums">{w.payBasis === 'hourly' ? fmtCents(w.hourlyRateCents) + t('per_hour') : w.payBasis === 'guarantee_or_commission' ? fmtCents(w.guaranteeCents) + t('per_week') : w.dayRateCents ? fmtCents(w.dayRateCents) + t('per_day') : '—'}</td>
          <td class="text-right tabular-nums">{w.commissionPct ? w.commissionPct + '%' : '—'}</td>
          <td>{w.locale === 'vi' ? 'Tiếng Việt' : 'English'}</td>
          <td class="text-right"><a class="text-brand-700 underline" href="/app/workers/{w.id}">{t('edit')}</a></td>
        </tr>
      {:else}
        <tr><td colspan="7" class="text-stone-500">{t('none_yet')}</td></tr>
      {/each}
    </tbody>
  </table>
</div>
<p class="mt-3 text-sm text-stone-600">{t('active_techs')}: <strong>{activeCount}</strong>{#if data.state === 'NY'} · {t('ny_bond_hint')}{/if}</p>
