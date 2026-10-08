<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  let { label, value, sub, tone = 'default', icon: Icon, class: cls = '', children }: { label: string; value: string; sub?: string; tone?: 'default' | 'owed' | 'ok'; icon?: Component<any>; class?: string; children?: Snippet } = $props();
  const toneClass = { default: 'text-ink', owed: 'text-owed', ok: 'text-ok' };
</script>

<div class="card p-4 {cls}">
  <div class="eyebrow flex items-center gap-1.5">{#if Icon}<Icon size={16} strokeWidth={2.5} />{/if}{label}</div>
  <div class="mt-1 text-2xl font-bold leading-tight tabular-nums {toneClass[tone]}">{value}</div>
  {#if sub}<div class="mt-0.5 text-sm text-ink-muted">{sub}</div>{/if}
  {@render children?.()}
</div>
