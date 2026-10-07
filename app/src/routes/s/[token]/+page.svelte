<script lang="ts">
  import Statement from '$lib/components/Statement.svelte';
  import { makeT } from '$lib/i18n';
  let { data } = $props();
  const t = $derived(makeT(data.locale));
</script>

<svelte:head><title>{t('statement')} · {data.line.worker.displayName}</title><meta name="robots" content="noindex" /></svelte:head>

<main class="mx-auto max-w-3xl px-2 py-4">
  <div class="no-print mb-3 flex flex-wrap justify-end gap-2">
    <a class="btn-secondary" href="?lang=en" data-sveltekit-reload>English</a>
    <a class="btn-secondary" href="?lang=vi" data-sveltekit-reload>Tiếng Việt</a>
    <a class="btn-secondary" href="/s/{data.token}/pdf?lang={data.locale}">⇩ PDF</a>
    <button class="btn-primary" onclick={() => window.print()}>🖨 {t('st_print')}</button>
  </div>
  <div class="card p-0">
    <Statement locale={data.locale} salon={data.salon} line={data.line} period={data.period} status={data.status} tz={data.tz} generatedOn={data.generatedOn} version={data.line.version} paid={data.line.paid} />
  </div>
</main>
