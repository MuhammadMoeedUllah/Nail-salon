<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { makeT, type Locale } from '$lib/i18n';
  import { enqueue, flushQueue, readQueue } from '$lib/kiosk/queue';
  import { fmtMinutes } from '$lib/time';

  let { data } = $props();

  type Status = { state: 'out' | 'in' | 'break'; since: string | null; staleOpen: boolean; minutesToday: number; openPunchId: string | null };
  type W = { id: string; name: string; locale: Locale; status: Status };

  // svelte-ignore state_referenced_locally
  let locale = $state<Locale>(data.locale);
  const t = $derived(makeT(locale));
  // svelte-ignore state_referenced_locally
  let workers = $state<W[]>(data.workers as W[]);
  let screen = $state<'grid' | 'pin' | 'actions' | 'done'>('grid');
  let selected = $state<W | null>(null);
  let pin = $state('');
  let pinError = $state('');
  let busy = $state(false);
  let doneMsg = $state('');
  let offlineMsg = $state('');
  let queued = $state(0);
  let now = $state(new Date());
  let online = $state(true);
  let video: HTMLVideoElement | undefined = $state();
  let stream: MediaStream | null = null;
  let cameraOk = $state(false);
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let clockTimer: ReturnType<typeof setInterval> | undefined;
  let flushTimer: ReturnType<typeof setInterval> | undefined;

  const timeFmt = $derived(new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { timeZone: data.salon.timezone, hour: 'numeric', minute: '2-digit' }));
  const dateFmt = $derived(new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { timeZone: data.salon.timezone, weekday: 'long', month: 'long', day: 'numeric' }));
  const hhmm = (iso: string | null) => (iso ? timeFmt.format(new Date(iso)) : '');

  function resetIdle(ms = 30000) {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => goGrid(), ms);
  }

  async function refresh() {
    try {
      const r = await fetch('/kiosk/api/status');
      if (r.ok) {
        const j = await r.json();
        workers = j.workers;
        online = true;
      }
    } catch {
      online = false;
    }
    queued = readQueue().length;
  }

  async function startCamera() {
    if (!data.salon.photoOnPunch || stream) return;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }
      cameraOk = true;
    } catch {
      cameraOk = false;
    }
  }
  function stopCamera() {
    stream?.getTracks().forEach((tr) => tr.stop());
    stream = null;
    cameraOk = false;
  }
  function snap(): string | null {
    if (!cameraOk || !video || video.videoWidth === 0) return null;
    const c = document.createElement('canvas');
    const w = 320;
    const h = Math.round((video.videoHeight / video.videoWidth) * w);
    c.width = w;
    c.height = h;
    c.getContext('2d')!.drawImage(video, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.6);
  }

  function pick(w: W) {
    selected = w;
    pin = '';
    pinError = '';
    locale = w.locale ?? locale;
    screen = 'pin';
    resetIdle();
    startCamera();
  }
  function goGrid() {
    screen = 'grid';
    selected = null;
    pin = '';
    pinError = '';
    locale = data.locale;
    clearTimeout(idleTimer);
    stopCamera();
    refresh();
  }

  async function digit(d: string) {
    if (busy) return;
    resetIdle();
    if (d === 'back') {
      pin = pin.slice(0, -1);
      return;
    }
    if (pin.length >= 4) return;
    pin += d;
    if (pin.length === 4) await verify();
  }

  async function verify() {
    busy = true;
    pinError = '';
    try {
      const r = await fetch('/kiosk/api/punch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ workerId: selected!.id, pin, action: 'verify' })
      });
      const j = await r.json();
      if (r.ok && j.ok) {
        selected = { ...selected!, status: j.status };
        screen = 'actions';
        online = true;
      } else {
        pinError = j.error === 'locked' ? t('kiosk_locked') : t('kiosk_wrong_pin');
        pin = '';
      }
    } catch {
      // Offline: cannot verify the PIN; let the worker choose the action and queue it.
      online = false;
      screen = 'actions';
    } finally {
      busy = false;
    }
  }

  async function act(action: 'in' | 'out' | 'break_start' | 'break_end') {
    if (busy || !selected) return;
    busy = true;
    resetIdle();
    const photo = action === 'in' || action === 'out' ? snap() : null;
    const clientId = crypto.randomUUID();
    const clientTs = new Date().toISOString();
    const body = { workerId: selected.id, pin, action, clientId, clientTs, photo };
    try {
      const r = await fetch('/kiosk/api/punch', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      if (r.ok && j.ok) {
        finish(action, j.ts, j.minutesToday, false);
      } else if (j.error === 'already_in' || j.error === 'not_in' || j.error === 'already_on_break' || j.error === 'not_on_break') {
        selected = { ...selected, status: j.status };
        pinError = '';
      } else {
        pinError = j.error === 'locked' ? t('kiosk_locked') : t('kiosk_wrong_pin');
        screen = 'pin';
        pin = '';
      }
    } catch {
      enqueue({ clientId, workerId: selected.id, pin, action, clientTs, photo });
      queued = readQueue().length;
      online = false;
      finish(action, clientTs, selected.status.minutesToday, true);
    } finally {
      busy = false;
    }
  }

  function finish(action: string, ts: string, minutesToday: number, offline: boolean) {
    doneMsg = action === 'in' ? t('kiosk_done_in', { time: hhmm(ts) }) : action === 'out' ? t('kiosk_done_out', { time: hhmm(ts), hours: fmtMinutes(minutesToday) }) : `${hhmm(ts)} ✓`;
    offlineMsg = offline ? t('kiosk_offline') : '';
    if (!cameraOk && data.salon.photoOnPunch && (action === 'in' || action === 'out')) offlineMsg += (offlineMsg ? ' ' : '') + t('kiosk_camera_denied');
    screen = 'done';
    pin = '';
    stopCamera();
    resetIdle(4000);
  }

  onMount(() => {
    clockTimer = setInterval(() => (now = new Date()), 1000);
    flushTimer = setInterval(async () => {
      const n = await flushQueue();
      if (n) refresh();
      queued = readQueue().length;
    }, 20000);
    const onOnline = () => flushQueue().then(() => refresh());
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', () => (online = false));
    flushQueue().then(() => refresh());
    const visTimer = setInterval(refresh, 60000);
    return () => {
      window.removeEventListener('online', onOnline);
      clearInterval(visTimer);
    };
  });
  onDestroy(() => {
    clearInterval(clockTimer);
    clearInterval(flushTimer);
    clearTimeout(idleTimer);
    stopCamera();
  });

  const stateColor = (s: Status) => (s.state === 'in' ? 'bg-emerald-100 ring-emerald-400 text-emerald-900' : s.state === 'break' ? 'bg-amber-100 ring-amber-400 text-amber-900' : 'bg-white ring-stone-300 text-stone-800');
</script>

<svelte:head><title>{t('nav_kiosk')} · {data.salon.name}</title></svelte:head>

<div class="flex min-h-screen flex-col bg-stone-100 select-none" style="touch-action: manipulation">
  <header class="flex items-center justify-between px-5 py-3">
    <div>
      <div class="text-sm font-semibold text-stone-500">{data.salon.name}</div>
      <div class="text-3xl font-bold tabular-nums text-stone-900">{timeFmt.format(now)}</div>
      <div class="text-sm text-stone-500">{dateFmt.format(now)}</div>
    </div>
    <div class="flex items-center gap-3">
      {#if !online}<span class="badge bg-amber-100 text-amber-800">offline</span>{/if}
      {#if queued > 0}<span class="badge bg-amber-100 text-amber-800">{t('kiosk_queued', { n: queued })}</span>{/if}
      <div class="inline-flex overflow-hidden rounded-lg ring-1 ring-stone-300 text-sm">
        <button class="px-3 py-1.5 {locale === 'en' ? 'bg-brand-700 text-white' : 'bg-white'}" onclick={() => (locale = 'en')}>EN</button>
        <button class="px-3 py-1.5 {locale === 'vi' ? 'bg-brand-700 text-white' : 'bg-white'}" onclick={() => (locale = 'vi')}>VI</button>
      </div>
      {#if data.isOwnerPreview}<a href="/app/today" class="btn-ghost text-sm">← {t('nav_today')}</a>{/if}
    </div>
  </header>

  <main class="flex flex-1 flex-col px-5 pb-6">
    {#if screen === 'grid'}
      <h1 class="mb-4 text-xl font-semibold text-stone-700">{t('kiosk_title')}</h1>
      {#if workers.length === 0}
        <p class="card">{t('none_yet')}</p>
      {/if}
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {#each workers as w (w.id)}
          <button class="flex min-h-[96px] flex-col items-start justify-between rounded-2xl p-4 text-left shadow-sm ring-2 transition active:scale-[0.98] {stateColor(w.status)}" onclick={() => pick(w)}>
            <span class="text-xl font-bold">{w.name}</span>
            <span class="text-sm">
              {#if w.status.state === 'in'}{t('kiosk_clocked_in_since', { time: hhmm(w.status.since) })}
              {:else if w.status.state === 'break'}{t('kiosk_on_break_since', { time: hhmm(w.status.since) })}
              {:else}{t('kiosk_not_clocked_in')}{/if}
            </span>
          </button>
        {/each}
      </div>
    {:else if screen === 'pin' && selected}
      <div class="mx-auto flex w-full max-w-3xl flex-1 items-center gap-8">
        <div class="flex-1">
          <button class="btn-ghost mb-2 -ml-3" onclick={goGrid}>← {t('back')}</button>
          <h1 class="text-2xl font-bold">{selected.name}</h1>
          <p class="mb-4 text-stone-600">{t('kiosk_enter_pin')}</p>
          <div class="mb-3 flex gap-3">
            {#each [0, 1, 2, 3] as i}
              <div class="h-5 w-5 rounded-full ring-2 ring-stone-400 {pin.length > i ? 'bg-brand-700 ring-brand-700' : 'bg-white'}"></div>
            {/each}
          </div>
          {#if pinError}<p class="mb-3 font-semibold text-red-700">{pinError}</p>{/if}
          <div class="grid max-w-xs grid-cols-3 gap-2">
            {#each ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as d}
              <button class="h-16 rounded-xl bg-white text-2xl font-semibold shadow-sm ring-1 ring-stone-300 active:bg-stone-200" onclick={() => digit(d)} disabled={busy}>{d}</button>
            {/each}
            <button class="h-16 rounded-xl bg-stone-200 text-lg font-semibold active:bg-stone-300" onclick={() => digit('back')}>⌫</button>
            <button class="h-16 rounded-xl bg-white text-2xl font-semibold shadow-sm ring-1 ring-stone-300 active:bg-stone-200" onclick={() => digit('0')} disabled={busy}>0</button>
            <button class="h-16 rounded-xl bg-stone-200 text-lg font-semibold active:bg-stone-300" onclick={goGrid}>✕</button>
          </div>
        </div>
        {#if data.salon.photoOnPunch}
          <div class="hidden w-72 sm:block">
            <!-- svelte-ignore a11y_media_has_caption -->
            <video bind:this={video} autoplay playsinline muted class="aspect-[4/3] w-full rounded-2xl bg-stone-900 object-cover"></video>
            <p class="mt-2 text-center text-sm text-stone-500">{cameraOk ? t('kiosk_photo_hint') : t('kiosk_camera_denied')}</p>
          </div>
        {/if}
      </div>
    {:else if screen === 'actions' && selected}
      <div class="mx-auto flex w-full max-w-3xl flex-1 items-center gap-8">
        <div class="flex-1">
          <button class="btn-ghost mb-2 -ml-3" onclick={goGrid}>← {t('back')}</button>
          <h1 class="text-3xl font-bold">{selected.name}</h1>
          <p class="mb-1 text-lg text-stone-600">
            {#if selected.status.state === 'in'}{t('kiosk_clocked_in_since', { time: hhmm(selected.status.since) })}
            {:else if selected.status.state === 'break'}{t('kiosk_on_break_since', { time: hhmm(selected.status.since) })}
            {:else}{t('kiosk_not_clocked_in')}{/if}
          </p>
          {#if selected.status.staleOpen}
            <p class="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t('kiosk_forgot_out', { date: selected.status.since?.slice(0, 10) ?? '' })}</p>
          {/if}
          {#if pinError}<p class="mb-3 font-semibold text-red-700">{pinError}</p>{/if}
          <div class="mt-4 grid max-w-md grid-cols-1 gap-3">
            {#if selected.status.state === 'out' || selected.status.staleOpen}
              <button class="btn-primary h-20 text-2xl" onclick={() => act('in')} disabled={busy}>{t('kiosk_clock_in')}</button>
            {/if}
            {#if selected.status.state === 'in'}
              <button class="btn-danger h-20 text-2xl" onclick={() => act('out')} disabled={busy}>{t('kiosk_clock_out')}</button>
              <button class="btn-secondary h-14" onclick={() => act('break_start')} disabled={busy}>{t('kiosk_start_break')}</button>
            {/if}
            {#if selected.status.state === 'break'}
              <button class="btn-primary h-20 text-2xl" onclick={() => act('break_end')} disabled={busy}>{t('kiosk_end_break')}</button>
              <button class="btn-danger h-14" onclick={() => act('out')} disabled={busy}>{t('kiosk_clock_out')}</button>
            {/if}
          </div>
        </div>
        {#if data.salon.photoOnPunch}
          <div class="hidden w-72 sm:block">
            <!-- svelte-ignore a11y_media_has_caption -->
            <video bind:this={video} autoplay playsinline muted class="aspect-[4/3] w-full rounded-2xl bg-stone-900 object-cover"></video>
            <p class="mt-2 text-center text-sm text-stone-500">{cameraOk ? t('kiosk_photo_hint') : t('kiosk_camera_denied')}</p>
          </div>
        {/if}
      </div>
    {:else if screen === 'done'}
      <div class="flex flex-1 flex-col items-center justify-center text-center">
        <div class="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-5xl text-emerald-700">✓</div>
        <p class="text-2xl font-bold">{doneMsg}</p>
        {#if offlineMsg}<p class="mt-3 max-w-md rounded-lg bg-amber-50 p-3 text-amber-800">{offlineMsg}</p>{/if}
        <button class="btn-ghost mt-6" onclick={goGrid}>{t('close')}</button>
      </div>
    {/if}
  </main>
</div>
