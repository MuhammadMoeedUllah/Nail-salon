<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  // An empty screen names its job and offers the first step (R28).
  let { icon: Icon, title, text, class: cls = '', children }: { icon?: Component<any>; title: string; text?: string; class?: string; children?: Snippet } = $props();
</script>

<div class="flex flex-col items-center px-4 py-8 text-center {cls}">
  {#if Icon}<div class="mb-3 flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand"><Icon size={28} strokeWidth={2} /></div>{/if}
  <p class="text-lg font-bold">{title}</p>
  {#if text}<p class="mt-1 max-w-md text-base text-ink-muted">{text}</p>{/if}
  {#if children}<div class="mt-4 flex flex-wrap justify-center gap-2">{@render children()}</div>{/if}
</div>
