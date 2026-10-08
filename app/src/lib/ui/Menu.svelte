<script lang="ts">
  import { tick, type Component } from 'svelte';
  import { IconMenu } from './icons';
  // Overflow menu for rare actions (R15): the WAI-ARIA menu button pattern without a positioning library (UX-56).
  // Enter, Space or Down opens on the first item, Up opens on the last; arrows, Home and End move; Escape closes.
  type Item = { label: string; icon?: Component<any>; href?: string; onSelect?: () => void; danger?: boolean; reload?: boolean };
  let { label, items, showLabel = false, triggerIcon: TriggerIcon = IconMenu, align = 'end' }: { label: string; items: Item[]; showLabel?: boolean; triggerIcon?: Component<any>; align?: 'start' | 'end' } = $props();
  const uid = $props.id();
  let open = $state(false);
  let root = $state<HTMLElement>();
  let btn = $state<HTMLButtonElement>();
  let menu = $state<HTMLElement>();
  const entries = () => [...(menu?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])];

  async function show(at: 'first' | 'last') {
    open = true;
    await tick();
    const e = entries();
    (at === 'first' ? e[0] : e.at(-1))?.focus();
  }
  function hide(returnFocus: boolean) {
    open = false;
    if (returnFocus) btn?.focus();
  }
  function onTriggerKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      show(e.key === 'ArrowDown' ? 'first' : 'last');
    }
  }
  function onMenuKey(e: KeyboardEvent) {
    const list = entries();
    const i = list.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => {
      e.preventDefault();
      list[(n + list.length) % list.length]?.focus();
    };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(list.length - 1);
    else if (e.key === 'Escape') {
      e.preventDefault();
      hide(true);
    } else if (e.key === 'Tab') hide(false);
  }
  function choose(it: Item) {
    hide(true);
    it.onSelect?.();
  }
  // a press anywhere else closes the menu
  $effect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root?.contains(e.target as Node)) hide(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  });
  const itemClass = 'flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-base font-bold outline-none hover:bg-sunken focus:bg-sunken focus-visible:outline-2 focus-visible:outline-focus';
</script>

<div class="relative" bind:this={root}>
  <button
    bind:this={btn}
    type="button"
    id="{uid}-btn"
    class="btn btn-secondary {showLabel ? 'px-3' : 'size-12 !p-0'}"
    aria-haspopup="menu"
    aria-expanded={open}
    aria-controls={open ? `${uid}-menu` : undefined}
    aria-label={showLabel ? undefined : label}
    title={label}
    onclick={() => (open ? hide(false) : show('first'))}
    onkeydown={onTriggerKey}
  >
    <TriggerIcon size={22} strokeWidth={2.25} />{#if showLabel}<span>{label}</span>{/if}
  </button>
  {#if open}
    <div bind:this={menu} id="{uid}-menu" role="menu" tabindex="-1" aria-labelledby="{uid}-btn" class="absolute top-full z-50 mt-1.5 min-w-60 animate-pop rounded-2xl border border-line bg-surface p-1.5 shadow-float {align === 'end' ? 'right-0' : 'left-0'}" onkeydown={onMenuKey}>
      {#each items as it (it.label)}
        {#if it.href}
          <a role="menuitem" tabindex="-1" href={it.href} class="{itemClass} {it.danger ? 'text-owed' : 'text-ink'}" data-sveltekit-reload={it.reload || undefined} onclick={() => hide(false)}>
            {#if it.icon}<it.icon size={20} strokeWidth={2.25} />{/if}{it.label}
          </a>
        {:else}
          <button role="menuitem" tabindex="-1" type="button" class="{itemClass} {it.danger ? 'text-owed' : 'text-ink'}" onclick={() => choose(it)}>
            {#if it.icon}<it.icon size={20} strokeWidth={2.25} />{/if}{it.label}
          </button>
        {/if}
      {/each}
    </div>
  {/if}
</div>
