<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Statement from '$lib/components/Statement.svelte';
  import { makeT } from '$lib/i18n';
  import { fmtDate } from '$lib/time';
  import PageHeader from '$lib/ui/PageHeader.svelte';
  import SegmentedControl from '$lib/ui/SegmentedControl.svelte';
  import Banner from '$lib/ui/Banner.svelte';
  import Menu from '$lib/ui/Menu.svelte';
  import { toast } from '$lib/ui/toast.svelte';
  import { sendStatement, smsHref } from '$lib/pay-ui/share';
  import { IconShare, IconDownload, IconPrint, IconMessage } from '$lib/ui/icons';
  let { data } = $props();
  const t = $derived(makeT(data.uiLocale));
  const tw = $derived(makeT(data.line.worker.locale === 'vi' ? 'vi' : 'en'));
  const shareUrl = $derived(data.shareToken ? `${page.url.origin}/s/${data.shareToken}${data.lang === 'both' ? '' : `?lang=${data.lang}`}` : '');
  const message = $derived(tw('sd_message', { salon: data.salon.name, period: `${fmtDate(data.period.start, data.locale)} – ${fmtDate(data.period.end, data.locale)}` }));
  let sending = $state(false);
  async function send() {
    if (!data.lineId) return;
    sending = true;
    try {
      const via = await sendStatement({ start: data.period.start, lineId: data.lineId, url: shareUrl, title: t('statement'), text: message });
      if (via === 'copy') toast(t('sd_copied', { name: data.line.worker.displayName }));
    } finally {
      sending = false;
    }
  }
</script>

<svelte:head><title>{t('statement')} · {data.line.worker.displayName}</title></svelte:head>

<div class="no-print">
  <PageHeader back={{ href: `/app/pay/${data.period.start}?focus=${data.line.worker.id}`, label: t('py_week_title', { start: fmtDate(data.period.start, data.uiLocale), end: fmtDate(data.period.end, data.uiLocale) }) }} title="{t('statement')} · {data.line.worker.displayName}">
    {#snippet actions()}
      {#if data.shareToken}<Menu label={t('options')} items={[{ label: t('sd_text'), icon: IconMessage, href: smsHref(message, shareUrl) }, { label: 'PDF', icon: IconDownload, href: `/s/${data.shareToken}/pdf?lang=${data.lang}`, reload: true }]} />{/if}
    {/snippet}
  </PageHeader>
  <SegmentedControl label={t('st_lang')} class="mb-4 max-w-lg" value={data.lang} onchange={(v) => goto(`?lang=${v}`, { replaceState: true, noScroll: true, keepFocus: true })} options={[{ value: 'both', label: t('st_lang_both') }, { value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'English' }]} />
  {#if !data.shareToken}<Banner kind="info" class="mb-4">{t('pay_status_draft')} · {t('pay_approve_hint')}</Banner>{/if}
</div>

<div class="card overflow-hidden p-0">
  <Statement locale={data.locale} second={data.second} salon={data.salon} line={data.line} period={data.period} status={data.status} tz={data.tz} generatedOn={data.generatedOn} version={data.line.version ?? 1} paid={data.line.paid ?? null} />
</div>
<div class="h-24 lg:h-4" aria-hidden="true"></div>

<div class="no-print fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:sticky lg:bottom-0 lg:-mx-8 lg:mt-4 lg:px-8">
  <div class="mx-auto flex max-w-6xl flex-wrap justify-end gap-2">
    <button type="button" class="btn-secondary min-h-14 px-5 text-lg" onclick={() => window.print()}><IconPrint size={22} />{t('st_print')}</button>
    {#if data.shareToken}
      <a href="/s/{data.shareToken}/pdf?lang={data.lang}" data-sveltekit-reload class="btn-secondary min-h-14 px-5 text-lg"><IconDownload size={22} />PDF</a>
      <button type="button" class="btn-primary min-h-14 flex-1 px-6 text-lg sm:flex-none" onclick={send} disabled={sending}><IconShare size={22} />{t('sd_send')}</button>
    {/if}
  </div>
</div>
