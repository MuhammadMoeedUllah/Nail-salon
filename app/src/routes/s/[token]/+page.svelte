<script lang="ts">
  import { goto } from '$app/navigation';
  import Statement from '$lib/components/Statement.svelte';
  import { makeT } from '$lib/i18n';
  import SegmentedControl from '$lib/ui/SegmentedControl.svelte';
  import { IconDownload, IconPrint } from '$lib/ui/icons';
  let { data } = $props();
  const t = $derived(makeT(data.locale));
</script>

<svelte:head><title>{t('statement')} · {data.line.worker.displayName}</title><meta name="robots" content="noindex" /></svelte:head>

<main class="mx-auto max-w-3xl px-3 py-4 sm:py-8">
  <div class="no-print mb-4 space-y-3">
    <SegmentedControl label={t('st_lang')} value={data.lang} onchange={(v) => goto(`?lang=${v}`, { replaceState: true, noScroll: true, keepFocus: true })} options={[{ value: 'both', label: t('st_lang_both') }, { value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'English' }]} />
  </div>
  <div class="card overflow-hidden p-0">
    <Statement locale={data.locale} second={data.second} salon={data.salon} line={data.line} period={data.period} status={data.status} tz={data.tz} generatedOn={data.generatedOn} version={data.line.version} paid={data.line.paid} />
  </div>
  <div class="no-print sticky bottom-0 mt-4 flex gap-2 bg-canvas/95 py-3 backdrop-blur">
    <a class="btn-primary min-h-14 flex-1 text-lg" href="/s/{data.token}/pdf?lang={data.lang}" data-sveltekit-reload><IconDownload size={22} />{t('st_save_pdf')}</a>
    <button type="button" class="btn-secondary min-h-14 px-5 text-lg" onclick={() => window.print()}><IconPrint size={22} />{t('st_print')}</button>
  </div>
</main>
