<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  // A labelled on/off switch. The whole row is the target (48 px); the label and hint sit on the left.
  let {
    checked = $bindable(false),
    label,
    hint,
    id,
    showLabel = true,
    class: cls = '',
    ...rest
  }: { checked?: boolean; label: string; hint?: string; id?: string; showLabel?: boolean; class?: string } & Omit<HTMLInputAttributes, 'type' | 'checked' | 'class'> = $props();
  const uid = $props.id();
  const inputId = $derived(id ?? `sw-${uid}`);
</script>

<label for={inputId} class="flex min-h-12 cursor-pointer items-center gap-3 {cls}">
  {#if showLabel}
    <span class="min-w-0 flex-1">
      <span class="block text-base font-bold text-ink">{label}</span>
      {#if hint}<span class="mt-0.5 block text-sm text-ink-muted">{hint}</span>{/if}
    </span>
  {/if}
  <input type="checkbox" role="switch" id={inputId} bind:checked aria-label={showLabel ? undefined : label} class="switch" {...rest} />
</label>
