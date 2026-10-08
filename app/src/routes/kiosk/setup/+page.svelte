<script lang="ts">
  import { makeT } from '$lib/i18n';
  import LangSwitch from '$lib/components/LangSwitch.svelte';
  import { IconTablet, IconBack, IconClockIn } from '$lib/ui/icons';
  let { data } = $props();
  const t = $derived(makeT(data.locale));
  const ios = ['kiosk_setup_ios_1', 'kiosk_setup_ios_2', 'kiosk_setup_ios_3', 'kiosk_setup_ios_4', 'kiosk_setup_ios_5', 'kiosk_setup_ios_6'] as const;
  const android = ['kiosk_setup_and_1', 'kiosk_setup_and_2', 'kiosk_setup_and_3', 'kiosk_setup_and_4', 'kiosk_setup_and_5', 'kiosk_setup_and_6'] as const;
</script>

<svelte:head><title>{t('kiosk_setup_title')} · {t('app_name')}</title></svelte:head>

<main class="mx-auto max-w-4xl px-4 py-6 sm:py-10">
  <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
    <a href="/app/more" class="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-lg pr-3 pl-1 text-base font-bold text-brand-strong hover:bg-brand-soft"><IconBack size={22} strokeWidth={2.5} />{t('nav_more')}</a>
    <LangSwitch locale={data.locale} compact label={t('language')} />
  </div>
  <h1 class="text-3xl leading-tight font-bold">{t('kiosk_setup_title')}</h1>
  <p class="mt-2 max-w-2xl text-lg text-ink-muted">{t('kiosk_setup_intro')}</p>

  <div class="mt-6 grid gap-4 md:grid-cols-2">
    {#each [{ title: t('kiosk_setup_ipad'), steps: ios }, { title: t('kiosk_setup_android'), steps: android }] as g}
      <section class="card p-5">
        <h2 class="mb-4 flex items-center gap-2 text-xl font-bold"><IconTablet size={24} />{g.title}</h2>
        <ol class="space-y-3">
          {#each g.steps as k, i}
            <li class="flex gap-3">
              <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-base font-bold text-brand-strong">{i + 1}</span>
              <span class="pt-0.5 text-base leading-snug">{t(k)}</span>
            </li>
          {/each}
        </ol>
      </section>
    {/each}
  </div>

  <div class="mt-6 flex flex-wrap gap-3">
    <a href="/kiosk/pair" class="btn-primary min-h-14 px-6 text-lg"><IconClockIn size={22} />{t('kiosk_setup_pair')}</a>
  </div>
</main>
