<script lang="ts">
  import { enhance } from '$app/forms';
  import { makeT } from '$lib/i18n';
  import LangSwitch from '$lib/components/LangSwitch.svelte';
  import { regionsFor } from '$lib/rules';
  let { data, form } = $props();
  const t = $derived(makeT(data.locale));
  // svelte-ignore state_referenced_locally
  let state = $state(form?.values?.state ?? 'NY');
  const regions = $derived(regionsFor(state));
</script>

<svelte:head><title>{t('create_account')} · {t('app_name')}</title></svelte:head>

<main class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
  <div class="mb-6 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2 text-lg font-bold text-brand-800"><img src="/favicon.svg" alt="" class="h-8 w-8" />{t('app_name')}</a>
    <LangSwitch locale={data.locale} compact />
  </div>
  <div class="card">
    <h1 class="mb-4 text-2xl font-bold">{t('create_account')}</h1>
    {#if form?.error}<p class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error}</p>{/if}
    <form method="post" use:enhance class="space-y-4">
      <input type="hidden" name="locale" value={data.locale} />
      <div><label class="label" for="salonName">{t('salon_name')}</label><input class="input" id="salonName" name="salonName" required value={form?.values?.salonName ?? ''} /></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="label" for="state">{t('state')}</label>
          <select class="input" id="state" name="state" bind:value={state}>
            {#each data.states as s}<option value={s.code}>{s.code} · {s.name}</option>{/each}
          </select></div>
        {#if regions.length}
          <div><label class="label" for="region">{t('settings_region')}</label>
            <select class="input" id="region" name="region">
              {#each regions as r}<option value={r.code}>{r.name}</option>{/each}
            </select></div>
        {/if}
      </div>
      <div><label class="label" for="name">{t('your_name')}</label><input class="input" id="name" name="name" required value={form?.values?.name ?? ''} /></div>
      <div><label class="label" for="email">{t('email')}</label><input class="input" id="email" name="email" type="email" required value={form?.values?.email ?? ''} /></div>
      <div><label class="label" for="password">{t('password')}</label><input class="input" id="password" name="password" type="password" minlength="8" autocomplete="new-password" required /></div>
      <button class="btn-primary w-full" type="submit">{t('create_account')}</button>
    </form>
  </div>
</main>
