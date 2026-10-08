<script lang="ts">
  import type { Snippet } from 'svelte';
  import { IconBack } from './icons';
  // Title, an optional back link, at most one action and an overflow menu (R3, R15).
  let { title, subtitle, back, titleExtra, actions, class: cls = '' }: { title: string; subtitle?: string; back?: { href: string; label: string }; titleExtra?: Snippet; actions?: Snippet; class?: string } = $props();
</script>

<header class="mb-4 sm:mb-6 {cls}">
  {#if back}
    <a href={back.href} class="-ml-2 mb-1 inline-flex min-h-11 items-center gap-1 rounded-lg pr-3 pl-1 text-base font-bold text-brand-strong hover:bg-brand-soft"><IconBack size={22} strokeWidth={2.5} />{back.label}</a>
  {/if}
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      <h1 class="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-bold leading-tight">{title}{@render titleExtra?.()}</h1>
      {#if subtitle}<p class="mt-1 text-base text-ink-muted">{subtitle}</p>{/if}
    </div>
    {#if actions}<div class="flex shrink-0 items-center gap-2">{@render actions()}</div>{/if}
  </div>
</header>
