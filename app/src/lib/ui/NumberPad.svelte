<script lang="ts">
  import { IconBackspace, IconCheck } from './icons';
  // On-screen money keypad for tablets, so the OS keyboard never covers the register (R21).
  // Whole dollars by default ("4","5" = $45); "." starts cents.
  let { value = $bindable(''), label, doneLabel = 'Done', clearLabel = 'Clear', backLabel = 'Delete', ondone }: { value?: string; label: string; doneLabel?: string; clearLabel?: string; backLabel?: string; ondone?: (v: string) => void } = $props();
  function press(k: string) {
    let v = value;
    if (k === 'back') v = v.slice(0, -1);
    else if (k === 'clear') v = '';
    else if (k === '.') v = v.includes('.') ? v : (v || '0') + '.';
    else {
      const [whole, frac] = v.split('.');
      if (frac !== undefined && frac.length >= 2) return;
      if (frac === undefined && whole.length >= 5) return;
      v = v === '0' ? k : v + k;
    }
    value = v;
  }
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'];
</script>

<div class="rounded-2xl border border-line bg-sunken p-2" role="group" aria-label={label}>
  <div class="mb-2 flex items-center justify-between rounded-xl bg-surface px-4 py-2">
    <span class="text-sm font-bold text-ink-muted">{label}</span>
    <span class="text-2xl font-bold tabular-nums" aria-live="polite">${value || '0'}</span>
  </div>
  <div class="grid grid-cols-3 gap-2">
    {#each keys as k}
      <button type="button" class="btn btn-secondary min-h-14 text-2xl" aria-label={k === 'back' ? backLabel : k} onclick={() => press(k)}>
        {#if k === 'back'}<IconBackspace size={26} />{:else}{k}{/if}
      </button>
    {/each}
    <button type="button" class="btn btn-secondary min-h-12 text-base" onclick={() => press('clear')}>{clearLabel}</button>
    <button type="button" class="btn btn-primary col-span-2 min-h-12 text-base" onclick={() => ondone?.(value)}><IconCheck size={20} strokeWidth={2.5} />{doneLabel}</button>
  </div>
</div>
