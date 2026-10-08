<script lang="ts">
  import { makeT } from '$lib/i18n';
  import PageHeader from '$lib/ui/PageHeader.svelte';
  import WorkerForm from '$lib/components/WorkerForm.svelte';
  let { data, form } = $props();
  const t = $derived(makeT(data.locale));
</script>

<svelte:head><title>{t('worker_new')}</title></svelte:head>
<PageHeader back={{ href: '/app/workers', label: t('workers_title') }} title={t('worker_new')} />
<WorkerForm locale={data.locale} worker={null} {form} salonName={data.salonName} />
