<script lang="ts">
  import { enhance } from '$app/forms';
  import { makeT } from '$lib/i18n';
  import { fmtCents, fmtDateTime } from '$lib/time';
  import { regionsFor } from '$lib/rules';
  let { data, form } = $props();
  const t = $derived(makeT(data.locale));
  // svelte-ignore state_referenced_locally
  let state = $state(data.salon.state);
  const regions = $derived(regionsFor(state));
</script>

<svelte:head><title>{t('settings_title')}</title></svelte:head>
<h1 class="mb-4 text-2xl font-bold">{t('settings_title')}</h1>

<div class="grid gap-6 lg:grid-cols-2">
  <form method="post" action="?/salon" use:enhance class="card space-y-4">
    <h2 class="font-bold">{t('settings_salon')}</h2>
    {#if form?.form === 'salon' && form?.ok}<p class="rounded bg-emerald-50 p-2 text-sm text-emerald-800">✓</p>{/if}
    {#if form?.form === 'salon' && form?.error}<p class="rounded bg-red-50 p-2 text-sm text-red-700">{t('invalid')}</p>{/if}
    <div><label class="label" for="name">{t('salon_name')}</label><input class="input" id="name" name="name" value={data.salon.name} required disabled={!data.isOwner} /></div>
    <div class="grid grid-cols-2 gap-3">
      <div><label class="label" for="licenseNo">{t('settings_license')}</label><input class="input" id="licenseNo" name="licenseNo" value={data.salon.licenseNo ?? ''} disabled={!data.isOwner} /></div>
      <div><label class="label" for="defaultLocale">{t('language')}</label><select class="input" id="defaultLocale" name="defaultLocale" value={data.salon.defaultLocale} disabled={!data.isOwner}><option value="en">English</option><option value="vi">Tiếng Việt</option></select></div>
    </div>
    <div><label class="label" for="address">{t('address')}</label><input class="input" id="address" name="address" value={data.salon.address ?? ''} disabled={!data.isOwner} /></div>
    <div class="grid grid-cols-2 gap-3">
      <div><label class="label" for="state">{t('state')}</label><select class="input" id="state" name="state" bind:value={state} disabled={!data.isOwner}>{#each data.states as s}<option value={s.code}>{s.code} · {s.name}</option>{/each}</select></div>
      {#if regions.length}
        <div><label class="label" for="region">{t('settings_region')}</label><select class="input" id="region" name="region" value={data.salon.region ?? regions[0].code} disabled={!data.isOwner}>{#each regions as r}<option value={r.code}>{r.name}</option>{/each}</select></div>
      {/if}
      <div><label class="label" for="timezone">{t('settings_timezone')}</label><select class="input" id="timezone" name="timezone" value={data.salon.timezone} disabled={!data.isOwner}>{#each data.timezones as z}<option value={z}>{z}</option>{/each}</select></div>
      <div><label class="label" for="workweekStart">{t('settings_workweek')}</label><select class="input" id="workweekStart" name="workweekStart" value={String(data.salon.workweekStart)} disabled={!data.isOwner}>{#each [0, 1, 2, 3, 4, 5, 6] as d}<option value={String(d)}>{t(`weekday_${d}` as any)}</option>{/each}</select></div>
      <div><label class="label" for="payFrequency">{t('pay_period')}</label><select class="input" id="payFrequency" name="payFrequency" value={data.salon.payFrequency} disabled={!data.isOwner}><option value="weekly">{t('per_week').replace('/', '')}</option><option value="biweekly">2 × {t('per_week').replace('/', '')}</option></select></div>
    </div>
    <label class="flex items-center gap-2"><input type="checkbox" name="photoOnPunch" checked={data.salon.photoOnPunch} disabled={!data.isOwner} /> {t('settings_photo')}</label>
    <label class="flex items-center gap-2"><input type="checkbox" name="kioskAutoClockIn" checked={data.salon.kioskAutoClockIn} disabled={!data.isOwner} /> {t('settings_auto_in')} <span class="text-xs text-stone-500">· {t('kiosk_auto_in_hint')}</span></label>
    {#if data.isOwner}<button class="btn-primary">{t('save')}</button>{/if}
  </form>

  <div class="space-y-6">
    <div class="card">
      <h2 class="mb-2 font-bold">{t('settings_rules')} · {data.salon.state}{data.salon.region ? ' · ' + data.salon.region : ''}</h2>
      <table class="table text-sm">
        <tbody>
          {#each data.rules as e}
            <tr><td>{e.key === 'min_wage' ? t('min_wage') : e.key === 'ot_weekly_threshold_hours' ? t('ot_after') : e.key}</td><td class="tabular-nums">{e.key === 'min_wage' ? fmtCents(Number(e.value)) + t('per_hour') : e.value + (e.unit === 'hours' ? ' ' + t('hours_unit') : '')}</td><td class="text-xs"><a class="underline" href={e.source_url} target="_blank" rel="noopener">{e.source_title}</a><br />{t('effective')} {e.effective_from} · {t('checked')} {e.checked_on}</td></tr>
          {/each}
          <tr><td>{t('audit_retention')}</td><td>{data.retention} y</td><td></td></tr>
        </tbody>
      </table>
      <p class="mt-2 text-xs text-stone-500">{t('not_legal_advice')}</p>
    </div>

    <div class="card">
      <h2 class="mb-2 font-bold">{t('settings_devices')}</h2>
      {#if data.devices.length === 0}<p class="text-sm text-stone-500">{t('kiosk_not_paired')} <a class="underline" href="/kiosk/pair">{t('kiosk_pair')}</a></p>{/if}
      <ul class="divide-y divide-stone-100 text-sm">
        {#each data.devices as d}
          <li class="flex items-center justify-between py-2">
            <div><div class="font-medium">{d.name}</div><div class="text-xs text-stone-500">{t('settings_paired_on')} {d.createdAt.slice(0, 10)}{#if d.lastSeenAt} · {t('settings_last_seen')} {fmtDateTime(d.lastSeenAt, data.salon.timezone, data.locale)}{/if}</div></div>
            {#if data.isOwner}<form method="post" action="?/revokeDevice" use:enhance><input type="hidden" name="id" value={d.id} /><button class="btn-ghost text-red-700">{t('settings_revoke')}</button></form>{/if}
          </li>
        {/each}
      </ul>
      <a class="btn-secondary mt-2" href="/kiosk/pair">{t('kiosk_pair')}</a>
    </div>

    <div class="card">
      <h2 class="mb-2 font-bold">{t('settings_users')}</h2>
      <ul class="mb-3 divide-y divide-stone-100 text-sm">
        {#each data.users as u}
          <li class="flex items-center justify-between py-2">
            <div><span class="font-medium">{u.name}</span> <span class="text-stone-500">· {u.email}</span> <span class="badge bg-stone-100">{u.role}</span></div>
            {#if data.isOwner}<form method="post" action="?/removeUser" use:enhance><input type="hidden" name="id" value={u.id} /><button class="btn-ghost text-red-700">{t('delete')}</button></form>{/if}
          </li>
        {/each}
      </ul>
      {#if data.isOwner}
        <form method="post" action="?/addUser" use:enhance class="grid gap-2 sm:grid-cols-5">
          {#if form?.form === 'user' && form?.error}<p class="text-sm text-red-700 sm:col-span-5">{form.error === 'email_taken' ? 'Email already used' : t('invalid')}</p>{/if}
          <input class="input" name="name" placeholder={t('your_name')} required />
          <input class="input" name="email" type="email" placeholder={t('email')} required />
          <input class="input" name="password" type="password" placeholder={t('password')} minlength="8" required />
          <select class="input" name="role"><option value="bookkeeper">bookkeeper</option><option value="manager">manager</option><option value="owner">owner</option></select>
          <button class="btn-secondary">{t('add')}</button>
        </form>
      {/if}
    </div>
  </div>
</div>
