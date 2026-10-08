<script lang="ts">
  import { page } from '$app/state';
  import { makeT, type Locale } from '$lib/i18n';
  import { fmtCents, fmtClock, fmtDate } from '$lib/time';
  import PageHeader from '$lib/ui/PageHeader.svelte';
  import Banner from '$lib/ui/Banner.svelte';
  import Avatar from '$lib/ui/Avatar.svelte';
  import StatusPill from '$lib/ui/StatusPill.svelte';
  import { toast } from '$lib/ui/toast.svelte';
  import { postAction } from '$lib/ui/actions';
  import { sendStatement, smsHref } from '$lib/pay-ui/share';
  import { IconShare, IconCopy, IconMessage, IconDone, IconFile, IconNext } from '$lib/ui/icons';

  let { data } = $props();
  const t = $derived(makeT(data.locale));
  const L = $derived(data.locale);
  const period = $derived(`${fmtDate(data.start, L)} – ${fmtDate(data.end, L)}`);
  const unsent = $derived(data.lines.filter((l) => !l.sentAt));
  const next = $derived(unsent[0] ?? null);
  let busyId = $state('');

  const url = (token: string) => `${page.url.origin}/s/${token}`;
  const message = (l: (typeof data.lines)[number]) => makeT(l.workerLocale as Locale)('sd_message', { salon: data.salonName, period: `${fmtDate(data.start, l.workerLocale)} – ${fmtDate(data.end, l.workerLocale)}` });

  async function send(l: (typeof data.lines)[number]) {
    busyId = l.lineId;
    try {
      const via = await sendStatement({ start: data.start, lineId: l.lineId, url: url(l.token), title: t('statement'), text: message(l) });
      if (via === 'copy') toast(t('sd_copied', { name: l.name }));
    } finally {
      busyId = '';
    }
  }
  async function copy(l: (typeof data.lines)[number]) {
    await navigator.clipboard.writeText(`${message(l)}\n${url(l.token)}`);
    await postAction('?/markSent', { lineId: l.lineId, via: 'copy' });
    toast(t('sd_copied', { name: l.name }));
  }
</script>

<svelte:head><title>{t('sd_title')} · {period}</title></svelte:head>

<PageHeader back={{ href: `/app/pay/${data.start}`, label: t('py_week_title', { start: fmtDate(data.start, L), end: fmtDate(data.end, L) }) }} title={t('sd_title')} subtitle={t('sd_intro')} />

<div class="mx-auto max-w-3xl space-y-4">
  {#if data.status !== 'paid'}<Banner kind="info">{t('sd_not_paid')}</Banner>{/if}

  {#if next}
    <button type="button" class="btn-primary min-h-14 w-full text-lg" onclick={() => send(next)} disabled={busyId === next.lineId}><IconShare size={22} />{t('sd_send_next', { name: next.name })}</button>
  {:else}
    <Banner kind="ok">{t('sd_all_sent')}</Banner>
  {/if}

  <ul class="space-y-3">
    {#each data.lines as l (l.lineId)}
      <li class="card p-4">
        <div class="flex items-center gap-3">
          <Avatar name={l.name} id={l.workerId} size={44} />
          <div class="min-w-0 flex-1">
            <p class="truncate text-lg font-bold">{l.name}</p>
            <p class="text-sm text-ink-muted">{l.workerLocale === 'vi' ? 'Tiếng Việt' : 'English'} · {fmtCents(l.totalCents)}</p>
          </div>
          {#if l.sentAt}<StatusPill kind="ok" icon={IconDone}>{t('sd_sent_at', { time: fmtClock(l.sentAt, data.tz, L) })}</StatusPill>{:else}<StatusPill kind="warn" icon={IconMessage}>{t('sd_not_sent')}</StatusPill>{/if}
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <button type="button" class="{l.sentAt ? 'btn-secondary' : 'btn-primary'} min-h-12 flex-1 px-4" onclick={() => send(l)} disabled={busyId === l.lineId}><IconShare size={20} />{t('sd_send')}</button>
          <a href={smsHref(message(l), url(l.token))} class="btn-secondary min-h-12 px-4" onclick={() => postAction('?/markSent', { lineId: l.lineId, via: 'sms' })}><IconMessage size={20} />{t('sd_text')}</a>
          <button type="button" class="btn-secondary min-h-12 px-4" onclick={() => copy(l)}><IconCopy size={20} />{t('sd_copy')}</button>
          <a href="/app/pay/{data.start}/{l.workerId}" class="btn-ghost min-h-12 px-3"><IconFile size={20} />{t('statement')}<IconNext size={18} /></a>
        </div>
      </li>
    {/each}
  </ul>
</div>
