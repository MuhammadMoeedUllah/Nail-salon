<script lang="ts">
  import type { Component } from 'svelte';
  // Icon-only control. Only for universally understood icons (close, back, search, print) or with a visible label nearby (R2).
  let { icon: Icon, label, href, variant = 'ghost', size = 'md', class: cls = '', ...rest }: { icon: Component<any>; label: string; href?: string; variant?: 'ghost' | 'secondary'; size?: 'sm' | 'md' | 'lg'; class?: string; [key: string]: unknown } = $props();
  const box = { sm: 'size-11', md: 'size-12', lg: 'size-14' };
  const classes = $derived(`btn btn-${variant} !p-0 ${box[size]} shrink-0 ${cls}`);
</script>

{#if href}
  <a {href} class={classes} aria-label={label} title={label} {...rest}><Icon size={22} strokeWidth={2.25} /></a>
{:else}
  <button type="button" class={classes} aria-label={label} title={label} {...rest}><Icon size={22} strokeWidth={2.25} /></button>
{/if}
