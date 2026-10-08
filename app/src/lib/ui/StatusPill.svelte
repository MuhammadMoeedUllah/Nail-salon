<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  // Status = colour + icon + word, never colour alone (R6).
  let { kind = 'neutral', icon: Icon, size = 'md', class: cls = '', children }: { kind?: 'ok' | 'warn' | 'owed' | 'info' | 'brand' | 'neutral'; icon?: Component<any>; size?: 'md' | 'lg'; class?: string; children?: Snippet } = $props();
</script>

<span class="pill pill-{kind} {size === 'lg' ? 'px-3 py-1.5 text-base' : ''} {cls}">
  {#if Icon}<Icon size={size === 'lg' ? 18 : 16} strokeWidth={2.5} />{/if}
  {@render children?.()}
</span>
