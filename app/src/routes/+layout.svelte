<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  let { children } = $props();
</script>

<svelte:head>
  {#if !page.url.pathname.startsWith('/kiosk')}<link rel="manifest" href="/manifest.webmanifest" />{/if}
</svelte:head>

{@render children()}
