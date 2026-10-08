<script lang="ts">
  import type { Component } from 'svelte';
  import { DropdownMenu } from 'bits-ui';
  import { IconMenu } from './icons';
  // Overflow menu for rare actions (R15). Items are links or callbacks, each with an icon and a label.
  type Item = { label: string; icon?: Component<any>; href?: string; onSelect?: () => void; danger?: boolean; reload?: boolean };
  let { label, items, showLabel = false, triggerIcon: TriggerIcon = IconMenu, align = 'end' }: { label: string; items: Item[]; showLabel?: boolean; triggerIcon?: Component<any>; align?: 'start' | 'end' } = $props();
  const itemClass = 'flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-base font-bold outline-none data-[highlighted]:bg-sunken';
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class="btn btn-secondary {showLabel ? 'px-3' : 'size-12 !p-0'}" aria-label={showLabel ? undefined : label} title={label}>
    <TriggerIcon size={22} strokeWidth={2.25} />{#if showLabel}<span>{label}</span>{/if}
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content {align} sideOffset={6} collisionPadding={12} class="z-50 min-w-60 animate-pop rounded-2xl border border-line bg-surface p-1.5 shadow-float">
      {#each items as it (it.label)}
        {#if it.href}
          <DropdownMenu.Item textValue={it.label}>
            {#snippet child({ props })}
              <a href={it.href} {...props} class="{itemClass} {it.danger ? 'text-owed' : 'text-ink'}" data-sveltekit-reload={it.reload || undefined}>
                {#if it.icon}<it.icon size={20} strokeWidth={2.25} />{/if}{it.label}
              </a>
            {/snippet}
          </DropdownMenu.Item>
        {:else}
          <DropdownMenu.Item textValue={it.label} onSelect={() => it.onSelect?.()} class="{itemClass} {it.danger ? 'text-owed' : 'text-ink'}">
            {#if it.icon}<it.icon size={20} strokeWidth={2.25} />{/if}{it.label}
          </DropdownMenu.Item>
        {/if}
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
