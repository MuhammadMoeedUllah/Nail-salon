<script lang="ts">
  import type { Locale } from '$lib/i18n';
  import { explainLine } from '$lib/pay/explain';
  import type { BreakdownLine } from '$lib/pay/engine';
  // The calculation as numbered sentences; the second language underneath when asked (R29).
  let { breakdown, locale, second = null }: { breakdown: BreakdownLine[]; locale: Locale; second?: Locale | null } = $props();
</script>

<ol class="space-y-2">
  {#each breakdown as b, i (b.key + i)}
    <li class="flex gap-3">
      <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-canvas text-sm font-bold text-ink-muted">{i + 1}</span>
      <span class="min-w-0 text-base leading-snug">
        {explainLine(b, locale)}
        {#if second}<span class="block text-sm text-ink-muted" lang={second}>{explainLine(b, second)}</span>{/if}
        {#if b.rule}<span class="block text-sm text-ink-muted">{b.rule}</span>{/if}
      </span>
    </li>
  {/each}
</ol>
