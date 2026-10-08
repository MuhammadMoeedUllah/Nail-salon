<script lang="ts">
  import { enhance } from '$app/forms';
  import { makeT, type MessageKey } from '$lib/i18n';
  import LangSwitch from '$lib/components/LangSwitch.svelte';
  import PasswordInput from '$lib/ui/PasswordInput.svelte';
  import Banner from '$lib/ui/Banner.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { busy } from '$lib/ui/forms';
  import { IconClockIn } from '$lib/ui/icons';
  let { data, form } = $props();
  const t = $derived(makeT(data.locale));
</script>

<svelte:head><title>{t('sign_in')} · {t('app_name')}</title></svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
  <div class="mb-6 flex items-center justify-between gap-3">
    <span class="flex items-center gap-2 text-lg font-bold text-ink"><img src="/favicon.svg" alt="" class="size-9" />{t('app_name')}</span>
    <LangSwitch locale={data.locale} compact label={t('language')} />
  </div>
  <div class="card p-6">
    <h1 class="text-2xl font-bold">{t('sign_in')}</h1>
    {#if form?.error}<Banner kind="error" class="mt-4">{t(form.error as MessageKey)}</Banner>{/if}
    <form method="post" use:enhance={busy()} class="mt-5 space-y-4">
      <div>
        <label class="label" for="email">{t('email')}</label>
        <input class="input min-h-14 text-lg" id="email" name="email" type="email" autocomplete="email" autocapitalize="off" spellcheck="false" required value={form?.email ?? ''} />
      </div>
      <div>
        <label class="label" for="password">{t('password')}</label>
        <PasswordInput id="password" name="password" autocomplete="current-password" required showLabel={t('pw_show')} hideLabel={t('pw_hide')} inputClass="min-h-14 text-lg" />
      </div>
      <label class="flex min-h-12 cursor-pointer items-start gap-3 py-1">
        <input type="checkbox" name="remember" value="1" checked class="mt-0.5 size-6 shrink-0 accent-brand" />
        <span><span class="block text-base font-bold">{t('lg_keep')}</span><span class="block text-sm text-ink-muted">{t('lg_keep_hint')}</span></span>
      </label>
      <Button type="submit" variant="primary" size="lg" block>{t('sign_in')}</Button>
    </form>
    {#if data.canSignup}
      <p class="mt-5 text-center text-base text-ink-muted">{t('lg_new_salon')} <a class="font-bold text-brand-strong underline decoration-brand-tint decoration-2 underline-offset-4" href="/signup">{t('create_account')}</a></p>
    {/if}
    {#if data.hasDevice}<a href="/kiosk" class="btn-secondary mt-4 w-full"><IconClockIn size={20} />{t('nav_kiosk')}</a>{/if}
  </div>
  <p class="mt-6 text-center text-base text-ink-muted">{t('tagline')}</p>
  <p class="mt-2 text-center text-sm text-ink-muted">{t('not_legal_advice')}</p>
</main>
