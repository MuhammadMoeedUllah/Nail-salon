<script lang="ts">
  import type { Snippet } from 'svelte';
  // Wide tables: sticky header inside a capped scroll area, optional pinned first column (R17, R18).
  let { caption, sticky = false, pin = false, compact = false, class: cls = '', children }: { caption: string; sticky?: boolean; pin?: boolean; compact?: boolean; class?: string; children?: Snippet } = $props();
</script>

<div class="card overflow-hidden p-0 {cls}">
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div class="overflow-auto {sticky ? 'max-h-[72dvh]' : ''}" role="region" aria-label={caption} tabindex="0">
    <table class="table {sticky ? 'table-sticky' : ''} {pin ? 'table-pin' : ''} {compact ? 'table-compact' : ''}">
      <caption class="sr-only">{caption}</caption>
      {@render children?.()}
    </table>
  </div>
</div>
