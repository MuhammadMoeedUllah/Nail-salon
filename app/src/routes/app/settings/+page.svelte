<script lang="ts">
  import { enhance } from '$app/forms';
  import { makeT, type MessageKey } from '$lib/i18n';
  import { fmtDateYear } from '$lib/time';
  import { regionsFor } from '$lib/rules';
  import PageHeader from '$lib/ui/PageHeader.svelte';
  import Field from '$lib/ui/Field.svelte';
  import SegmentedControl from '$lib/ui/SegmentedControl.svelte';
  import Button from '$lib/ui/Button.svelte';
  import ConfirmButton from '$lib/ui/ConfirmButton.svelte';
  import PasswordInput from '$lib/ui/PasswordInput.svelte';
  import StatusPill from '$lib/ui/StatusPill.svelte';
  import Avatar from '$lib/ui/Avatar.svelte';
  import Banner from '$lib/ui/Banner.svelte';
  import { toast } from '$lib/ui/toast.svelte';
  import { busy } from '$lib/ui/forms';
  import { money } from '$lib/workers/basis';
  import { IconCheck, IconUserPlus, IconExternal, IconLock } from '$lib/ui/icons';

  let { data, form } = $props();
  const t = $derived(makeT(data.locale));
  const L = $derived(data.locale);
  // svelte-ignore state_referenced_locally
  let usState = $state(data.salon.state);
  // svelte-ignore state_referenced_locally
  let lang = $state(data.salon.defaultLocale);
  let role = $state('manager');
  const regions = $derived(regionsFor(usState));
  const where = $derived(`${data.states.find((s) => s.code === data.salon.state)?.name ?? data.salon.state}${data.salon.region ? ` · ${regionsFor(data.salon.state).find((r) => r.code === data.salon.region)?.name ?? data.salon.region}` : ''}`);
  const salonErrors = $derived<Record<string, string>>(form?.form === 'salon' ? (form?.errors ?? {}) : {});

  const ruleText = (r: (typeof data.rules)[number]) => {
    switch (r.key) {
      case 'min_wage': return t('se_rule_min_wage', { amount: money(Number(r.value)) });
      case 'ot_weekly_threshold_hours': return t('se_rule_ot_weekly', { n: String(r.value) });
      case 'ot_daily_threshold_hours': return t('se_rule_ot_daily', { n: String(r.value) });
      case 'dt_daily_threshold_hours': return t('se_rule_dt_daily', { n: String(r.value) });
      case 'spread_of_hours': return t('se_rule_spread');
    }
    return r.key;
  };
  const roles = $derived([
    { value: 'owner', label: t('se_role_owner'), text: t('se_role_owner_x') },
    { value: 'manager', label: t('se_role_manager'), text: t('se_role_manager_x') },
    { value: 'bookkeeper', label: t('se_role_bookkeeper'), text: t('se_role_bookkeeper_x') }
  ]);
  const roleLabel = (r: string) => t(`se_role_${r}` as MessageKey);
</script>

<svelte:head><title>{t('settings_title')}</title></svelte:head>

<PageHeader title={t('settings_title')} />

<nav class="mb-4 flex flex-wrap gap-2" aria-label={t('se_jump')}>
  <a href="#salon" class="btn-secondary min-h-11 px-4 text-base">{t('settings_salon')}</a>
  <a href="#rules" class="btn-secondary min-h-11 px-4 text-base">{t('se_rules_title')}</a>
  <a href="#logins" class="btn-secondary min-h-11 px-4 text-base">{t('se_logins_title')}</a>
</nav>

