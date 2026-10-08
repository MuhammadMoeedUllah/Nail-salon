<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import { IconInfo, IconWarn, IconOwed, IconDone } from './icons';
  // Inline message. Errors live here, never in a toast (R13).
  let { kind = 'info', title, icon, class: cls = '', children, action }: { kind?: 'info' | 'ok' | 'warn' | 'error'; title?: string; icon?: Component<any>; class?: string; children?: Snippet; action?: Snippet } = $props();
  const style = { info: 'bg-info-soft text-info-ink', ok: 'bg-ok-soft text-ok-ink', warn: 'bg-warn-soft text-warn-ink', error: 'bg-owed-soft text-owed-ink' };
  const Icon = $derived(icon ?? { info: IconInfo, ok: IconDone, warn: IconWarn, error: IconOwed }[kind]);
</script>

<div role={kind === 'error' ? 'alert' : 'status'} class="flex items-start gap-3 rounded-xl px-4 py-3 {style[kind]} {cls}">
  <Icon size={22} strokeWidth={2.25} class="mt-0.5 shrink-0" />
  <div class="min-w-0 flex-1 text-base leading-snug">
    {#if title}<p class="font-bold">{title}</p>{/if}
    {@render children?.()}
  </div>
  {#if action}<div class="shrink-0 self-center">{@render action()}</div>{/if}
</div>
