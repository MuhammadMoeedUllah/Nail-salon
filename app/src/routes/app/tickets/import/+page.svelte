<script lang="ts">
  import { makeT } from '$lib/i18n';
  import { parseCsv, detectFormat, guessMapping, normalizeRows, matchStaff, type Mapping, type NormalizedTicket } from '$lib/import/parsers';
  import { fmtCents } from '$lib/time';
  let { data } = $props();
  const t = $derived(makeT(data.locale));

  let fileName = $state('');
  let headers = $state<string[]>([]);
  let rows = $state<Record<string, string>[]>([]);
  let format = $state('generic');
  let map = $state<Mapping | null>(null);
  let tipsAre = $state<'card' | 'cash' | 'by_method'>('by_method');
  let skipRetail = $state(true);
  let normalized = $state<NormalizedTicket[]>([]);
  let skipped = $state<{ row: number; reason: string }[]>([]);
  let staffMap = $state<Record<string, string>>({});
  let busy = $state(false);
  let result = $state<{ imported: number; skipped: number; unmatched: string[] } | null>(null);
  let err = $state('');

  async function onFile(e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!f) return;
    result = null;
    err = '';
    fileName = f.name;
    const text = await f.text();
    const p = parseCsv(text);
    headers = p.headers;
    rows = p.rows;
    format = detectFormat(headers);
    map = guessMapping(headers);
    await renormalize();
  }
  async function renormalize() {
    if (!map) return;
    const typeCol = headers.find((h) => h.toLowerCase().trim() === 'itemization type');
    const skipRow = skipRetail && format === 'square_items' && typeCol ? (row: Record<string, string>) => (row[typeCol] ?? '').toLowerCase() === 'item' : undefined;
    const r = await normalizeRows(rows, map, { tipsAre, skipRow });
    normalized = r.tickets;
    skipped = r.skipped;
    const m: Record<string, string> = { ...staffMap };
    for (const name of new Set(r.tickets.map((x) => x.staffName))) if (!m[name]) m[name] = matchStaff(name, data.workers) ?? '';
    staffMap = m;
  }
  const unmatchedNames = $derived([...new Set(normalized.map((x) => x.staffName))].filter((n) => !staffMap[n]));
  const willImport = $derived(normalized.filter((x) => staffMap[x.staffName]).length);
  const totals = $derived({ sales: normalized.reduce((s, x) => s + x.priceCents, 0), tips: normalized.reduce((s, x) => s + x.tipCardCents + x.tipCashCents, 0) });

  async function doImport() {
    busy = true;
    err = '';
    try {
      const res = await fetch('/app/tickets/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ format, fileName, staffMap, tickets: normalized.filter((x) => staffMap[x.staffName]) })
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error ?? res.statusText);
      result = j;
    } catch (e: any) {
      err = String(e.message ?? e);
    } finally {
      busy = false;
    }
  }
  const fields: (keyof Mapping)[] = ['date', 'time', 'staff', 'service', 'price', 'tip', 'tipCash', 'method', 'externalId', 'ticketNo', 'qty'];
</script>

<svelte:head><title>{t('import_title')}</title></svelte:head>
<a class="text-sm text-stone-500 underline" href="/app/today">← {t('nav_today')}</a>
<h1 class="mb-1 text-2xl font-bold">{t('import_title')}</h1>
<p class="mb-4 text-sm text-stone-600">{t('import_hint')}</p>

<div class="card mb-4">
  <input type="file" accept=".csv,text/csv,.txt" onchange={onFile} class="block w-full text-sm" />
</div>

