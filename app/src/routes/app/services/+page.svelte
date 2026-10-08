<script lang="ts">
  import { enhance } from '$app/forms';
  import { tick } from 'svelte';
  import { makeT } from '$lib/i18n';
  import PageHeader from '$lib/ui/PageHeader.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Switch from '$lib/ui/Switch.svelte';
  import Sheet from '$lib/ui/Sheet.svelte';
  import Field from '$lib/ui/Field.svelte';
  import MoneyInput from '$lib/ui/MoneyInput.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import StatusPill from '$lib/ui/StatusPill.svelte';
  import Banner from '$lib/ui/Banner.svelte';
  import { toast } from '$lib/ui/toast.svelte';
  import { postAction } from '$lib/ui/actions';
  import { busy } from '$lib/ui/forms';
  import { money } from '$lib/workers/basis';
  import { dollars } from '$lib/money';
  import { IconAdd, IconUp, IconDown, IconGrip, IconServices, IconSort, IconHide, IconCheck } from '$lib/ui/icons';

  let { data } = $props();
  const t = $derived(makeT(data.locale));
  const L = $derived(data.locale);
  type S = (typeof data.services)[number];
  const label = (s: S) => (L === 'vi' && s.nameVi ? s.nameVi : s.nameEn);

  // local order while dragging; the server order otherwise
  let local = $state<string[] | null>(null);
  const rows = $derived.by(() => {
    if (!local) return data.services;
    const by = new Map(data.services.map((s) => [s.id, s]));
    return local.map((id) => by.get(id)).filter((s): s is S => !!s);
  });
  let said = $state('');

  async function move(s: S, dir: 'up' | 'down') {
    const i = rows.findIndex((x) => x.id === s.id);
    const r = await postAction('?/move', { id: s.id, dir });
    if (r.type !== 'success') return toast(t('something_wrong'), { kind: 'info' });
    const to = i + (dir === 'up' ? -1 : 1) + 1;
    said = `${label(s)}: ${to} / ${rows.length}`;
    await tick();
    const first = to === 1, last = to === rows.length;
    document.getElementById(`${(dir === 'up' && !first) || last ? 'up' : 'down'}-${s.id}`)?.focus();
  }
  async function setActive(s: S, input: HTMLInputElement) {
    const active = input.checked;
    const r = await postAction('?/setActive', { id: s.id, active: active ? '1' : '' });
    if (r.type !== 'success') {
      input.checked = !active;
      return toast(t('something_wrong'), { kind: 'info' });
    }
    toast(t(active ? 'sv_shown' : 'sv_hidden_toast', { name: label(s) }), { undo: () => postAction('?/setActive', { id: s.id, active: active ? '' : '1' }) });
  }
  async function sortByUse() {
    const r = await postAction('?/sortByUse', {});
    if (r.type === 'success') {
      const before = (r.data?.before as string[]) ?? [];
      toast(t('sv_sorted'), { undo: () => postAction('?/reorder', { ids: before.join(',') }) });
    }
  }

  // drag and drop on a pointer device: the grip arms the row, the drop saves the whole order
  let armed = $state<string | null>(null);
  let dragId = $state<string | null>(null);
  function dragOver(e: DragEvent, over: S) {
    if (!dragId) return;
    e.preventDefault();
    if (over.id === dragId) return;
    const ids = (local ?? data.services.map((s) => s.id)).filter((id) => id !== dragId);
    const at = ids.indexOf(over.id);
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    ids.splice(e.clientY > box.top + box.height / 2 ? at + 1 : at, 0, dragId);
    local = ids;
  }
  async function dragEnd() {
    const ids = local;
    const before = data.services.map((s) => s.id);
    dragId = armed = null;
    if (!ids || ids.join() === before.join()) return (local = null);
    await postAction('?/reorder', { ids: ids.join(',') });
    local = null;
    toast(t('sv_moved'), { undo: () => postAction('?/reorder', { ids: before.join(',') }) });
  }

  // add and edit share one sheet
  let open = $state(false);
  let editing = $state<S | null>(null);
  let nameEn = $state('');
  let nameVi = $state('');
  let price = $state('');
  let error = $state('');
  function edit(s: S | null) {
    editing = s;
    nameEn = s?.nameEn ?? '';
    nameVi = s?.nameVi ?? '';
    price = s ? dollars(s.defaultPriceCents) : '';
    error = '';
    open = true;
  }
</script>

<svelte:head><title>{t('nav_services')}</title></svelte:head>

