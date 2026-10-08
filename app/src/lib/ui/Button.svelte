<script lang="ts">
  import type { Component, Snippet } from 'svelte';

  type Props = {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'night';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    href?: string;
    pending?: boolean;
    block?: boolean;
    icon?: Component<any>;
    iconRight?: Component<any>;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  };
  let { variant = 'secondary', size = 'md', href, pending = false, block = false, icon: Icon, iconRight: IconRight, class: cls = '', children, ...rest }: Props = $props();

  const SIZE = { sm: 'min-h-11 px-3 text-sm rounded-lg', md: '', lg: 'min-h-14 px-5 text-lg', xl: 'min-h-[4.5rem] px-6 text-xl rounded-2xl' };
  const ICON = { sm: 18, md: 20, lg: 22, xl: 28 };
  // show the spinner only when the wait is long enough to notice (R11)
  let slow = $state(false);
  $effect(() => {
    if (!pending) return;
    const t = setTimeout(() => (slow = true), 300);
    return () => { clearTimeout(t); slow = false; };
  });
  const classes = $derived(`btn btn-${variant} ${SIZE[size]} ${block ? 'w-full' : ''} ${cls}`);
</script>

{#snippet inner()}
  {#if Icon}<Icon size={ICON[size]} strokeWidth={2.25} />{/if}
  {@render children?.()}
  {#if IconRight}<IconRight size={ICON[size]} strokeWidth={2.25} />{/if}
{/snippet}

{#if href}
  <a {href} class={classes} data-pending={slow || undefined} {...rest}>{@render inner()}</a>
{:else}
  <button type="button" class={classes} data-pending={slow || undefined} aria-busy={pending || undefined} {...rest} disabled={(rest.disabled as boolean) || pending}>{@render inner()}</button>
{/if}
