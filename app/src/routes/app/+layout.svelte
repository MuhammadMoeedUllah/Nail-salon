<script lang="ts">
  import { page } from '$app/state';
  import { makeT } from '$lib/i18n';
  import LangSwitch from '$lib/components/LangSwitch.svelte';
  let { data, children } = $props();
  const t = $derived(makeT(data.locale));
  const items = $derived([
    { href: '/app/today', label: t('nav_today') },
    { href: '/app/pay', label: t('nav_pay') },
    { href: '/app/workers', label: t('nav_workers') },
    { href: '/app/audit', label: t('nav_audit') },
    { href: '/app/settings', label: t('nav_settings') }
  ]);
  const active = (href: string) => page.url.pathname === href || page.url.pathname.startsWith(href + '/');
</script>

<div class="min-h-screen bg-stone-50">
  <header class="no-print sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
      <a href="/app/today" class="flex items-center gap-2 font-bold text-brand-800"><img src="/favicon.svg" alt="" class="h-7 w-7" /><span class="hidden sm:inline">{data.salon.name}</span></a>
      <nav class="flex gap-1 overflow-x-auto text-sm font-medium">
        {#each items as it}
          <a href={it.href} class="whitespace-nowrap rounded-lg px-3 py-2 {active(it.href) ? 'bg-brand-50 text-brand-800' : 'text-stone-600 hover:bg-stone-100'}">{it.label}</a>
        {/each}
      </nav>
      <div class="flex items-center gap-2">
        <a href="/kiosk" class="hidden rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 md:inline">{t('nav_kiosk')}</a>
        <LangSwitch locale={data.locale} compact />
        <form method="post" action="/logout"><button class="rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100">{t('sign_out')}</button></form>
      </div>
    </div>
  </header>
  <main class="mx-auto max-w-6xl px-4 py-6">
    {@render children()}
  </main>
  <footer class="no-print mx-auto max-w-6xl px-4 pb-8 text-xs text-stone-400">{t('not_legal_advice')}</footer>
</div>