<PageHeader title={t('nav_services')} subtitle={t('sv_subtitle')}>
  {#snippet actions()}
    {#if data.isOwner && data.services.length}<Button variant="primary" icon={IconAdd} onclick={() => edit(null)}>{t('sv_add')}</Button>{/if}
  {/snippet}
</PageHeader>

{#if data.services.length === 0}
  <div class="card">
    <EmptyState icon={IconServices} title={t('sv_empty_title')} text={t('sv_empty_text')}>
      {#if data.isOwner}<Button variant="primary" icon={IconAdd} onclick={() => edit(null)}>{t('sv_add')}</Button>{/if}
    </EmptyState>
  </div>
{:else}
  <div class="space-y-3">
    {#if data.isOwner}
      <div class="flex flex-wrap items-center gap-3">
        <Button icon={IconSort} onclick={sortByUse}>{t('sv_sort_use')}</Button>
        <p class="text-sm text-ink-muted">{t('sv_drag_hint')}</p>
      </div>
    {/if}
    <ul class="card divide-y divide-line overflow-hidden p-0" aria-label={t('sv_list_label')}>
      {#each rows as s, i (s.id)}
        <li
          class="flex items-center gap-2 px-2 py-2 transition-colors sm:gap-3 sm:px-3 {s.active ? '' : 'bg-canvas'} {dragId === s.id ? 'opacity-60 ring-2 ring-brand ring-inset' : ''}"
          draggable={armed === s.id}
          ondragstart={(e) => { dragId = s.id; e.dataTransfer?.setData('text/plain', s.id); if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'; }}
          ondragover={(e) => dragOver(e, s)}
          ondrop={(e) => e.preventDefault()}
          ondragend={dragEnd}
        >
          {#if data.isOwner}
            <span class="hidden cursor-grab items-center text-ink-soft lg:flex" onpointerdown={() => (armed = s.id)} onpointerup={() => (armed = null)} title={t('sv_drag', { name: label(s) })} aria-hidden="true"><IconGrip size={20} /></span>
            <span class="flex shrink-0 gap-1">
              <button type="button" id="up-{s.id}" class="btn-ghost size-11 !min-h-11 !p-0 disabled:bg-transparent disabled:opacity-25" disabled={i === 0} aria-label={t('sv_move_up', { name: label(s) })} onclick={() => move(s, 'up')}><IconUp size={20} /></button>
              <button type="button" id="down-{s.id}" class="btn-ghost size-11 !min-h-11 !p-0 disabled:bg-transparent disabled:opacity-25" disabled={i === rows.length - 1} aria-label={t('sv_move_down', { name: label(s) })} onclick={() => move(s, 'down')}><IconDown size={20} /></button>
            </span>
          {/if}
          <button type="button" class="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg px-2 text-left hover:bg-sunken disabled:cursor-default disabled:hover:bg-transparent" disabled={!data.isOwner} onclick={() => edit(s)}>
            <span class="min-w-0 flex-1">
              <span class="block text-base leading-tight font-bold {s.active ? 'text-ink' : 'text-ink-muted'}">{label(s)}</span>
              {#if s.nameVi && s.nameVi !== s.nameEn}<span class="block text-sm text-ink-muted" lang={L === 'vi' ? 'en' : 'vi'}>{L === 'vi' ? s.nameEn : s.nameVi}</span>{/if}
              <span class="block text-sm text-ink-soft">{s.used ? t('sv_used', { n: s.used }) : t('sv_unused')}</span>
            </span>
            {#if !s.active}<StatusPill kind="neutral" icon={IconHide}>{t('sv_hidden')}</StatusPill>{/if}
            <span class="shrink-0 text-base font-bold tabular-nums">{money(s.defaultPriceCents)}</span>
          </button>
          <Switch showLabel={false} label={t('sv_show_switch', { name: label(s) })} checked={s.active} disabled={!data.isOwner} onchange={(e) => setActive(s, e.currentTarget)} class="shrink-0 px-1" />
        </li>
      {/each}
    </ul>
    <p class="sr-only" aria-live="polite">{said}</p>
  </div>
{/if}

<Sheet bind:open title={editing ? t('sv_edit') : t('sv_add')} closeLabel={t('close')}>
  <form
    id="sv-form"
    method="post"
    action="?/save"
    class="space-y-4"
    use:enhance={busy(() => async ({ result, update }) => {
      if (result.type === 'success') {
        open = false;
        toast(t(result.data?.added ? 'sv_added' : 'sv_saved', { name: String(result.data?.name ?? '') }));
      } else if (result.type === 'failure') error = t('sv_name_required');
      await update({ reset: false });
    })}
  >
    {#if error}<Banner kind="error">{error}</Banner>{/if}
    <input type="hidden" name="id" value={editing?.id ?? ''} />
    <Field id="sv-en" label={t('sv_name_en')} error={error ? t('sv_name_required') : null}>
      <input class="input" id="sv-en" name="nameEn" required maxlength="60" bind:value={nameEn} aria-invalid={!!error} aria-describedby="sv-en-error" />
    </Field>
    <Field id="sv-vi" label={t('sv_name_vi')} hint={t('sv_name_vi_hint')}>
      <input class="input" id="sv-vi" name="nameVi" maxlength="60" lang="vi" bind:value={nameVi} aria-describedby="sv-vi-hint" />
    </Field>
    <Field id="sv-price" label={t('sv_price')} hint={t('sv_price_hint')}>
      <div class="w-44"><MoneyInput id="sv-price" name="price" bind:value={price} aria-describedby="sv-price-hint" /></div>
    </Field>
  </form>
  {#snippet footer()}
    <Button type="submit" form="sv-form" variant="primary" size="lg" block icon={IconCheck}>{t('save')}</Button>
  {/snippet}
</Sheet>
