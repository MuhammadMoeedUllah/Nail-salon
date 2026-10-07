<script lang="ts">
  import { page } from '$app/state';
  import Statement from '$lib/components/Statement.svelte';
  import { makeT } from '$lib/i18n';
  let { data } = $props();
  const t = $derived(makeT(data.uiLocale));
  let copied = $state(false);
  async function copy() {
    const url = `${page.url.origin}/s/${data.shareToken}`;
    await navigator.clipboard.writeText(url);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<svelte:head><title>{t('statement')} · {data.line.worker.displayName}</title></svelte:head>

<div class="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
  <a class="text-sm text-stone-500 underline" href="/app/pay/{data.period.start}">← {t('pay_week')}</a>
  <div class="flex flex-wrap gap-2">
    <a class="btn-secondary" href="?lang=en" data-sveltekit-reload class:ring-brand-600={data.locale === 'en'}>English</a>
    <a class="btn-secondary" href="?lang=vi" data-sveltekit-reload class:ring-brand-600={data.locale === 'vi'}>Tiếng Việt</a>
    <button class="btn-secondary" onclick={() => window.print()}>🖨 {t('st_print')}</button>
    {#if data.shareToken}
      <a class="btn-secondary" href="/s/{data.shareToken}/pdf?lang={data.locale}">⇩ PDF</a>
      <button class="btn-primary" onclick={copy}>{copied ? t('st_link_copied') : t('st_share')}</button>
    {:else}
      <span class="self-center text-sm text-stone-500">{t('pay_status_draft')} · {t('pay_approve_hint')}</span>
    {/if}
  </div>
</div>

<div class="card p-0">
  <Statement locale={data.locale} salon={data.salon} line={data.line} period={data.period} status={data.status} tz={data.tz} generatedOn={data.generatedOn} version={data.line.version ?? 1} paid={data.line.paid ?? null} />
</div>