<div class="max-w-3xl space-y-4">
  {#if !data.isOwner}<Banner kind="info" icon={IconLock}>{t('se_owner_only')}</Banner>{/if}

  <!-- Salon -->
  <section id="salon" class="card scroll-mt-4" aria-labelledby="salon-h">
    <h2 id="salon-h" class="text-xl font-bold">{t('settings_salon')}</h2>
    <p class="mb-4 text-sm text-ink-muted">{t('se_salon_hint')}</p>
    <form
      method="post"
      action="?/salon"
      class="space-y-4"
      use:enhance={busy(() => async ({ result, update }) => {
        if (result.type === 'success') toast(t('se_saved'));
        await update({ reset: false });
      })}
    >
      {#if Object.keys(salonErrors).length}<Banner kind="error">{t('wk_check_form')}</Banner>{/if}
      <fieldset class="space-y-4" disabled={!data.isOwner}>
        <Field id="name" label={t('salon_name')} error={salonErrors.name ? t('wk_required') : null}>
          <input class="input" id="name" name="name" value={data.salon.name} required minlength="2" maxlength="80" aria-invalid={!!salonErrors.name} aria-describedby="name-error" />
        </Field>
        <div class="grid gap-4 sm:grid-cols-2">
          <Field id="licenseNo" label={t('settings_license')}><input class="input" id="licenseNo" name="licenseNo" value={data.salon.licenseNo ?? ''} maxlength="40" /></Field>
          <SegmentedControl label={t('se_default_lang')} showLabel name="defaultLocale" bind:value={lang} options={[{ value: 'en', label: 'English' }, { value: 'vi', label: 'Tiếng Việt' }]} />
        </div>
        <Field id="address" label={t('se_address')}><input class="input" id="address" name="address" value={data.salon.address ?? ''} maxlength="200" /></Field>
        <div class="grid gap-4 sm:grid-cols-2">
          <Field id="state" label={t('state')}>
            <select class="input" id="state" name="state" bind:value={usState}>{#each data.states as s (s.code)}<option value={s.code}>{s.name}</option>{/each}</select>
          </Field>
          {#if regions.length}
            <Field id="region" label={t('settings_region')}>
              <select class="input" id="region" name="region" value={data.salon.region ?? regions[0].code}>{#each regions as r (r.code)}<option value={r.code}>{r.name}</option>{/each}</select>
            </Field>
          {/if}
          <Field id="timezone" label={t('settings_timezone')}>
            <select class="input" id="timezone" name="timezone" value={data.salon.timezone}>{#each data.timezones as z (z)}<option value={z}>{z.replace('America/', '').replace('Pacific/', '').replace('_', ' ')}</option>{/each}</select>
          </Field>
          <Field id="workweekStart" label={t('se_week_starts')}>
            <select class="input" id="workweekStart" name="workweekStart" value={String(data.salon.workweekStart)}>{#each [1, 2, 3, 4, 5, 6, 0] as d (d)}<option value={String(d)}>{t(`weekday_${d}` as MessageKey)}</option>{/each}</select>
          </Field>
          <div>
            <p class="label">{t('pay_period')}</p>
            <p class="flex min-h-12 items-center text-base font-bold">{t('se_pay_weekly')}</p>
            {#if usState === 'NY'}<p class="hint">{t('ny_weekly_note')}</p>{/if}
          </div>
          <Field id="closingTime" label={t('se_closing')} hint={t('se_closing_hint')}>
            <input class="input w-40" id="closingTime" name="closingTime" type="time" step="900" value={data.salon.closingTime} required aria-describedby="closingTime-hint" />
          </Field>
        </div>
      </fieldset>
      {#if data.isOwner}<Button type="submit" variant="primary" size="lg" icon={IconCheck}>{t('save')}</Button>{/if}
    </form>
  </section>

  <!-- Pay rules -->
  <section id="rules" class="card scroll-mt-4" aria-labelledby="rules-h">
    <h2 id="rules-h" class="text-xl font-bold">{t('se_rules_title')}</h2>
    <p class="mb-4 text-sm text-ink-muted">{t('se_rules_hint', { where })}</p>
    <ul class="divide-y divide-line">
      {#each data.rules as r (r.key + r.jurisdiction)}
        <li class="py-3">
          <p class="text-base font-bold">{ruleText(r)}</p>
          <p class="mt-0.5 text-sm text-ink-muted">
            {t('se_rule_since', { date: fmtDateYear(r.from, L) })} · {t('se_rule_checked', { date: fmtDateYear(r.checked, L) })} ·
            <a class="font-bold text-brand-strong underline decoration-brand-tint decoration-2 underline-offset-4" href={r.url} target="_blank" rel="noopener">{r.title}<IconExternal size={14} class="ml-1 inline-block align-[-2px]" /></a>
          </p>
        </li>
      {/each}
      <li class="py-3"><p class="text-base font-bold">{t('se_rule_retention', { n: data.retention })}</p></li>
    </ul>
    <p class="mt-3 text-sm text-ink-muted">{t('not_legal_advice')}</p>
  </section>

  <!-- Logins -->
  <section id="logins" class="card scroll-mt-4" aria-labelledby="logins-h">
    <h2 id="logins-h" class="text-xl font-bold">{t('se_logins_title')}</h2>
    <p class="mb-4 text-sm text-ink-muted">{t('se_logins_hint')}</p>
    {#if form?.form === 'remove' && form?.error}<Banner kind="error" class="mb-3">{t(form.error as MessageKey)}</Banner>{/if}
    <ul class="divide-y divide-line">
      {#each data.users as u (u.id)}
        <li class="flex flex-wrap items-center gap-3 py-3">
          <Avatar name={u.name} id={u.id} size={40} />
          <div class="min-w-0 flex-1">
            <p class="flex flex-wrap items-center gap-2 text-base font-bold">{u.name}{#if u.id === data.me}<StatusPill kind="brand">{t('se_you')}</StatusPill>{/if}</p>
            <p class="truncate text-sm text-ink-muted">{u.email} · {roleLabel(u.role)}</p>
          </div>
          {#if data.isOwner && u.id !== data.me}
            <form
              method="post"
              action="?/removeUser"
              use:enhance={busy(() => async ({ result, update }) => {
                if (result.type === 'success') toast(t('se_removed', { name: u.name }));
                await update();
              })}
            >
              <input type="hidden" name="id" value={u.id} />
              <ConfirmButton variant="secondary" danger label={t('se_remove')} confirmLabel={t('se_remove_confirm', { name: u.name })} cancelLabel={t('cancel')} />
            </form>
          {/if}
        </li>
      {/each}
    </ul>

    {#if data.isOwner}
      <form
        method="post"
        action="?/addUser"
        class="mt-4 space-y-4 rounded-2xl bg-sunken p-4"
        use:enhance={busy(() => async ({ result, update }) => {
          if (result.type === 'success') {
            toast(t('se_login_added', { name: String(result.data?.name ?? '') }));
            role = 'manager';
          }
          await update({ reset: result.type === 'success' });
        })}
      >
        <h3 class="flex items-center gap-2 text-lg font-bold"><IconUserPlus size={20} />{t('se_add_login')}</h3>
        {#if form?.form === 'user' && form?.error}<Banner kind="error">{t(form.error as MessageKey)}</Banner>{/if}
        <div class="grid gap-4 sm:grid-cols-2">
          <Field id="u-name" label={t('se_login_name')}><input class="input" id="u-name" name="name" required maxlength="80" autocomplete="off" value={form?.form === 'user' ? (form?.values?.name ?? '') : ''} /></Field>
          <Field id="u-email" label={t('email')}><input class="input" id="u-email" name="email" type="email" required autocomplete="off" value={form?.form === 'user' ? (form?.values?.email ?? '') : ''} /></Field>
          <Field id="u-password" label={t('password')} hint={t('se_password_hint')} class="sm:col-span-2">
            <PasswordInput id="u-password" name="password" required minlength={8} autocomplete="new-password" showLabel={t('pw_show')} hideLabel={t('pw_hide')} aria-describedby="u-password-hint" class="max-w-sm" />
          </Field>
        </div>
        <fieldset>
          <legend class="label">{t('se_role')}</legend>
          <div class="grid gap-2 sm:grid-cols-3">
            {#each roles as r (r.value)}
              <label class="flex cursor-pointer items-start gap-3 rounded-xl border-2 bg-surface p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus {role === r.value ? 'border-brand' : 'border-line hover:border-line-strong'}">
                <input type="radio" name="role" value={r.value} bind:group={role} class="mt-0.5 size-5 shrink-0 accent-brand" />
                <span class="min-w-0"><span class="block text-base font-bold">{r.label}</span><span class="block text-sm text-ink-muted">{r.text}</span></span>
              </label>
            {/each}
          </div>
        </fieldset>
        <Button type="submit" variant="primary" icon={IconUserPlus}>{t('se_add_login')}</Button>
      </form>
    {/if}
  </section>
</div>
