<script lang="ts">
  import { makeT } from '$lib/i18n';
  import WorkerForm from '$lib/components/WorkerForm.svelte';
  let { data, form } = $props();
  const t = $derived(makeT(data.locale));
</script>
<svelte:head><title>{data.worker.displayName}</title></svelte:head>
<h1 class="mb-4 text-2xl font-bold">{data.worker.displayName}</h1>
<WorkerForm locale={data.locale} worker={data.worker} {form} />
