<script lang="ts">
  import { IconCheck } from './icons';
  // Draft -> Approved -> Paid -> Sent. Past steps carry a check, the current one is filled (R6).
  // On phones only the current step keeps a visible label; the others keep theirs for screen readers.
  let { steps, current, label }: { steps: string[]; current: number; label: string } = $props();
</script>

<ol class="flex w-full items-center gap-1" aria-label={label}>
  {#each steps as s, i}
    <li class="flex min-w-0 flex-1 items-center gap-1.5 {i === current ? 'max-sm:flex-[1_0_auto]' : ''}" aria-current={i === current ? 'step' : undefined}>
      <span class="flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold {i < current ? 'bg-ok text-white' : i === current ? 'bg-brand text-white ring-4 ring-brand-tint' : 'border-2 border-line-strong text-ink-muted'}">
        {#if i < current}<IconCheck size={16} strokeWidth={3} />{:else}{i + 1}{/if}
      </span>
      <span class="min-w-0 {i === current ? '' : 'max-sm:sr-only'}"><span class="block truncate text-sm font-bold {i === current ? 'text-ink' : 'text-ink-muted'}">{s}</span></span>
      {#if i < steps.length - 1}<span class="mx-1 h-0.5 min-w-3 flex-1 rounded {i < current ? 'bg-ok' : 'bg-line'}" aria-hidden="true"></span>{/if}
    </li>
  {/each}
</ol>
