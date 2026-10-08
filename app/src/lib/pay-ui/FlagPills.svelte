<script lang="ts">
  import { makeT, type Locale, type MessageKey } from '$lib/i18n';
  import StatusPill from '$lib/ui/StatusPill.svelte';
  import { IconOwed, IconWarn, IconInfo } from '$lib/ui/icons';
  // Engine flags as pills: colour + icon + words (R6). Owed first, then things to check, then notes.
  let { flags, locale }: { flags: string[]; locale: Locale } = $props();
  const t = $derived(makeT(locale));
  const OWED = ['OT_OWED', 'MIN_WAGE_TOPUP'];
  const WARN = ['OPEN_PUNCH', 'TICKETS_WITHOUT_HOURS', 'LONG_DAY', 'SPREAD_OF_HOURS', 'DAILY_OT', 'SECTION_7I_POSSIBLE'];
  const sorted = $derived([...flags].sort((a, b) => rank(a) - rank(b)));
  function rank(f: string) {
    return OWED.includes(f) ? 0 : WARN.includes(f) ? 1 : 2;
  }
</script>

{#if sorted.length}
  <ul class="flex flex-wrap gap-1.5">
    {#each sorted as f (f)}
      <li>
        {#if OWED.includes(f)}<StatusPill kind="owed" icon={IconOwed}>{t(`flag_${f}` as MessageKey)}</StatusPill>
        {:else if WARN.includes(f)}<StatusPill kind="warn" icon={IconWarn}>{t(`flag_${f}` as MessageKey)}</StatusPill>
        {:else}<StatusPill kind="neutral" icon={IconInfo}>{t(`flag_${f}` as MessageKey)}</StatusPill>{/if}
      </li>
    {/each}
  </ul>
{/if}
