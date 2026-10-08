<script lang="ts">
  import { enhance } from '$app/forms';
  import { makeT, type MessageKey } from '$lib/i18n';
  import LangSwitch from '$lib/components/LangSwitch.svelte';
  import PasswordInput from '$lib/ui/PasswordInput.svelte';
  import Field from '$lib/ui/Field.svelte';
  import Banner from '$lib/ui/Banner.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { busy } from '$lib/ui/forms';
  import { regionsFor } from '$lib/rules';
  let { data, form } = $props();
  const t = $derived(makeT(data.locale));
  // svelte-ignore state_referenced_locally
  let usState = $state(form?.values?.state ?? 'NY');
  const regions = $derived(regionsFor(usState));
</script>

<svelte:head><title>{t('create_account')} · {t('app_name')}</title></svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
  <div class="mb-6 flex items-center justify-between gap-3">
    <span class="flex items-center gap-2 text-lg font-bold text-ink"><img src="/favicon.svg" alt="" class="size-9" />{t('app_name')}</span>
    <LangSwitch locale={data.locale} compact label={t('language')} />
  </div>
  <div class="card p-6">
    <h1 class="text-2xl font-bold">{t('create_account')}</h1>
    <p class="mt-1 text-base text-ink-muted">{t('su_hint')}</p>
    {#if form?.error}<Banner kind="error" class="mt-4">{t(form.error as MessageKey)}</Banner>{/if}
    <form method="post" use:enhance={busy()} class="mt-5 space-y-4">
      <input type="hidden" name="locale" value={data.locale} />
      <Field id="salonName" label={t('salon_name')}><input class="input min-h-14 text-lg" id="salonName" name="salonName" required autocomplete="organization" value={form?.values?.salonName ?? ''} /></Field>
      <div class="grid gap-4 {regions.length ? 'sm:grid-cols-2' : ''}">
        <Field id="state" label={t('state')}>
          <select class="input min-h-14 text-lg" id="state" name="state" bind:value={usState}>{#each data.states as s (s.code)}<option value={s.code}>{s.name}</option>{/each}</select>
        </Field>
        {#if regions.length}
          <Field id="region" label={t('settings_region')}>
            <select class="input min-h-14 text-lg" id="region" name="region">{#each regions as r (r.code)}<option value={r.code}>{r.name}</option>{/each}</select>
          </Field>
        {/if}
      </div>
      <Field id="name" label={t('your_name')}><input class="input min-h-14 text-lg" id="name" name="name" required autocomplete="name" value={form?.values?.name ?? ''} /></Field>
      <Field id="email" label={t('email')}><input class="input min-h-14 text-lg" id="email" name="email" type="email" required autocomplete="email" autocapitalize="off" spellcheck="false" value={form?.values?.email ?? ''} /></Field>
      <Field id="password" label={t('password')} hint={t('su_password_hint')}>
        <PasswordInput id="password" name="password" minlength={8} autocomplete="new-password" required showLabel={t('pw_show')} hideLabel={t('pw_hide')} inputClass="min-h-14 text-lg" aria-describedby="password-hint" />
      </Field>
      <Button type="submit" variant="primary" size="lg" block>{t('create_account')}</Button>
    </form>
    <p class="mt-5 text-center text-base text-ink-muted">{t('su_have_account')} <a class="font-bold text-brand-strong underline decoration-brand-tint decoration-2 underline-offset-4" href="/login">{t('sign_in')}</a></p>
  </div>
</main>
