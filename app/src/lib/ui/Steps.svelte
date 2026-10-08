<script lang="ts">
  import { IconCheck, IconNext } from './icons';
  // Setup checklist with progress (R28).
  type Step = { label: string; hint?: string; href: string; done: boolean };
  let { steps, title, progressLabel }: { steps: Step[]; title: string; progressLabel: string } = $props();
  const doneCount = $derived(steps.filter((s) => s.done).length);
</script>

<div>
  <div class="mb-3 flex items-center justify-between gap-3">
    <p class="text-lg font-bold">{title}</p>
    <span class="text-sm font-bold text-ink-muted">{progressLabel}</span>
  </div>
  <div class="mb-4 h-2 overflow-hidden rounded-full bg-canvas" role="progressbar" aria-label={progressLabel} aria-valuemin="0" aria-valuemax={steps.length} aria-valuenow={doneCount}>
    <div class="h-full rounded-full bg-ok transition-[width]" style="width:{(doneCount / steps.length) * 100}%"></div>
  </div>
  <ol class="space-y-2">
    {#each steps as s, i}
      <li>
        <a href={s.href} class="flex min-h-14 items-center gap-3 rounded-xl border border-line px-3 py-2 hover:bg-sunken {s.done ? 'bg-sunken' : 'bg-surface'}">
          <span class="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold {s.done ? 'bg-ok text-white' : 'border-2 border-line-strong text-ink-muted'}">
            {#if s.done}<IconCheck size={18} strokeWidth={3} />{:else}{i + 1}{/if}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-base font-bold {s.done ? 'text-ink-muted line-through decoration-1' : ''}">{s.label}</span>
            {#if s.hint && !s.done}<span class="block text-sm text-ink-muted">{s.hint}</span>{/if}
          </span>
          {#if !s.done}<IconNext size={20} class="shrink-0 text-ink-muted" />{/if}
        </a>
      </li>
    {/each}
  </ol>
</div>
