<script lang="ts">
  // Pick a reason with one tap; "Other" opens a text field (R20). Writes the final text to `reason`.
  let { options, reason = $bindable(''), otherLabel, writeLabel, id, legend, initial = '' }: { options: string[]; reason?: string; otherLabel: string; writeLabel: string; id: string; legend: string; initial?: string } = $props();
  // svelte-ignore state_referenced_locally
  let pick = $state(initial);
  let text = $state('');
  $effect(() => {
    reason = pick === '__other' ? text.trim() : pick;
  });
</script>

<fieldset>
  <legend class="label">{legend}</legend>
  <div class="flex flex-wrap gap-2">
    {#each options as o}
      <button type="button" aria-pressed={pick === o} onclick={() => (pick = o)} class="min-h-12 rounded-full border px-4 text-base font-bold {pick === o ? 'border-brand bg-brand-soft text-brand-strong ring-1 ring-brand' : 'border-line-strong bg-surface'}">{o}</button>
    {/each}
    <button type="button" aria-pressed={pick === '__other'} onclick={() => (pick = '__other')} class="min-h-12 rounded-full border px-4 text-base font-bold {pick === '__other' ? 'border-brand bg-brand-soft text-brand-strong ring-1 ring-brand' : 'border-line-strong bg-surface'}">{otherLabel}</button>
  </div>
  {#if pick === '__other'}
    <label class="sr-only" for={id}>{writeLabel}</label>
    <input {id} class="input mt-2" bind:value={text} placeholder={writeLabel} autocomplete="off" />
  {/if}
</fieldset>
