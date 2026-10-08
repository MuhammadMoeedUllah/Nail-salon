<script lang="ts">
  import type { Component } from 'svelte';
  // Two to five options as native radios (R20). bind:value; name makes it part of a form.
  type Opt = { value: string; label: string; icon?: Component<any> };
  let { options, value = $bindable(), name, label, showLabel = false, size = 'md', class: cls = '', onchange }: { options: Opt[]; value?: string; name?: string; label: string; showLabel?: boolean; size?: 'md' | 'lg'; class?: string; onchange?: (v: string) => void } = $props();
  const uid = $props.id();
</script>

<fieldset class={cls}>
  <legend class={showLabel ? 'label' : 'sr-only'}>{label}</legend>
  <div class="flex w-full gap-1 rounded-xl border border-line bg-canvas p-1">
    {#each options as o (o.value)}
      <label class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-center font-bold leading-snug transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus {size === 'lg' ? 'min-h-14 text-lg' : 'min-h-11 text-base'} {value === o.value ? 'bg-surface text-ink shadow-raise ring-1 ring-line-strong' : 'text-ink-muted hover:text-ink'}">
        <input type="radio" class="sr-only" name={name ?? uid} value={o.value} bind:group={value} onchange={() => onchange?.(o.value)} />
        {#if o.icon}<o.icon size={18} strokeWidth={2.25} />{/if}
        <span>{o.label}</span>
      </label>
    {/each}
  </div>
</fieldset>
