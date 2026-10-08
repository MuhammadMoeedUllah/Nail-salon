<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { makeT, type MessageKey } from '$lib/i18n';
  import { fmtAgo, fmtDate, fmtDateTime } from '$lib/time';
  import PageHeader from '$lib/ui/PageHeader.svelte';
  import SegmentedControl from '$lib/ui/SegmentedControl.svelte';
  import Field from '$lib/ui/Field.svelte';
  import Button from '$lib/ui/Button.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import { IconFile, IconDownload, IconHistory, IconInfo } from '$lib/ui/icons';

  let { data } = $props();
  const t = $derived(makeT(data.locale));
  const L = $derived(data.locale);

  // export range: three presets or two dates (UX-50)
  let preset = $state('this_month');
  // svelte-ignore state_referenced_locally
  let from = $state(data.presets.this_month.from);
  // svelte-ignore state_referenced_locally
  let to = $state(data.today);
  const range = $derived(preset === 'custom' ? { from, to } : data.presets[preset as keyof typeof data.presets]);
  const valid = $derived(!!range.from && !!range.to && range.from <= range.to);
  const href = (format: 'pdf' | 'zip') => `/app/audit/export?from=${range.from}&to=${range.to}&format=${format}${format === 'pdf' ? `&lang=${L}` : ''}`;

  const groups = ['all', 'hours', 'tickets', 'team', 'pay', 'salon'] as const;
  const link = (show: string, tech: string) => {
    const q = new URLSearchParams();
    if (show !== 'all') q.set('show', show);
    if (tech) q.set('tech', tech);
    const s = q.toString();
    return s ? `?${s}` : page.url.pathname;
  };
  const now = Date.now();
</script>

<svelte:head><title>{t('audit_title')}</title></svelte:head>

<PageHeader title={t('audit_title')} subtitle={t('au_subtitle')} />

<div class="max-w-3xl space-y-6">
  <section class="card" aria-labelledby="export-h">
    <h2 id="export-h" class="text-xl font-bold">{t('au_export_title')}</h2>
    <p class="mb-4 text-sm text-ink-muted">{t('au_export_hint')}</p>
    <SegmentedControl
      label={t('au_range_label')}
      bind:value={preset}
      options={[
        { value: 'this_month', label: t('au_this_month') },
        { value: 'last_month', label: t('au_last_month') },
        { value: 'this_year', label: t('au_this_year') },
        { value: 'custom', label: t('au_custom') }
      ]}
    />
    {#if preset === 'custom'}
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <Field id="from" label={t('audit_from')}><input class="input" id="from" type="date" bind:value={from} max={data.today} /></Field>
        <Field id="to" label={t('audit_to')}><input class="input" id="to" type="date" bind:value={to} max={data.today} /></Field>
      </div>
    {/if}
    {#if valid}<p class="mt-3 text-base font-bold" data-testid="export-range">{fmtDate(range.from, L)} – {fmtDate(range.to, L)}</p>{/if}
    <div class="mt-4 flex flex-wrap gap-3">
      <Button variant="primary" size="lg" icon={IconFile} href={valid ? href('pdf') : undefined} disabled={!valid} data-sveltekit-reload>{t('au_pdf')}</Button>
      <Button size="lg" icon={IconDownload} href={valid ? href('zip') : undefined} disabled={!valid} data-sveltekit-reload>{t('au_csv')}</Button>
    </div>
    <p class="mt-4 flex items-start gap-2 text-sm text-ink-muted"><IconInfo size={16} class="mt-0.5 shrink-0" />{t('au_retention_line', { n: data.retention, state: data.state })}</p>
  </section>

  <section aria-labelledby="history-h" class="space-y-3">
    <div>
      <h2 id="history-h" class="text-xl font-bold">{t('au_history')}</h2>
      <p class="text-sm text-ink-muted">{t('au_history_hint')}</p>
    </div>
    <nav class="flex flex-wrap gap-2" aria-label={t('au_filter')}>
      {#each groups as g (g)}
        <a
          href={link(g, data.tech)}
          data-sveltekit-noscroll
          data-sveltekit-replacestate
          aria-current={data.show === g ? 'true' : undefined}
          class="inline-flex min-h-11 items-center rounded-full border px-4 text-base font-bold transition-colors {data.show === g ? 'border-brand bg-brand text-white' : 'border-line-strong bg-surface text-ink hover:bg-sunken'}">{t(`au_f_${g}` as MessageKey)}</a
        >
      {/each}
    </nav>
    {#if data.workers.length}
      <div class="max-w-xs">
        <Field id="tech" label={t('au_tech')}>
          <select class="input" id="tech" value={data.tech} onchange={(e) => goto(link(data.show, e.currentTarget.value), { noScroll: true, replaceState: true, keepFocus: true })}>
            <option value="">{t('au_tech_all')}</option>
            {#each data.workers as w (w.id)}<option value={w.id}>{w.name}</option>{/each}
          </select>
        </Field>
      </div>
    {/if}

    {#if data.items.length === 0}
      <div class="card"><EmptyState icon={IconHistory} title={t('au_empty')} /></div>
    {:else}
      <ul class="card divide-y divide-line p-0" data-testid="history">
        {#each data.items as e (e.id)}
          <li class="px-4 py-3">
            <p class="text-base text-ink">{e.text}</p>
            {#if e.reason}<p class="mt-0.5 text-sm text-ink-muted">{t('ae_reason', { reason: e.reason })}</p>{/if}
            <p class="mt-0.5 text-sm text-ink-soft"><time datetime={e.ts}>{fmtAgo(e.ts, L, now)}</time> · {fmtDateTime(e.ts, data.tz, L)}</p>
            <details class="group mt-1">
              <summary class="inline-flex min-h-11 cursor-pointer items-center text-sm font-bold text-ink-muted hover:text-ink">{t('au_details')}</summary>
              <dl class="mb-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-xl bg-sunken p-3 font-mono text-xs break-all text-ink-muted">
                <dt>entity</dt><dd>{e.entity} · {e.action}{e.field ? ` · ${e.field}` : ''}</dd>
                <dt>id</dt><dd>{e.entityId}</dd>
                {#if e.oldValue !== null}<dt>before</dt><dd>{e.oldValue}</dd>{/if}
                {#if e.newValue !== null}<dt>after</dt><dd>{e.newValue}</dd>{/if}
              </dl>
            </details>
          </li>
        {/each}
      </ul>
      {#if data.total > data.items.length}<p class="text-sm text-ink-muted">{t('au_more', { n: data.items.length })}</p>{/if}
    {/if}
  </section>
</div>
