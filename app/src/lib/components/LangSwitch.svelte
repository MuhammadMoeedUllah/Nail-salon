<script lang="ts">
  import { page } from '$app/state';
  let { locale, compact = false }: { locale: 'en' | 'vi'; compact?: boolean } = $props();
  const next = $derived(encodeURIComponent(page.url.pathname + page.url.search));
</script>

<div class="inline-flex overflow-hidden rounded-lg ring-1 ring-stone-300 text-sm">
  <a href="/locale?l=en&next={next}" data-sveltekit-reload class="px-3 py-1.5 {locale === 'en' ? 'bg-brand-700 text-white' : 'bg-white text-stone-700'}">{compact ? 'EN' : 'English'}</a>
  <a href="/locale?l=vi&next={next}" data-sveltekit-reload class="px-3 py-1.5 {locale === 'vi' ? 'bg-brand-700 text-white' : 'bg-white text-stone-700'}">{compact ? 'VI' : 'Tiếng Việt'}</a>
</div>
