<script lang="ts">
  import { IconBack, IconNext } from './icons';
  // HH:MM with -15 / +15 minute buttons around a native time input: tap, don't type (R20).
  let { value = $bindable(''), name, id, required = false, step = 15, minusLabel = '-15 min', plusLabel = '+15 min', allowEmpty = false }: { value?: string; name?: string; id?: string; required?: boolean; step?: number; minusLabel?: string; plusLabel?: string; allowEmpty?: boolean } = $props();
  function shift(delta: number) {
    const [h, m] = (value || '12:00').split(':').map(Number);
    const cur = h * 60 + m;
    // snap to the step grid, then move one step
    let mins = delta > 0 ? Math.floor(cur / step) * step + step : Math.ceil(cur / step) * step - step;
    mins = ((mins % 1440) + 1440) % 1440;
    value = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  }
</script>

<div class="flex items-stretch gap-2">
  <button type="button" class="btn btn-secondary size-12 shrink-0 !p-0" aria-label={minusLabel} title={minusLabel} onclick={() => shift(-step)}><IconBack size={22} /></button>
  <input {id} {name} type="time" class="input min-w-0 flex-1 text-center text-lg font-bold" bind:value required={required && !allowEmpty} />
  <button type="button" class="btn btn-secondary size-12 shrink-0 !p-0" aria-label={plusLabel} title={plusLabel} onclick={() => shift(step)}><IconNext size={22} /></button>
</div>
