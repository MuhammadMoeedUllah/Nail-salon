<script lang="ts">
  import { enhance } from '$app/forms';
  import { makeT, type MessageKey } from '$lib/i18n';
  import { fmtAgo, fmtDate, fmtWall, localDate } from '$lib/time';
  import PageHeader from '$lib/ui/PageHeader.svelte';
  import Button from '$lib/ui/Button.svelte';
  import ConfirmButton from '$lib/ui/ConfirmButton.svelte';
  import Switch from '$lib/ui/Switch.svelte';
  import StatusPill from '$lib/ui/StatusPill.svelte';
  import Banner from '$lib/ui/Banner.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import { toast } from '$lib/ui/toast.svelte';
  import { postAction } from '$lib/ui/actions';
  import { busy } from '$lib/ui/forms';
  import { IconTablet, IconOnline, IconClock, IconCopy, IconNext, IconSteps, IconWarn } from '$lib/ui/icons';

  let { data } = $props();
  const t = $derived(makeT(data.locale));
  const L = $derived(data.locale);
  const pairUrl = $derived(`${data.origin}/kiosk/pair`);
  const now = Date.now();
  const online = (iso: string | null) => !!iso && now - new Date(iso).getTime() < 5 * 60_000;
  const dupName = $derived.by(() => {
    const seen = new Set<string>();
    for (const d of data.devices) {
      const k = d.name.trim().toLowerCase();
      if (seen.has(k)) return d.name;
      seen.add(k);
    }
    return null;
  });
  const switches = $derived([
    { key: 'photoOnPunch', label: t('tb_photo'), hint: t('tb_photo_hint') },
    { key: 'kioskAutoClockIn', label: t('tb_auto_in'), hint: t('kiosk_auto_in_hint') },
    { key: 'kioskShowTickets', label: t('tb_tickets'), hint: t('tb_tickets_hint') },
    { key: 'kioskSounds', label: t('tb_sounds'), hint: t('tb_sounds_hint') },
    { key: 'kioskDimAfterClose', label: t('tb_dim'), hint: t('tb_dim_hint', { time: fmtWall(data.closingTime, L) }) }
  ] as { key: keyof typeof data.kiosk; label: string; hint: string }[]);

  async function setSwitch(key: string, label: string, input: HTMLInputElement) {
    const value = input.checked;
    const r = await postAction('?/kiosk', { key, value: value ? '1' : '' });
    if (r.type !== 'success') {
      input.checked = !value;
      return toast(t('something_wrong'), { kind: 'info' });
    }
    toast(t(value ? 'tb_saved_on' : 'tb_saved_off', { setting: label }), { undo: () => postAction('?/kiosk', { key, value: value ? '' : '1' }) });
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(pairUrl);
      toast(t('tb_copied'));
    } catch {
      toast(t('something_wrong'), { kind: 'info' });
    }
  }
</script>

<svelte:head><title>{t('nav_tablets')}</title></svelte:head>

<PageHeader title={t('nav_tablets')} subtitle={t('tb_subtitle')} />

<div class="max-w-3xl space-y-4">
  {#if dupName}<Banner kind="warn" icon={IconWarn} title={t('tb_dup', { name: dupName })}>{t('tb_dup_text')}</Banner>{/if}

  <section class="card" aria-labelledby="paired-h">
    <h2 id="paired-h" class="mb-2 text-xl font-bold">{t('tb_paired')}</h2>
    {#if data.devices.length === 0}
      <EmptyState icon={IconTablet} title={t('tb_none')} text={t('tb_none_text')} />
    {:else}
      <ul class="divide-y divide-line">
        {#each data.devices as d (d.id)}
          <li class="flex flex-wrap items-center gap-3 py-3">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sunken text-ink-muted"><IconTablet size={22} /></span>
            <div class="min-w-0 flex-1">
              <p class="text-base font-bold">{d.name}</p>
              <p class="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                {#if online(d.lastSeenAt)}<StatusPill kind="ok" icon={IconOnline}>{t('tb_online')}</StatusPill>
                {:else if d.lastSeenAt}<StatusPill kind="neutral" icon={IconClock}>{t('tb_last_seen', { ago: fmtAgo(d.lastSeenAt, L, now) })}</StatusPill>
                {:else}<StatusPill kind="neutral">{t('tb_never_seen')}</StatusPill>{/if}
                <span>{t('tb_paired_on', { date: fmtDate(localDate(d.createdAt, data.tz), L) })}</span>
              </p>
            </div>
            {#if data.canUnpair}
              <form
                method="post"
                action="?/unpair"
                use:enhance={busy(() => async ({ result, update }) => {
                  if (result.type === 'success') toast(t('tb_unpaired', { name: d.name }));
                  await update();
                })}
              >
                <input type="hidden" name="id" value={d.id} />
                <ConfirmButton variant="secondary" danger label={t('tb_unpair')} confirmLabel={t('tb_unpair_confirm', { name: d.name })} cancelLabel={t('cancel')} hint={t('tb_unpair_hint')} />
              </form>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="card" aria-labelledby="pair-h">
    <h2 id="pair-h" class="mb-4 text-xl font-bold">{t('tb_pair_title')}</h2>
    <ol class="space-y-4">
      <li class="flex gap-3">
        <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-strong" aria-hidden="true">1</span>
        <div class="min-w-0 flex-1">
          <p class="text-base">{t('tb_step1')}</p>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <code class="min-w-0 rounded-xl bg-sunken px-3 py-2.5 font-mono text-base font-bold break-all text-ink">{pairUrl}</code>
            <Button size="sm" icon={IconCopy} onclick={copy}>{t('tb_copy')}</Button>
          </div>
        </div>
      </li>
      <li class="flex gap-3">
        <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-strong" aria-hidden="true">2</span>
        <p class="min-w-0 flex-1 text-base">{t('tb_step2')}</p>
      </li>
      <li class="flex gap-3">
        <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-strong" aria-hidden="true">3</span>
        <div class="min-w-0 flex-1">
          <p class="text-base">{t('tb_step3')}</p>
          <a href="/kiosk/setup" class="mt-1 inline-flex min-h-11 items-center gap-1 font-bold text-brand-strong underline decoration-brand-tint decoration-2 underline-offset-4"><IconSteps size={18} />{t('tb_setup_guide')}<IconNext size={18} /></a>
        </div>
      </li>
    </ol>
    {#if data.canUnpair}<div class="mt-4 border-t border-line pt-4"><Button href="/kiosk/pair" icon={IconTablet}>{t('tb_pair_here')}</Button></div>{/if}
  </section>

  <section class="card" aria-labelledby="how-h">
    <h2 id="how-h" class="mb-2 text-xl font-bold">{t('tb_behaviour')}</h2>
    {#if !data.isOwner}<p class="mb-2 text-sm text-ink-muted">{t('se_owner_only')}</p>{/if}
    <div class="divide-y divide-line">
      {#each switches as s (s.key)}
        <Switch label={s.label} hint={s.hint} checked={data.kiosk[s.key]} disabled={!data.isOwner} onchange={(e) => setSwitch(s.key, s.label, e.currentTarget)} class="py-2" />
      {/each}
    </div>
  </section>
</div>
