<script lang="ts">
  import type { Component } from 'svelte';
  import Button from './Button.svelte';
  import { IconCheck } from './icons';
  // Two-press confirmation instead of a modal (R12). The second button states exactly what will happen.
  // Inside a form the confirm press submits (pass name/value/formaction through); outside, onconfirm runs.
  let { label, confirmLabel, cancelLabel = 'Cancel', hint, variant = 'primary', danger = false, size = 'md', block = false, icon, onconfirm, disabled = false, class: cls = '', ...rest }: {
    label: string; confirmLabel: string; cancelLabel?: string; hint?: string; variant?: 'primary' | 'secondary'; danger?: boolean; size?: 'md' | 'lg'; block?: boolean; icon?: Component<any>; onconfirm?: () => void; disabled?: boolean; class?: string; [key: string]: unknown;
  } = $props();
  let armed = $state(false);
  let armedAt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function arm() {
    armed = true;
    armedAt = Date.now();
    clearTimeout(timer);
    timer = setTimeout(() => (armed = false), 6000);
  }
  function disarm() {
    clearTimeout(timer);
    armed = false;
  }
  function confirmClick(e: MouseEvent) {
    // a fast double tap must not confirm
    if (Date.now() - armedAt < 350) { e.preventDefault(); return; }
    clearTimeout(timer);
    if (onconfirm) { onconfirm(); armed = false; }
    else setTimeout(() => (armed = false), 0);
  }
</script>

{#if !armed}
  <Button variant={danger ? 'secondary' : variant} {size} {block} {icon} {disabled} class="{danger ? 'text-owed' : ''} {cls}" onclick={arm}>{label}</Button>
{:else}
  <div class="flex flex-wrap items-stretch gap-2 {block ? 'w-full' : ''}" role="group">
    <Button type={onconfirm ? 'button' : 'submit'} variant={danger ? 'danger' : 'primary'} {size} icon={IconCheck} class="flex-1 animate-pop" onclick={confirmClick} {...rest}>{confirmLabel}</Button>
    <Button {size} onclick={disarm}>{cancelLabel}</Button>
    {#if hint}<p class="w-full text-sm text-ink-muted" aria-live="assertive">{hint}</p>{/if}
  </div>
{/if}
