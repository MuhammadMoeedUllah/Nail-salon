<script lang="ts">
  import { makeT } from '$lib/i18n';
  import { fmtDateTime } from '$lib/time';
  let { data } = $props();
  const t = $derived(makeT(data.locale));
  const entities = ['punch', 'ticket', 'worker', 'pay_run', 'pay_line', 'salon', 'device', 'import'];
  const short = (v: string | null) => (v && v.length > 80 ? v.slice(0, 77) + '…' : (v ?? ''));
</script>

<svelte:head><title>{t('audit_title')}</title></svelte:head>
<h1 class="mb-1 text-2xl font-bold">{t('audit_title')}</h1>
<p class="mb-4 max-w-3xl text-sm text-stone-600">{t('audit_hint')}</p>

<form method="get" class="card mb-4 flex flex-wrap items-end gap-3">
  <div><label class="label" for="from">{t('audit_from')}</label><input class="input" id="from" type="date" name="from" value={data.from} /></div>
  <div><label class="label" for="to">{t('audit_to')}</label><input class="input" id="to" type="date" name="to" value={data.to} /></div>
  <div><label class="label" for="entity">{t('audit_what')}</label><select class="input" id="entity" name="entity" value={data.entity}><option value="">—</option>{#each entities as e}<option value={e}>{e}</option>{/each}</select></div>
  <button class="btn-secondary">{t('audit_edit_history')}</button>
  <span class="grow"></span>
  <a class="btn-primary" href="/app/audit/export?from={data.from}&to={data.to}&format=pdf&lang={data.locale}">⇩ {t('audit_export_pdf')}</a>
  <a class="btn-secondary" href="/app/audit/export?from={data.from}&to={data.to}&format=zip">⇩ {t('audit_export_csv')}</a>
</form>

<p class="mb-3 text-sm text-stone-600">{t('audit_retention')}: <strong>{data.retention} y</strong> ({data.state}; 29 CFR 516.5). </p>

<div class="card overflow-x-auto p-0">
  <table class="table text-xs">
    <thead><tr><th>{t('audit_when')}</th><th>{t('audit_who')}</th><th>{t('audit_what')}</th><th></th><th>before</th><th>after</th><th>{t('audit_why')}</th></tr></thead>
    <tbody>
      {#each data.edits as e}
        <tr>
          <td class="whitespace-nowrap tabular-nums">{fmtDateTime(e.ts, data.tz, data.locale)}</td>
          <td>{e.who}</td>
          <td class="whitespace-nowrap"><span class="badge bg-stone-100">{e.entity}</span> {e.action} <span class="text-stone-400">{e.target}</span></td>
          <td class="text-stone-600">{e.field ?? ''}</td>
          <td class="max-w-xs break-words text-stone-500">{short(e.oldValue)}</td>
          <td class="max-w-xs break-words">{short(e.newValue)}</td>
          <td class="max-w-xs break-words italic text-stone-600">{e.reason ?? ''}</td>
        </tr>
      {:else}
        <tr><td colspan="7" class="text-stone-500">{t('none_yet')}</td></tr>
      {/each}
    </tbody>
  </table>
</div>
