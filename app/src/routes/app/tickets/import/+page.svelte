<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { makeT, type MessageKey } from '$lib/i18n';
  import { parseCsv, detectFormat, guessMapping, normalizeRows, matchStaff, type Mapping, type NormalizedTicket } from '$lib/import/parsers';
  import { fmtCents, fmtDate, fmtDateTime, fmtWall } from '$lib/time';
  import PageHeader from '$lib/ui/PageHeader.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Banner from '$lib/ui/Banner.svelte';
  import SegmentedControl from '$lib/ui/SegmentedControl.svelte';
  import Switch from '$lib/ui/Switch.svelte';
  import StatusPill from '$lib/ui/StatusPill.svelte';
  import DataTable from '$lib/ui/DataTable.svelte';
  import { IconImport, IconFile, IconDone, IconNext, IconRefresh, IconWarn, IconUsers, IconCheck } from '$lib/ui/icons';

  let { data } = $props();
  const t = $derived(makeT(data.locale));
  const L = $derived(data.locale);

  let fileName = $state('');
  let headers = $state<string[]>([]);
  let rows = $state<Record<string, string>[]>([]);
  let format = $state('generic');
  let map = $state<Mapping | null>(null);
  let columnsChanged = $state(false);
  let tipsAre = $state<'card' | 'cash' | 'by_method'>('by_method');
  let skipRetail = $state(true);
  let normalized = $state<NormalizedTicket[]>([]);
  let skippedRows = $state(0);
  let staffMap = $state<Record<string, string>>({});
  let editing = $state(false);
  let busy = $state(false);
  let dragging = $state(false);
  let result = $state<{ imported: number; skipped: number; unmatched: string[]; firstDate: string | null } | null>(null);
  let err = $state('');
  let input = $state<HTMLInputElement>();

  const saved = $derived(data.mappings[format] as { staffMap: Record<string, string>; columnMap: Mapping | null; tipsAre: 'card' | 'cash' | 'by_method' } | undefined);
  const names = $derived(Object.keys(staffMap));
  const newNames = $derived(saved ? names.filter((n) => !(n in saved.staffMap)) : names);
  const showMatches = $derived(editing || !saved || newNames.length > 0);
  const listNames = $derived(editing || !saved ? names : newNames);
  const ready = $derived(normalized.filter((x) => staffMap[x.staffName]));
  const toSkip = $derived(normalized.length - ready.length);
  const totals = $derived({ sales: ready.reduce((s, x) => s + x.priceCents, 0), tips: ready.reduce((s, x) => s + x.tipCardCents + x.tipCashCents, 0) });
  const workerName = (id: string) => data.workers.find((w) => w.id === id)?.displayName ?? '';
  const fmtName = (f: string) => t(`im_fmt_${f}` as MessageKey);

  async function open(f: File | undefined) {
    if (!f) return;
    result = null;
    err = '';
    try {
      const p = parseCsv(await f.text());
      if (!p.headers.length) throw new Error('empty');
      fileName = f.name;
      headers = p.headers;
      rows = p.rows;
    } catch {
      err = t('im_read_error');
      return;
    }
    format = detectFormat(headers);
    const s = data.mappings[format];
    const guess = guessMapping(headers);
    // the columns chosen last time, when every one of them is still in this file
    const cm = s?.columnMap as Partial<Mapping> | null | undefined;
    map = cm && Object.values(cm).every((v) => !v || headers.includes(v)) ? { ...guess, ...cm } : guess;
    columnsChanged = !!cm;
    tipsAre = s?.tipsAre ?? 'by_method';
    staffMap = {};
    editing = false;
    await renormalize();
  }

  async function renormalize() {
    if (!map) return;
    const typeCol = headers.find((h) => h.toLowerCase().trim() === 'itemization type');
    const skipRow = skipRetail && format === 'square_items' && typeCol ? (row: Record<string, string>) => (row[typeCol] ?? '').toLowerCase() === 'item' : undefined;
    const r = await normalizeRows(rows, map, { tipsAre, skipRow });
    normalized = r.tickets;
    skippedRows = r.skipped.length;
    const remembered = data.mappings[format]?.staffMap ?? {};
    const m: Record<string, string> = {};
    for (const name of new Set(r.tickets.map((x) => x.staffName))) {
      if (name in staffMap) m[name] = staffMap[name];
      else if (name in remembered && (remembered[name] === '' || data.workers.some((w) => w.id === remembered[name]))) m[name] = remembered[name];
      else m[name] = matchStaff(name, data.workers) ?? '';
    }
    staffMap = m;
  }

  function setColumn(f: keyof Mapping, v: string) {
    if (!map) return;
    map = { ...map, [f]: v || null };
    columnsChanged = true;
    renormalize();
  }

  async function doImport() {
    busy = true;
    err = '';
    try {
      const res = await fetch('/app/tickets/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ format, fileName, staffMap, columnMap: columnsChanged ? map : null, tipsAre, tickets: ready })
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error ?? res.statusText);
      result = j;
      // the matches just saved and the recent list come back with the page data
      await invalidateAll();
      scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      err = t('something_wrong');
    } finally {
      busy = false;
    }
  }
  function reset() {
    result = null;
    headers = [];
    rows = [];
    normalized = [];
    staffMap = {};
    fileName = '';
    if (input) input.value = '';
  }
  const fields: (keyof Mapping)[] = ['date', 'time', 'staff', 'service', 'price', 'tip', 'tipCash', 'method', 'externalId', 'ticketNo', 'qty'];
