<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import { IconCheck } from './icons';
  // A selectable pill: technicians, tips, reasons, filters. aria-pressed carries the state; the check icon repeats it (R6).
  let { selected = false, icon: Icon, check = true, size = 'md', class: cls = '', children, ...rest }: { selected?: boolean; icon?: Component<any>; check?: boolean; size?: 'md' | 'lg'; class?: string; children?: Snippet; [key: string]: unknown } = $props();
</script>

<button
  type="button"
  aria-pressed={selected}
  class="inline-flex items-center justify-center gap-1.5 rounded-full border px-4 font-bold leading-snug transition-colors active:translate-y-px {size === 'lg' ? 'min-h-14 text-lg' : 'min-h-12 text-base'} {selected ? 'border-brand bg-brand-soft text-brand-strong ring-1 ring-brand' : 'border-line-strong bg-surface text-ink hover:bg-sunken'} {cls}"
  {...rest}
>
  {#if selected && check}<IconCheck size={18} strokeWidth={3} />{:else if Icon}<Icon size={18} strokeWidth={2.25} />{/if}
  {@render children?.()}
</button>
