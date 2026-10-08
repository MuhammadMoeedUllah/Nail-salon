<script lang="ts">
  import { makeT } from '$lib/i18n';
  import PageHeader from '$lib/ui/PageHeader.svelte';
  import LangSwitch from '$lib/components/LangSwitch.svelte';
  import Avatar from '$lib/ui/Avatar.svelte';
  import { IconUsers, IconServices, IconImport, IconAudit, IconSettings, IconTablet, IconClock, IconNext, IconSignOut, IconInfo, IconSteps } from '$lib/ui/icons';
  let { data } = $props();
  const t = $derived(makeT(data.locale));
  const groups = $derived([
    { title: t('more_people'), items: [
      { href: '/app/workers', label: t('nav_workers'), icon: IconUsers },
      { href: '/app/services', label: t('nav_services'), icon: IconServices }
    ] },
    { title: t('more_records'), items: [
      { href: '/app/tickets/import', label: t('nav_import'), icon: IconImport },
      { href: '/app/audit', label: t('nav_audit'), icon: IconAudit }
    ] },
    { title: t('more_salon'), items: [
      { href: '/app/settings', label: t('nav_settings'), icon: IconSettings },
      { href: '/app/tablets', label: t('nav_tablets'), icon: IconTablet },
      { href: '/kiosk', label: t('open_tablet_clock'), icon: IconClock },
      { href: '/kiosk/setup', label: t('nav_help'), icon: IconSteps }
    ] }
  ]);
</script>

<svelte:head><title>{t('nav_more')} · {data.salon.name}</title></svelte:head>

<PageHeader title={t('nav_more')} />

<div class="mx-auto max-w-2xl space-y-6">
  {#each groups as g}
    <section>
      <h2 class="mb-2 px-1 eyebrow">{g.title}</h2>
      <ul class="card divide-y divide-line overflow-hidden p-0">
        {#each g.items as it}
          <li>
            <a href={it.href} class="flex min-h-14 items-center gap-3 px-4 py-2 text-base font-bold hover:bg-sunken">
              <span class="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><it.icon size={22} strokeWidth={2.25} /></span>
              <span class="flex-1">{it.label}</span>
              <IconNext size={20} class="text-ink-muted" />
            </a>
          </li>
        {/each}
      </ul>
    </section>
  {/each}

  <section>
    <h2 class="mb-2 px-1 eyebrow">{t('language')}</h2>
    <div class="card p-4"><LangSwitch locale={data.locale} label={t('language')} /></div>
  </section>

  <section>
    <h2 class="mb-2 px-1 eyebrow">{t('more_account')}</h2>
    <div class="card flex flex-wrap items-center gap-3 p-4">
      <Avatar name={data.user.name} id={data.user.id} size={44} />
      <p class="min-w-0 flex-1 text-base"><span class="font-bold">{data.user.name}</span><br /><span class="text-ink-muted">{data.salon.name}</span></p>
      <form method="post" action="/logout"><button class="btn btn-secondary"><IconSignOut size={20} />{t('sign_out')}</button></form>
    </div>
  </section>

  <section>
    <h2 class="mb-2 px-1 eyebrow">{t('nav_about')}</h2>
    <div class="card flex gap-3 p-4 text-base text-ink-muted">
      <IconInfo size={22} class="mt-0.5 shrink-0" />
      <p>{t('app_name')} · {t('about_version', { v: '1.1' })}<br />{t('not_legal_advice')}</p>
    </div>
  </section>
</div>
