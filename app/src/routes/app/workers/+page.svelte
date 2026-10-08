<script lang="ts">
  import { makeT } from '$lib/i18n';
  import PageHeader from '$lib/ui/PageHeader.svelte';
  import SegmentedControl from '$lib/ui/SegmentedControl.svelte';
  import Avatar from '$lib/ui/Avatar.svelte';
  import StatusPill from '$lib/ui/StatusPill.svelte';
  import Switch from '$lib/ui/Switch.svelte';
  import Banner from '$lib/ui/Banner.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { toast } from '$lib/ui/toast.svelte';
  import { postAction } from '$lib/ui/actions';
  import { basisSentence } from '$lib/workers/basis';
  import { IconUserPlus, IconNext, IconLock, IconUsers } from '$lib/ui/icons';

  let { data } = $props();
  const t = $derived(makeT(data.locale));
  type W = (typeof data.workers)[number];
  const activeCount = $derived(data.workers.filter((w) => w.active).length);
  let show = $state('active');
  // a row switched off here stays in view until the next visit, so it does not jump away under the finger
  let touched = $state<Record<string, boolean>>({});
  const rows = $derived(show === 'all' ? data.workers : data.workers.filter((w) => w.active || touched[w.id]));

  async function setActive(w: W, input: HTMLInputElement) {
    const active = input.checked;
    touched[w.id] = true;
    const r = await postAction('?/setActive', { id: w.id, active: active ? '1' : '' });
    if (r.type !== 'success') {
      input.checked = !active;
      toast(t('something_wrong'), { kind: 'info' });
      return;
    }
    toast(t(active ? 'wk_set_active' : 'wk_set_inactive', { name: w.displayName }), { undo: () => postAction('?/setActive', { id: w.id, active: active ? '' : '1' }) });
  }
  async function unlock(w: W) {
    const r = await postAction('?/unlockPin', { id: w.id });
    if (r.type === 'success') toast(t('wk_pin_unlocked', { name: w.displayName }));
  }
</script>

<svelte:head><title>{t('workers_title')}</title></svelte:head>

<PageHeader title={t('workers_title')} subtitle={data.workers.length ? t('wk_subtitle', { n: activeCount }) : undefined}>
  {#snippet actions()}
    {#if data.isOwner && data.workers.length}<Button variant="primary" href="/app/workers/new" icon={IconUserPlus}>{t('worker_new')}</Button>{/if}
  {/snippet}
</PageHeader>

<div class="space-y-4">
  {#if data.welcome}
    <Banner kind="info" title={t('wk_welcome_title')}>{t('wk_welcome_text')}</Banner>
  {/if}

  {#if data.workers.length === 0}
    <div class="card">
      <EmptyState icon={IconUsers} title={t('wk_empty_title')} text={t('wk_empty_text')}>
        {#if data.isOwner}<Button variant="primary" href="/app/workers/new" icon={IconUserPlus}>{t('worker_new')}</Button>{/if}
      </EmptyState>
    </div>
  {:else}
    {#if data.workers.length > activeCount}
      <SegmentedControl label={t('wk_filter_label')} bind:value={show} class="max-w-md" options={[{ value: 'active', label: t('wk_filter_active', { n: activeCount }) }, { value: 'all', label: t('wk_filter_all', { n: data.workers.length }) }]} />
    {/if}

    <ul class="card divide-y divide-line overflow-hidden p-0" aria-label={t('workers_title')}>
      {#each rows as w (w.id)}
        <li class="relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-sunken {w.active ? '' : 'bg-canvas'}">
          <Avatar name={w.displayName} id={w.id} size={44} class={w.active ? '' : 'opacity-60'} />
          <div class="min-w-0 flex-1">
            <a href="/app/workers/{w.id}" class="text-lg leading-tight font-bold text-ink after:absolute after:inset-0 after:content-['']">{w.displayName}</a>
            <p class="text-sm text-ink-muted">{basisSentence(w, t)}</p>
            <p class="hidden text-sm text-ink-soft sm:block">{w.legalName} · {w.locale === 'vi' ? 'Tiếng Việt' : 'English'} · {w.classification === '1099' ? '1099' : 'W-2'}</p>
            {#if !w.active || w.locked}
              <p class="mt-1.5 flex flex-wrap gap-1.5">
                {#if !w.active}<StatusPill kind="neutral">{t('wk_not_active')}</StatusPill>{/if}
                {#if w.locked}<StatusPill kind="warn" icon={IconLock}>{t('wk_pin_locked')}</StatusPill>{/if}
              </p>
            {/if}
          </div>
          {#if w.locked && data.isOwner}
            <button type="button" class="btn-secondary relative z-10 min-h-11 px-3 text-sm" onclick={() => unlock(w)}>{t('wk_pin_unlock')}</button>
          {/if}
          <div class="relative z-10">
            <Switch showLabel={false} label={t('wk_active_switch', { name: w.displayName })} checked={w.active} disabled={!data.isOwner} onchange={(e) => setActive(w, e.currentTarget)} class="px-1" />
          </div>
          <IconNext size={20} class="shrink-0 text-ink-soft" aria-hidden="true" />
        </li>
      {/each}
    </ul>
  {/if}

  {#if data.state === 'NY' && data.workers.length}
    <Banner kind="info" title={t('wk_ny_bond_title')}>{t('ny_bond_hint')} {t('wk_ny_bond_count', { n: activeCount })}</Banner>
  {/if}
</div>