</script>

<svelte:head><title>{t('import_title')}</title></svelte:head>

<PageHeader back={{ href: '/app/today', label: t('nav_today') }} title={t('nav_import')} subtitle={t('im_subtitle')} />

<div class="max-w-4xl space-y-4">
  {#if err}<Banner kind="error">{err}</Banner>{/if}

  {#if result}
    <section class="card" aria-live="polite">
      <div class="flex items-start gap-3">
        <span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok-ink"><IconDone size={24} /></span>
        <div class="min-w-0">
          <h2 class="text-xl font-bold" data-testid="import-done">{t('im_done_title', { n: result.imported })}</h2>
          {#if result.skipped}<p class="text-base text-ink-muted">{t('im_done_skipped', { n: result.skipped })}</p>{/if}
          {#if result.unmatched.length}<p class="mt-1 text-base text-warn-ink">{t('im_still_unmatched', { names: result.unmatched.join(', ') })}</p>{/if}
        </div>
      </div>
      <div class="mt-4 flex flex-wrap gap-3">
        {#if result.firstDate}<Button variant="primary" href="/app/today?date={result.firstDate}" iconRight={IconNext}>{t('im_open_day', { day: fmtDate(result.firstDate, L) })}</Button>{/if}
        <Button icon={IconRefresh} onclick={reset}>{t('im_again')}</Button>
      </div>
    </section>
  {:else if !headers.length}
    <!-- 1. pick a file -->
    <label
      for="csv"
      class="flex cursor-pointer flex-col items-center gap-3 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus {dragging ? 'border-brand bg-brand-soft' : 'border-line-strong bg-surface hover:bg-sunken'}"
      ondragover={(e) => { e.preventDefault(); dragging = true; }}
      ondragleave={() => (dragging = false)}
      ondrop={(e) => { e.preventDefault(); dragging = false; open(e.dataTransfer?.files?.[0]); }}
    >
      <span class="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong"><IconImport size={28} /></span>
      <span class="text-xl font-bold">{t('im_drop')}</span>
      <span class="btn-primary pointer-events-none">{t('im_choose')}</span>
      <span class="text-sm text-ink-muted">{t('im_drop_hint')}</span>
      <input bind:this={input} id="csv" type="file" accept=".csv,text/csv,.txt" class="sr-only" onchange={(e) => open(e.currentTarget.files?.[0])} />
    </label>

    <section aria-labelledby="how-h">
      <h2 id="how-h" class="mb-2 text-lg font-bold">{t('im_how')}</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        {#each [{ name: 'Square', text: t('im_sq_steps') }, { name: 'Vagaro', text: t('im_va_steps') }, { name: 'Fresha', text: t('im_fr_steps') }, { name: t('im_other_title'), text: t('im_other_steps') }] as v (v.name)}
          <div class="card p-4">
            <h3 class="text-base font-bold">{v.name}</h3>
            <p class="mt-1 text-sm text-ink-muted">{v.text}</p>
          </div>
        {/each}
      </div>
    </section>

    {#if data.recent.length}
      <section aria-labelledby="recent-h">
        <h2 id="recent-h" class="mb-2 text-lg font-bold">{t('im_recent')}</h2>
        <ul class="card divide-y divide-line p-0">
          {#each data.recent as b (b.id)}
            <li class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-base">
              <IconFile size={18} class="shrink-0 text-ink-muted" />
              <span class="min-w-0 flex-1">{t('im_recent_row', { n: b.imported, file: b.fileName ?? fmtName(b.format) })}</span>
              <span class="text-sm text-ink-muted">{fmtDateTime(b.createdAt, data.tz, L)}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {:else}
    <!-- 2. check and import -->
    <section class="card p-4">
      <div class="flex flex-wrap items-center gap-3">
        <IconFile size={22} class="shrink-0 text-ink-muted" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-base font-bold">{fileName}</p>
          <p class="text-sm text-ink-muted" data-testid="import-format">{t('im_detected', { format: fmtName(format), n: rows.length })}</p>
        </div>
        <Button size="sm" icon={IconRefresh} onclick={reset}>{t('im_another')}</Button>
      </div>
    </section>

    {#if format === 'summary_unsupported'}
      <Banner kind="warn" icon={IconWarn}>{t('import_summary_unsupported')}</Banner>
    {:else}
      {#if saved && !showMatches}
        <Banner kind="ok" icon={IconCheck} title={t('im_remembered')}>
          {#snippet action()}<Button size="sm" onclick={() => (editing = true)}>{t('im_change')}</Button>{/snippet}
        </Banner>
      {/if}

      {#if showMatches && names.length}
        <section class="card" aria-labelledby="match-h">
          <h2 id="match-h" class="flex items-center gap-2 text-lg font-bold"><IconUsers size={20} />{saved && !editing ? t('im_new_names') : t('im_match_title')}</h2>
          <p class="mb-3 text-sm text-ink-muted">{t('im_match_hint')}</p>
          <div class="grid gap-3 sm:grid-cols-2">
            {#each listNames as name (name)}
              <label class="flex items-center gap-3 rounded-xl border border-line p-2 pl-3">
                <span class="min-w-0 flex-1 truncate text-base font-bold" title={name}>{name}</span>
                <select class="input w-44 shrink-0" bind:value={staffMap[name]} aria-label={name}>
                  <option value="">{t('import_skip')}</option>
                  {#each data.workers as w (w.id)}<option value={w.id}>{w.displayName}</option>{/each}
                </select>
              </label>
            {/each}
          </div>
        </section>
      {/if}

      <details class="card p-4">
        <summary class="flex min-h-11 cursor-pointer items-center text-base font-bold">{t('im_columns')}</summary>
        <div class="mt-2 space-y-4">
          {#if map?.tip}
            <SegmentedControl label={t('im_tips_are')} showLabel bind:value={tipsAre} onchange={() => renormalize()} class="max-w-lg" options={[{ value: 'by_method', label: t('im_tips_by_method') }, { value: 'card', label: t('im_tips_card') }, { value: 'cash', label: t('im_tips_cash') }]} />
          {/if}
          {#if format === 'square_items'}<Switch label={t('im_skip_retail')} hint={t('im_skip_retail_hint')} bind:checked={skipRetail} onchange={() => renormalize()} class="max-w-lg" />{/if}
          <p class="text-sm text-ink-muted">{t('im_columns_hint')}</p>
          <div class="grid gap-3 sm:grid-cols-3">
            {#each fields as f (f)}
              <label class="block">
                <span class="label">{t(`im_col_${f}` as MessageKey)}</span>
                <select class="input" value={map?.[f] ?? ''} onchange={(e) => setColumn(f, e.currentTarget.value)}>
                  <option value="">{t('im_not_used')}</option>
                  {#each headers as h (h)}<option value={h}>{h}</option>{/each}
                </select>
              </label>
            {/each}
          </div>
        </div>
      </details>

      <section aria-labelledby="preview-h" class="space-y-2">
        <h2 id="preview-h" class="text-lg font-bold">{t('import_preview')}</h2>
        {#if skippedRows}<p class="text-sm text-ink-muted">{t('im_skipped_rows', { n: skippedRows })}</p>{/if}
        {#if toSkip}<p class="text-sm text-warn-ink">{t('im_skipped_names', { n: toSkip })}</p>{/if}
        {#if normalized.length === 0}
          <Banner kind="warn">{t('import_no_rows')}</Banner>
        {:else}
          <ul class="card divide-y divide-line p-0 md:hidden">
            {#each normalized.slice(0, 20) as x (x.externalId)}
              <li class="px-4 py-3 {staffMap[x.staffName] ? '' : 'opacity-60'}">
                <p class="flex items-baseline justify-between gap-2"><span class="font-bold">{x.serviceName}</span><span class="font-bold tabular-nums">{fmtCents(x.priceCents)}</span></p>
                <p class="text-sm text-ink-muted">{fmtDate(x.workDate, L)} · {fmtWall(x.time, L)} · {staffMap[x.staffName] ? workerName(staffMap[x.staffName]) : x.staffName}{#if x.tipCardCents + x.tipCashCents} · {t('tips')} {fmtCents(x.tipCardCents + x.tipCashCents)}{/if}</p>
                {#if !staffMap[x.staffName]}<StatusPill kind="neutral" class="mt-1">{t('import_skip')}</StatusPill>{/if}
              </li>
            {/each}
          </ul>
          <div class="hidden md:block">
            <DataTable caption={t('import_preview')} compact>
              <thead><tr><th>{t('date')}</th><th>{t('time')}</th><th>{t('technician')}</th><th>{t('service')}</th><th class="num">{t('price')}</th><th class="num">{t('tip_card')}</th><th class="num">{t('tip_cash')}</th></tr></thead>
              <tbody>
                {#each normalized.slice(0, 50) as x (x.externalId)}
                  <tr class={staffMap[x.staffName] ? '' : 'text-ink-soft'}>
                    <td class="whitespace-nowrap">{fmtDate(x.workDate, L)}</td>
                    <td class="whitespace-nowrap tabular-nums">{fmtWall(x.time, L)}</td>
                    <td>{staffMap[x.staffName] ? workerName(staffMap[x.staffName]) : `${x.staffName} · ${t('import_skip')}`}</td>
                    <td>{x.serviceName}</td>
                    <td class="num">{fmtCents(x.priceCents)}</td>
                    <td class="num">{x.tipCardCents ? fmtCents(x.tipCardCents) : ''}</td>
                    <td class="num">{x.tipCashCents ? fmtCents(x.tipCashCents) : ''}</td>
                  </tr>
                {/each}
              </tbody>
            </DataTable>
          </div>
          {#if normalized.length > 20}<p class="text-sm text-ink-muted"><span class="md:hidden">{t('im_preview_more', { shown: 20, n: normalized.length })}</span><span class="hidden md:inline">{normalized.length > 50 ? t('im_preview_more', { shown: 50, n: normalized.length }) : ''}</span></p>{/if}
        {/if}
      </section>

      <div class="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 lg:bottom-4">
        <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface/95 p-3 shadow-float backdrop-blur">
          <p class="min-w-0 flex-1 text-sm text-ink-muted">{t('im_totals', { sales: fmtCents(totals.sales), tips: fmtCents(totals.tips) })}</p>
          <Button variant="primary" size="lg" icon={IconImport} pending={busy} disabled={ready.length === 0} onclick={doImport} data-testid="import-go">{t('import_confirm', { n: ready.length })}</Button>
        </div>
      </div>
    {/if}
  {/if}
</div>
