<script lang="ts">
  import type { Snippet } from 'svelte';
  import { IconOwed } from './icons';
  // Label above, hint and error below, tied to the control by id (R19). The control should set aria-describedby="{id}-hint {id}-error".
  let { id, label, hint, error, class: cls = '', children }: { id: string; label: string; hint?: string; error?: string | null; class?: string; children?: Snippet } = $props();
</script>

<div class={cls}>
  <label class="label" for={id}>{label}</label>
  {@render children?.()}
  {#if hint}<p class="hint" id="{id}-hint">{hint}</p>{/if}
  {#if error}<p class="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-owed" id="{id}-error"><IconOwed size={16} strokeWidth={2.5} />{error}</p>{/if}
</div>
