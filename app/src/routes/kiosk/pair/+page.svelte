<script lang="ts">
  import { enhance } from '$app/forms';
  import { makeT } from '$lib/i18n';
  import LangSwitch from '$lib/components/LangSwitch.svelte';
  let { data, form } = $props();
  const t = $derived(makeT(data.locale));
</script>

<svelte:head><title>{t('kiosk_pair')} · {t('app_name')}</title></svelte:head>

<main class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
  <div class="mb-6 flex items-center justify-between">
    <span class="flex items-center gap-2 text-lg font-bold text-brand-800"><img src="/favicon.svg" alt="" class="h-8 w-8" />{t('app_name')}</span>
    <LangSwitch locale={data.locale} compact />
  </div>
  <div class="card">
    <h1 class="mb-1 text-2xl font-bold">{t('kiosk_pair')}</h1>
    <p class="mb-5 text-sm text-stone-600">{t('kiosk_pair_hint')}</p>
    {#if data.alreadyPaired}
      <p class="mb-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">✓ {data.salonName}</p>
      <a class="btn-primary w-full" href="/kiosk">{t('nav_kiosk')}</a>
    {:else}
      {#if form?.error}<p class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error}</p>{/if}
      <form method="post" use:enhance class="space-y-4">
        {#if !data.signedIn}
          <div><label class="label" for="email">{t('email')}</label><input class="input" id="email" name="email" type="email" required /></div>
          <div><label class="label" for="password">{t('password')}</label><input class="input" id="password" name="password" type="password" required /></div>
        {:else}
          <p class="text-sm text-stone-700">{data.salonName}</p>
        {/if}
        <div><label class="label" for="deviceName">{t('kiosk_device_name')}</label><input class="input" id="deviceName" name="deviceName" placeholder="Front desk" /></div>
        <button class="btn-primary w-full" type="submit">{t('kiosk_pair')}</button>
      </form>
    {/if}
  </div>
</main>