{#if result}
  <div class="card mb-4 border-l-4 border-emerald-500">
    <p class="font-semibold">{t('import_done', { imported: result.imported, skipped: result.skipped })}</p>
    {#if result.unmatched.length}<p class="text-sm text-amber-700">{t('import_unmatched')} {result.unmatched.join(', ')}</p>{/if}
    <a class="btn-primary mt-3" href="/app/today?date={normalized[0]?.workDate ?? ''}">{t('nav_today')}</a>
  </div>
{/if}

{#if headers.length}
  <div class="card mb-4 space-y-3">
    <div class="flex flex-wrap items-center gap-4 text-sm">
      <span><strong>{fileName}</strong> · {rows.length} rows · {t('import_format')}: <span class="badge bg-stone-100">{format}</span></span>
      <label class="flex items-center gap-2">{t('tips')}:
        <select class="input w-auto py-1" bind:value={tipsAre} onchange={renormalize}>
          <option value="by_method">{t('card')} / {t('cash')} ({t('payment')})</option>
          <option value="card">{t('tip_card')}</option>
          <option value="cash">{t('tip_cash')}</option>
        </select></label>
      {#if format === 'square_items'}<label class="flex items-center gap-2"><input type="checkbox" bind:checked={skipRetail} onchange={renormalize} /> skip retail items</label>{/if}
    </div>
    <details>
      <summary class="cursor-pointer text-sm font-semibold">Columns</summary>
      <div class="mt-2 grid gap-2 sm:grid-cols-3">
        {#each fields as f}
          <label class="text-xs">{f}
            <select class="input py-1" value={map?.[f] ?? ''} onchange={(e) => { if (map) { map = { ...map, [f]: (e.currentTarget as HTMLSelectElement).value || null }; renormalize(); } }}>
              <option value="">—</option>
              {#each headers as h}<option value={h}>{h}</option>{/each}
            </select></label>
        {/each}
      </div>
    </details>
    {#if skipped.length}<p class="text-xs text-stone-500">Skipped rows: {skipped.length} ({[...new Set(skipped.map((s) => s.reason))].join(', ')})</p>{/if}
  </div>

  {#if unmatchedNames.length || Object.keys(staffMap).length}
    <div class="card mb-4">
      <p class="mb-2 text-sm font-semibold">{t('import_unmatched')}</p>
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {#each Object.keys(staffMap) as name}
          <label class="flex items-center gap-2 text-sm"><span class="w-32 truncate font-medium" title={name}>{name}</span>
            <select class="input py-1" bind:value={staffMap[name]}>
              <option value="">{t('import_skip')}</option>
              {#each data.workers as w}<option value={w.id}>{w.displayName}</option>{/each}
            </select></label>
        {/each}
      </div>
    </div>
  {/if}

  <div class="card mb-4 overflow-x-auto">
    <div class="mb-2 flex items-center justify-between">
      <h2 class="font-semibold">{t('import_preview')} · {normalized.length} · {t('sales')} {fmtCents(totals.sales)} · {t('tips')} {fmtCents(totals.tips)}</h2>
      <button class="btn-primary" onclick={doImport} disabled={busy || willImport === 0}>{t('import_confirm', { n: willImport })}</button>
    </div>
    {#if err}<p class="mb-2 rounded bg-red-50 p-2 text-sm text-red-700">{err}</p>{/if}
    {#if normalized.length === 0}<p class="text-sm text-stone-500">{t('import_no_rows')}</p>{/if}
    <table class="table text-xs">
      <thead><tr><th>{t('date')}</th><th>{t('time')}</th><th>{t('technician')}</th><th>{t('service')}</th><th class="text-right">{t('price')}</th><th class="text-right">{t('tip_card')}</th><th class="text-right">{t('tip_cash')}</th><th>{t('payment')}</th><th>{t('ticket_no')}</th></tr></thead>
      <tbody>
        {#each normalized.slice(0, 200) as x}
          <tr class={staffMap[x.staffName] ? '' : 'opacity-50'}>
            <td>{x.workDate}</td><td>{x.time}</td><td>{x.staffName}</td><td>{x.serviceName}</td><td class="text-right">{fmtCents(x.priceCents)}</td><td class="text-right">{x.tipCardCents ? fmtCents(x.tipCardCents) : ''}</td><td class="text-right">{x.tipCashCents ? fmtCents(x.tipCashCents) : ''}</td><td>{x.paymentMethod ?? ''}</td><td>{x.ticketNo ?? ''}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if normalized.length > 200}<p class="mt-2 text-xs text-stone-500">… {normalized.length - 200} more</p>{/if}
  </div>
{/if}
