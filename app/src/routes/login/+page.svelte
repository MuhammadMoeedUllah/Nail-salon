<script lang="ts">
  import { enhance } from '$app/forms';
  import { makeT } from '$lib/i18n';
  import LangSwitch from '$lib/components/LangSwitch.svelte';
  let { data, form } = $props();
  const t = $derived(makeT(data.locale));
</script>

<svelte:head><title>{t('sign_in')} · {t('app_name')}</title></svelte:head>

<main class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
  <div class="mb-6 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2 text-lg font-bold text-brand-800"><img src="/favicon.svg" alt="" class="h-8 w-8" />{t('app_name')}</a>
    <LangSwitch locale={data.locale} compact />
  </div>
  <div class="card">
    <h1 class="mb-1 text-2xl font-bold">{t('sign_in')}</h1>
    <p class="mb-5 text-sm text-stone-600">{t('tagline')}</p>
    {#if form?.error}<p class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error}</p>{/if}
    <form method="post" use:enhance class="space-y-4">
      <div><label class="label" for="email">{t('email')}</label><input class="input" id="email" name="email" type="email" autocomplete="email" required value={form?.email ?? ''} /></div>
      <div><label class="label" for="password">{t('password')}</label><input class="input" id="password" name="password" type="password" autocomplete="current-password" required /></div>
      <button class="btn-primary w-full" type="submit">{t('sign_in')}</button>
    </form>
    {#if data.canSignup}
      <p class="mt-5 text-center text-sm text-stone-600"><a class="font-semibold text-brand-700 underline" href="/signup">{t('create_account')}</a></p>
    {/if}
    {#if data.hasDevice}
      <p class="mt-3 text-center text-sm"><a class="text-stone-600 underline" href="/kiosk">{t('nav_kiosk')}</a></p>
    {/if}
  </div>
  <p class="mt-6 text-center text-xs text-stone-500">{t('not_legal_advice')}</p>
</main>
