<script lang="ts">
  import { page } from '$app/state';
  // Two-option switch; full page reload so server-rendered text follows the new language.
  let { locale, compact = false, label = 'Language' }: { locale: 'en' | 'vi'; compact?: boolean; label?: string } = $props();
  const next = $derived(encodeURIComponent(page.url.pathname + page.url.search));
  const opts = [
    { l: 'en', long: 'English', short: 'EN' },
    { l: 'vi', long: 'Tiếng Việt', short: 'VI' }
  ] as const;
</script>

<div class="inline-flex gap-1 rounded-xl border border-line bg-canvas p-1" role="group" aria-label={label}>
  {#each opts as o}
    <a
      href="/locale?l={o.l}&next={next}"
      data-sveltekit-reload
      lang={o.l}
      aria-current={locale === o.l ? 'true' : undefined}
      class="flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-base font-bold {locale === o.l ? 'bg-surface text-ink shadow-raise ring-1 ring-line-strong' : 'text-ink-muted hover:text-ink'}"
    >{compact ? o.short : o.long}</a>
  {/each}
</div>
