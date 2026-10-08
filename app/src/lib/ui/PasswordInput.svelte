<script lang="ts">
  import { IconShow, IconHide } from './icons';
  // Password field with a show/hide eye (UX-51). The eye is a 48 px target inside the field.
  let {
    id,
    value = $bindable(''),
    showLabel = 'Show password',
    hideLabel = 'Hide password',
    class: cls = '',
    inputClass = '',
    ...rest
  }: { id: string; value?: string; showLabel?: string; hideLabel?: string; class?: string; inputClass?: string; [key: string]: unknown } = $props();
  let shown = $state(false);
</script>

<div class="relative {cls}">
  <input {id} type={shown ? 'text' : 'password'} class="input pr-14 {inputClass}" bind:value autocapitalize="off" spellcheck="false" {...rest} />
  <button type="button" class="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-ink-muted hover:text-ink" aria-label={shown ? hideLabel : showLabel} aria-pressed={shown} aria-controls={id} onclick={() => (shown = !shown)}>
    {#if shown}<IconHide size={22} />{:else}<IconShow size={22} />{/if}
  </button>
</div>
