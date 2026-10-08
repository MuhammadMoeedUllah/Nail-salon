<script lang="ts">
  import { enhance } from '$app/forms';
  import { makeT } from '$lib/i18n';
  import LangSwitch from '$lib/components/LangSwitch.svelte';
  import { busy } from '$lib/ui/forms';
  import { IconTablet, IconSteps, IconClockIn } from '$lib/ui/icons';
  let { data, form } = $props();
  const t = $derived(makeT(data.locale));
</script>

<svelte:head><title>{t('kiosk_pair')} · {t('app_name')}</title></svelte:head>

<main class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
  <div class="mb-6 flex items-center justify-between">
    <span class="flex items-center gap-2 text-lg font-bold text-brand-800"><img src="/favicon.svg" alt="" class="h-8 w-8" />{t('app_name')}</span>
    <LangSwitch locale={data.locale} compact label={t('language')} />
  </div>
  <div class="card">
    <div class="mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand"><IconTablet size={26} /></div>
    <h1 class="mb-1 text-2xl font-bold">{t('kiosk_pair')}</h1>
    <p class="mb-5 text-base text-ink-muted">{t('kiosk_pair_hint')}</p>
    {#if data.alreadyPaired}
      <p class="mb-4 rounded-xl bg-ok-soft p-3 text-base font-bold text-ok-ink">✓ {data.salonName}</p>
      <a class="btn-primary min-h-14 w-full text-lg" href="/kiosk"><IconClockIn size={22} />{t('nav_kiosk')}</a>
    {:else}
      {#if form?.error}<p class="mb-4 rounded-xl bg-owed-soft p-3 text-base font-bold text-owed-ink" role="alert">{form.error}</p>{/if}
      <form method="post" use:enhance={busy()} class="space-y-4">
        {#if !data.signedIn}
          <div><label class="label" for="email">{t('email')}</label><input class="input" id="email" name="email" type="email" required /></div>
          <div><label class="label" for="password">{t('password')}</label><input class="input" id="password" name="password" type="password" required /></div>
        {:else}
          <p class="text-base font-bold">{data.salonName}</p>
        {/if}
        <div><label class="label" for="deviceName">{t('kiosk_device_name')}</label><input class="input" id="deviceName" name="deviceName" placeholder="Front desk" /></div>
        <button class="btn-primary min-h-14 w-full text-lg" type="submit">{t('kiosk_pair')}</button>
      </form>
    {/if}
  </div>
  <a href="/kiosk/setup" class="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-base font-bold text-brand-strong hover:bg-brand-soft"><IconSteps size={20} />{t('nav_help')}</a>
</main>
