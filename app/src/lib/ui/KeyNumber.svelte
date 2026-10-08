<script lang="ts">
  import { IconOwed, IconDone } from './icons';
  // The one number a screen is about, with its verdict as icon + words (R6, R17).
  let { value, label, tone = 'neutral', size = 'lg', class: cls = '' }: { value: string; label: string; tone?: 'owed' | 'ok' | 'neutral'; size?: 'md' | 'lg'; class?: string } = $props();
</script>

<div class={cls}>
  <div class="font-bold leading-none tabular-nums {size === 'lg' ? 'text-[2rem]' : 'text-2xl'} {tone === 'owed' ? 'text-owed' : tone === 'ok' ? 'text-ok' : 'text-ink'}">{value}</div>
  <div class="mt-1.5 flex items-center gap-1.5 text-base font-bold {tone === 'owed' ? 'text-owed-ink' : tone === 'ok' ? 'text-ok-ink' : 'text-ink-muted'}">
    {#if tone === 'owed'}<IconOwed size={18} strokeWidth={2.5} />{:else if tone === 'ok'}<IconDone size={18} strokeWidth={2.5} />{/if}
    <span>{label}</span>
  </div>
</div>
