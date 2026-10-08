<script lang="ts">
  import { makeT } from '$lib/i18n';
  import PageHeader from '$lib/ui/PageHeader.svelte';
  import Avatar from '$lib/ui/Avatar.svelte';
  import WorkerForm from '$lib/components/WorkerForm.svelte';
  let { data, form } = $props();
  const t = $derived(makeT(data.locale));
</script>

<svelte:head><title>{t('wk_edit_title', { name: data.worker.displayName })}</title></svelte:head>
<PageHeader back={{ href: '/app/workers', label: t('workers_title') }} title={data.worker.displayName} subtitle={data.worker.legalName}>
  {#snippet titleExtra()}<Avatar name={data.worker.displayName} id={data.worker.id} size={40} />{/snippet}
</PageHeader>
{#key data.worker.id}
  <WorkerForm locale={data.locale} worker={data.worker} {form} salonName={data.salonName} />
{/key}
