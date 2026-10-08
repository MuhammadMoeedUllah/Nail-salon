<script lang="ts">
  import { page } from '$app/state';
  import { makeT } from '$lib/i18n';
  import LangSwitch from '$lib/components/LangSwitch.svelte';
  import Toaster from '$lib/ui/Toaster.svelte';
  import Avatar from '$lib/ui/Avatar.svelte';
  import { IconHome, IconToday, IconPay, IconMore, IconUsers, IconImport, IconAudit, IconSettings, IconClock, IconSignOut, IconServices, IconTablet } from '$lib/ui/icons';
  let { data, children } = $props();
  const t = $derived(makeT(data.locale));
  const path = $derived(page.url.pathname);
  const under = (href: string) => path === href || path.startsWith(href + '/');
  // Four tabs on phones, a labelled sidebar from 1024 px (R14); rare destinations live under More (R15).
  const primary = $derived([
    { href: '/app/home', label: t('nav_home'), icon: IconHome },
    { href: '/app/today', label: t('nav_today'), icon: IconToday },
    { href: '/app/pay', label: t('nav_pay'), icon: IconPay }
  ]);
  const secondary = $derived([
    { href: '/app/workers', label: t('nav_workers'), icon: IconUsers },
    { href: '/app/services', label: t('nav_services'), icon: IconServices },
    { href: '/app/tickets/import', label: t('nav_import'), icon: IconImport },
    { href: '/app/audit', label: t('nav_audit'), icon: IconAudit },
    { href: '/app/tablets', label: t('nav_tablets'), icon: IconTablet },
    { href: '/app/settings', label: t('nav_settings'), icon: IconSettings }
  ]);
  const moreActive = $derived(under('/app/more') || secondary.some((s) => under(s.href)));
  const tabs = $derived([...primary.map((p) => ({ ...p, active: under(p.href) })), { href: '/app/more', label: t('nav_more'), icon: IconMore, active: moreActive }]);
</script>

<a href="#main" class="sr-only z-[70] rounded-lg bg-surface font-bold focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:px-4 focus:py-3">{t('skip_to_content')}</a>

<div class="min-h-dvh lg:flex">
  <!-- 1024-1279 px: a narrow rail so the register has room; 1280 px and up: the full sidebar -->
  <aside class="no-print sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface lg:flex lg:w-28 xl:w-60">
    <a href="/app/home" class="flex flex-col items-center gap-2 px-2 pt-5 pb-4 xl:flex-row xl:gap-3 xl:px-5">
      <img src="/favicon.svg" alt="" class="size-9 rounded-xl" />
      <span class="sr-only min-w-0 text-lg leading-tight font-bold break-words xl:not-sr-only">{data.salon.name}</span>
    </a>
    <nav aria-label={t('nav_main')} class="flex-1 overflow-y-auto px-2 pb-3 xl:px-3">
      <ul class="space-y-1">
        {#each primary as it (it.href)}
          <li>
            <a href={it.href} aria-current={under(it.href) ? 'page' : undefined} class="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-xs leading-tight font-bold xl:min-h-12 xl:flex-row xl:justify-start xl:gap-3 xl:px-3 xl:text-left xl:text-base {under(it.href) ? 'bg-brand-soft text-brand-strong' : 'text-ink-muted hover:bg-sunken hover:text-ink'}">
              <it.icon size={22} strokeWidth={2.25} />{it.label}
            </a>
          </li>
        {/each}
        <li class="xl:hidden">
          <a href="/app/more" aria-current={moreActive ? 'page' : undefined} class="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-xs leading-tight font-bold {moreActive ? 'bg-brand-soft text-brand-strong' : 'text-ink-muted hover:bg-sunken hover:text-ink'}"><IconMore size={22} strokeWidth={2.25} />{t('nav_more')}</a>
        </li>
      </ul>
      <div class="hidden xl:block">
        <p class="mt-6 mb-1.5 px-3 eyebrow">{t('nav_more')}</p>
        <ul class="space-y-0.5">
          {#each secondary as it (it.href)}
            <li>
              <a href={it.href} aria-current={under(it.href) ? 'page' : undefined} class="flex min-h-11 items-center gap-3 rounded-xl px-3 text-base font-bold {under(it.href) ? 'bg-brand-soft text-brand-strong' : 'text-ink-muted hover:bg-sunken hover:text-ink'}">
                <it.icon size={20} strokeWidth={2.25} />{it.label}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    </nav>
    <div class="space-y-3 border-t border-line p-2 xl:p-3">
      <a href="/kiosk" class="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-xs leading-tight font-bold text-ink-muted hover:bg-sunken hover:text-ink xl:min-h-11 xl:flex-row xl:justify-start xl:gap-3 xl:px-3 xl:text-base"><IconClock size={20} strokeWidth={2.25} />{t('nav_kiosk')}</a>
      <div class="flex justify-center xl:hidden"><LangSwitch locale={data.locale} compact label={t('language')} /></div>
      <div class="hidden xl:block"><LangSwitch locale={data.locale} label={t('language')} /></div>
      <div class="flex flex-col items-center gap-1 xl:flex-row xl:gap-2 xl:px-1">
        <Avatar name={data.user.name} id={data.user.id} size={32} />
        <span class="hidden min-w-0 flex-1 truncate text-sm font-bold xl:block">{data.user.name}</span>
        <form method="post" action="/logout">
          <button class="btn-ghost size-11 !p-0" aria-label={t('sign_out')} title={t('sign_out')}><IconSignOut size={20} /></button>
        </form>
      </div>
    </div>
  </aside>

  <div class="min-w-0 flex-1">
    <main id="main" class="mx-auto w-full max-w-6xl px-4 pt-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">
      {@render children()}
    </main>
  </div>
</div>

<nav aria-label={t('nav_main')} class="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-safe backdrop-blur lg:hidden">
  <ul class="mx-auto grid max-w-xl grid-cols-4">
    {#each tabs as it (it.href)}
      <li>
        <a href={it.href} aria-current={it.active ? 'page' : undefined} class="flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 text-xs leading-tight font-bold {it.active ? 'text-brand-strong' : 'text-ink-muted'}">
          <span class="flex h-8 w-14 items-center justify-center rounded-full transition-colors {it.active ? 'bg-brand-tint' : ''}"><it.icon size={24} strokeWidth={it.active ? 2.5 : 2} /></span>
          <span class="text-center">{it.label}</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

<Toaster undoLabel={t('undo')} closeLabel={t('close')} />
