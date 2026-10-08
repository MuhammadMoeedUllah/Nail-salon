<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { makeT, type Locale } from '$lib/i18n';
  import { enqueue, flushQueue, readQueue } from '$lib/kiosk/queue';
  import { feedback } from '$lib/kiosk/sounds';
  import { fmtDate, fmtMinutes, localDate } from '$lib/time';
  import Avatar from '$lib/ui/Avatar.svelte';
  import { IconClockIn, IconClockOut, IconBreak, IconBack, IconBackspace, IconClose, IconUndo, IconOffline, IconCamera, IconWarn, IconOut, IconHome, IconSteps } from '$lib/ui/icons';

  let { data } = $props();

  type Status = { state: 'out' | 'in' | 'break'; since: string | null; staleOpen: boolean; minutesToday: number; ticketsToday: number; openPunchId: string | null };
  type W = { id: string; name: string; locale: Locale; status: Status };
  type Action = 'in' | 'out' | 'break_start' | 'break_end';

  // svelte-ignore state_referenced_locally
  let locale = $state<Locale>(data.locale);
  const t = $derived(makeT(locale));
  const other = $derived<Locale>(locale === 'vi' ? 'en' : 'vi');
  const t2 = $derived(makeT(other));
  // svelte-ignore state_referenced_locally
  let workers = $state<W[]>(data.workers as W[]);
  let screen = $state<'grid' | 'pin' | 'actions' | 'done'>('grid');
  let selected = $state<W | null>(null);
  let pin = $state('');
  let pinError = $state('');
  let shake = $state(false);
  let busy = $state(false);
  let done = $state<{ title: string; sub: string; note: string; offline: boolean } | null>(null);
  let undoPunchId = $state<string | null>(null);
  let undoKind = $state<'in' | 'out'>('in');
  let undoUntil = $state(0);
  let staleAnswered = $state(false);
  let staleNote = $state('');
  let queued = $state(0);
  let online = $state(true);
  let now = $state(Date.now());
  let idleUntil = $state(0);
  let lastTouch = Date.now();
  let dimmed = $state(false);
  let standalone = $state(true);
  let video: HTMLVideoElement | undefined = $state();
  let stream: MediaStream | null = null;
  let cameraOk = $state(false);
  let tick: ReturnType<typeof setInterval> | undefined;
  let flushTimer: ReturnType<typeof setInterval> | undefined;
  let refreshTimer: ReturnType<typeof setInterval> | undefined;

  const tz = $derived(data.salon.timezone);
  const intl = (l: Locale) => (l === 'vi' ? 'vi-VN' : 'en-US');
  const timeFmt = $derived(new Intl.DateTimeFormat(intl(locale), { timeZone: tz, hour: 'numeric', minute: '2-digit' }));
  const dateFmt = $derived(new Intl.DateTimeFormat(intl(locale), { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric' }));
  const hhmm = (iso: string | null) => (iso ? timeFmt.format(new Date(iso)) : '');
  const elapsed = (iso: string | null) => (iso ? fmtMinutes(Math.max(0, Math.floor((now - Date.parse(iso)) / 60000))) + ' h' : '');
  /** "19:30" shown as "7:30 PM" or "19:30" */
  function wall(hm: string, l: Locale = locale) {
    const [h, m] = hm.split(':').map(Number);
    return new Intl.DateTimeFormat(intl(l), { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
  }
  const counts = $derived({
    in: workers.filter((w) => w.status.state === 'in' && !w.status.staleOpen).length,
    brk: workers.filter((w) => w.status.state === 'break').length,
    out: workers.filter((w) => w.status.state === 'out' || w.status.staleOpen).length
  });
  const idleLeft = $derived(screen !== 'grid' && idleUntil ? Math.max(0, Math.ceil((idleUntil - now) / 1000)) : 0);
  const undoLeft = $derived(undoPunchId ? Math.max(0, Math.ceil((undoUntil - now) / 1000)) : 0);
  const staleDay = $derived(selected?.status.since ? fmtDate(localDate(selected.status.since, tz), locale) : '');

  function resetIdle(ms = 30000) {
    idleUntil = Date.now() + ms;
  }

  async function refresh() {
    try {
      const r = await fetch('/kiosk/api/status');
      if (r.ok) {
        workers = (await r.json()).workers;
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
  $effect(() => {
    // re-attach the stream when the video element changes between screens
    if (video && stream && video.srcObject !== stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    }
  });
  function snap(): string | null {
    if (!cameraOk || !video || video.videoWidth === 0) return null;
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = Math.round((video.videoHeight / video.videoWidth) * 320);
    c.getContext('2d')!.drawImage(video, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.6);
  }

  function pick(w: W) {
    feedback(data.salon.sounds, 'key');
    selected = w;
    pin = '';
    pinError = '';
    staleAnswered = false;
    staleNote = '';
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
    done = null;
    undoPunchId = null;
    idleUntil = 0;
    locale = data.locale;
    stopCamera();
    refresh();
  }

  async function digit(d: string) {
    if (busy) return;
    resetIdle();
    feedback(data.salon.sounds, 'key');
    if (d === 'back') {
      pin = pin.slice(0, -1);
      pinError = '';
      return;
    }
    if (pin.length >= 4) return;
    if (pinError) pinError = '';
    shake = false;
    pin += d;
    if (pin.length === 4) await verify();
  }

  function wrongPin(msg: string) {
    // clear at once so a fast retry is not swallowed; the dots flash red while the row shakes
    pinError = msg;
    pin = '';
    shake = true;
    feedback(data.salon.sounds, 'error');
    setTimeout(() => (shake = false), 600);
  }

  async function verify() {
    busy = true;
    try {
      const r = await fetch('/kiosk/api/punch', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ workerId: selected!.id, pin, action: 'verify' }) });
      const j = await r.json();
      if (r.ok && j.ok) {
        selected = { ...selected!, status: j.status };
        online = true;
        busy = false;
        if (data.salon.autoClockIn && j.status.state === 'out') {
          await act('in');
          return;
        }
        screen = 'actions';
      } else {
        wrongPin(j.error === 'locked' ? t('kiosk_locked') : t('kiosk_wrong_pin'));
      }
    } catch {
      // Offline: the PIN cannot be checked now; the punch is queued and checked when Wi-Fi returns.
      online = false;
      screen = 'actions';
    } finally {
      busy = false;
    }
  }

  async function answerStale(yes: boolean) {
    if (!selected || busy) return;
    resetIdle();
    if (yes && selected.status.openPunchId) {
      busy = true;
      try {
        const r = await fetch('/kiosk/api/punch', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ workerId: selected.id, pin, action: 'close_stale', punchId: selected.status.openPunchId, time: data.salon.closingTime }) });
        const j = await r.json();
        staleNote = j.ok ? t('kiosk_stale_saved', { time: wall(data.salon.closingTime), day: staleDay }) : t('kiosk_stale_failed');
        if (j.status) selected = { ...selected, status: j.status };
      } catch {
        staleNote = t('kiosk_stale_failed');
      } finally {
        busy = false;
      }
    }
    staleAnswered = true;
    if (data.salon.autoClockIn) await act('in');
  }

  async function act(action: Action) {
    if (busy || !selected) return;
    busy = true;
    resetIdle();
    const photo = action === 'in' || action === 'out' ? snap() : null;
    const clientId = crypto.randomUUID();
    const clientTs = new Date().toISOString();
    try {
      const r = await fetch('/kiosk/api/punch', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ workerId: selected.id, pin, action, clientId, clientTs, photo }) });
      const j = await r.json();
      if (r.ok && j.ok) finish(action, j.ts, j.minutesToday, false, action === 'in' || action === 'out' ? j.punchId : null);
      else if (['already_in', 'not_in', 'already_on_break', 'not_on_break'].includes(j.error)) {
        selected = { ...selected, status: j.status };
        screen = 'actions';
      } else {
        screen = 'pin';
        wrongPin(j.error === 'locked' ? t('kiosk_locked') : t('kiosk_wrong_pin'));
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

  async function undo() {
    if (!undoPunchId || !selected) return;
    const pid = undoPunchId;
    const kind = undoKind;
    undoPunchId = null;
    try {
      const r = await fetch('/kiosk/api/punch', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ workerId: selected.id, pin, action: 'undo', punchId: pid }) });
      const j = await r.json();
      done = { title: j.ok ? (kind === 'out' ? t('kiosk_undone_out') : t('undone')) : t('invalid'), sub: '', note: '', offline: false };
    } catch {
      done = { title: t('invalid'), sub: '', note: '', offline: false };
    }
    resetIdle(3500);
  }

  function finish(action: Action, ts: string, minutesToday: number, offline: boolean, punchId: string | null = null) {
    undoPunchId = offline ? null : punchId;
    undoKind = action === 'out' ? 'out' : 'in';
    undoUntil = Date.now() + 8000;
    const title =
      action === 'in' ? t('kiosk_done_in', { time: hhmm(ts) }) : action === 'out' ? t('kiosk_done_out', { time: hhmm(ts), hours: fmtMinutes(minutesToday) }) : action === 'break_start' ? t('kiosk_break_started', { time: hhmm(ts) }) : t('kiosk_break_ended', { time: hhmm(ts) });
    const sub = action !== 'out' && minutesToday > 0 ? t('kiosk_hours_today', { hours: fmtMinutes(minutesToday) }) : '';
    let note = offline ? t('kiosk_offline') : '';
    if (!offline && !cameraOk && data.salon.photoOnPunch && (action === 'in' || action === 'out')) note = t('kiosk_camera_denied');
    done = { title, sub, note: [staleNote, note].filter(Boolean).join(' '), offline };
    screen = 'done';
    feedback(data.salon.sounds, 'ok');
    stopCamera();
    resetIdle(undoPunchId ? 9000 : 4500);
  }

  function closedForTheDay(): boolean {
    if (!data.salon.dimAfterClose) return false;
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(now));
    const [h, m] = parts.split(':').map(Number);
    const [ch, cm] = data.salon.closingTime.split(':').map(Number);
    const mins = h * 60 + m;
    return mins >= ch * 60 + cm + 30 || mins < 6 * 60;
  }

  function onTouch() {
    lastTouch = Date.now();
    dimmed = false;
  }

  onMount(() => {
    standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || (navigator as { standalone?: boolean }).standalone === true;
    tick = setInterval(() => {
      now = Date.now();
      if (screen !== 'grid' && idleUntil && now >= idleUntil) goGrid();
      if (undoPunchId && now >= undoUntil) undoPunchId = null;
      if (screen === 'grid' && !dimmed && now - lastTouch > 60000 && closedForTheDay()) dimmed = true;
    }, 1000);
    flushTimer = setInterval(async () => {
      if (await flushQueue()) refresh();
      queued = readQueue().length;
    }, 20000);
    refreshTimer = setInterval(() => screen === 'grid' && refresh(), 60000);
    const onOnline = () => flushQueue().then(() => refresh());
    const onOffline = () => (online = false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    flushQueue().then(() => refresh());
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  });
  onDestroy(() => {
    clearInterval(tick);
    clearInterval(flushTimer);
    clearInterval(refreshTimer);
    stopCamera();
  });

  function onKey(e: KeyboardEvent) {
    if (screen !== 'pin') return;
    if (/^\d$/.test(e.key)) digit(e.key);
    else if (e.key === 'Backspace') digit('back');
    else if (e.key === 'Escape') goGrid();
  }

  const tileStyle = (s: Status) =>
    s.staleOpen ? 'border-warn bg-surface' : s.state === 'in' ? 'border-ok bg-ok-soft' : s.state === 'break' ? 'border-warn bg-warn-soft' : 'border-line bg-surface';
</script>

<svelte:head>
  <title>{t('nav_kiosk')} · {data.salon.name}</title>
  <link rel="manifest" href="/kiosk.webmanifest" />
</svelte:head>
<svelte:window onkeydown={onKey} onpointerdown={onTouch} />

{#snippet cameraCard()}
  {#if data.salon.photoOnPunch}
    <div class="hidden w-80 shrink-0 md:block">
      <!-- svelte-ignore a11y_media_has_caption -->
      <video bind:this={video} autoplay playsinline muted class="aspect-[4/3] w-full rounded-3xl bg-stone-800 object-cover shadow-card"></video>
      <p class="mt-3 flex items-center justify-center gap-2 text-center text-base font-bold {cameraOk ? 'text-ink-muted' : 'text-warn-ink'}">
        <IconCamera size={20} />{cameraOk ? t('kiosk_photo_hint') : t('kiosk_camera_denied')}
      </p>
    </div>
  {/if}
{/snippet}

{#snippet person(size: number)}
  {#if selected}
    <div class="flex items-center gap-4">
      <Avatar name={selected.name} id={selected.id} {size} />
      <p class="text-4xl leading-tight font-bold">{selected.name}</p>
    </div>
  {/if}
{/snippet}

<div class="flex min-h-dvh flex-col bg-canvas select-none" style="touch-action: manipulation" lang={locale}>
  <header class="flex flex-wrap items-center justify-between gap-3 px-6 pt-4 pb-2">
    <div>
      <p class="text-base font-bold text-ink-muted">{data.salon.name}</p>
      <p class="text-[2rem] leading-tight font-bold tabular-nums">{timeFmt.format(new Date(now))}</p>
      <p class="text-base text-ink-muted">{dateFmt.format(new Date(now))}</p>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      {#if online && !queued}
        <span class="pill pill-ok text-base"><span class="size-2.5 rounded-full bg-ok" aria-hidden="true"></span>{t('kiosk_online')}</span>
      {:else}
        <span class="pill pill-warn text-base"><IconOffline size={18} />{online ? t('kiosk_queued', { n: queued }) : t('kiosk_offline_short')}</span>
      {/if}
      <div class="flex gap-1 rounded-xl border border-line bg-surface p-1" role="group" aria-label={t('language')}>
        {#each ['en', 'vi'] as const as l}
          <button class="min-h-12 min-w-14 rounded-lg px-3 text-lg font-bold {locale === l ? 'bg-brand text-white' : 'text-ink-muted'}" aria-pressed={locale === l} onclick={() => (locale = l)}>{l.toUpperCase()}</button>
        {/each}
      </div>
      {#if data.isOwnerPreview}<a href="/app/home" class="btn-secondary"><IconHome size={20} />{t('kiosk_back_to_app')}</a>{/if}
    </div>
  </header>

  {#if !online || queued}
    <div class="mx-6 mb-2 flex items-center gap-3 rounded-2xl bg-warn-soft px-5 py-3 text-lg font-bold text-warn-ink" role="status">
      <IconOffline size={24} class="shrink-0" />
      <span>{t('kiosk_offline_banner')}{#if queued} · {t('kiosk_queued', { n: queued })}{/if}</span>
    </div>
  {/if}

  <main class="flex flex-1 flex-col px-6 pb-6">
    {#if screen === 'grid'}
      <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h1 class="text-2xl font-bold">{t('kiosk_title')} <span class="font-normal text-ink-muted">· {t2('kiosk_title')}</span></h1>
        <p class="text-lg font-bold text-ink-muted">{t('kiosk_summary', counts)}</p>
      </div>
      {#if workers.length === 0}
        <p class="card text-lg">{t('none_yet')}</p>
      {/if}
      <div class="grid flex-1 gap-4" style="grid-template-columns: repeat(auto-fill, minmax(min(100%, 14.5rem), 1fr)); grid-auto-rows: minmax(9rem, 1fr);">
        {#each workers as w (w.id)}
          <button class="flex flex-col items-start justify-between rounded-3xl border-2 p-5 text-left shadow-card transition active:scale-[0.98] {tileStyle(w.status)}" onclick={() => pick(w)}>
            <span class="flex w-full items-start justify-between gap-2">
              <Avatar name={w.name} id={w.id} size={64} />
              {#if data.salon.showTickets && w.status.ticketsToday}<span class="pill bg-white/85 text-base text-ink">{w.status.ticketsToday === 1 ? t('kiosk_ticket_one') : t('kiosk_tickets_short', { n: w.status.ticketsToday })}</span>{/if}
            </span>
            <span class="mt-3 block w-full">
              <span class="block truncate text-[1.75rem] leading-tight font-bold">{w.name}</span>
              <span class="mt-1.5 flex items-center gap-2 text-lg font-bold {w.status.state === 'in' ? 'text-ok-ink' : w.status.state === 'break' ? 'text-warn-ink' : 'text-ink-muted'}">
                {#if w.status.staleOpen}<IconWarn size={22} strokeWidth={2.5} class="text-warn-ink" /><span class="text-warn-ink">{t('kiosk_stale_short', { day: w.status.since ? fmtDate(localDate(w.status.since, tz), locale) : '' })}</span>
                {:else if w.status.state === 'in'}<IconClockIn size={22} strokeWidth={2.5} />{t('kiosk_in_since_short', { time: hhmm(w.status.since) })} · {elapsed(w.status.since)}
                {:else if w.status.state === 'break'}<IconBreak size={22} strokeWidth={2.5} />{t('kiosk_break_since_short', { time: hhmm(w.status.since) })}
                {:else}<IconOut size={22} strokeWidth={2.5} />{t('kiosk_out_short')}{/if}
              </span>
            </span>
          </button>
        {/each}
      </div>
      {#if !standalone}
        <a href="/kiosk/setup" class="mt-4 inline-flex min-h-11 items-center gap-2 self-start rounded-lg px-2 text-base font-bold text-ink-muted hover:bg-sunken"><IconSteps size={20} />{t('kiosk_add_home')}</a>
      {/if}
    {:else if screen === 'pin' && selected}
      <div class="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center gap-12">
        <div class="flex flex-col items-center">
          <button class="btn-secondary mb-6 min-h-16 self-start px-5 text-xl" onclick={goGrid}><IconBack size={26} />{t('back')}</button>
          {@render person(72)}
          <p class="mt-3 text-2xl text-ink-muted">{t('kiosk_enter_pin')} <span class="text-lg">· {t2('kiosk_enter_pin')}</span></p>
          <div class="my-6 flex gap-5 {shake ? 'animate-shake' : ''}" aria-hidden="true">
            {#each [0, 1, 2, 3] as i}
              <span class="size-7 rounded-full border-[3px] transition-colors {shake ? 'border-owed bg-owed' : pin.length > i ? 'border-brand bg-brand' : 'border-line-strong bg-surface'}"></span>
            {/each}
          </div>
          <p class="mb-4 min-h-8 text-xl font-bold text-owed" role="alert">{pinError}{#if !online && !pinError}<span class="text-warn-ink">{t('kiosk_pin_offline')}</span>{/if}</p>
          <div class="grid grid-cols-3 gap-3">
            {#each ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as d}
              <button class="flex size-20 items-center justify-center rounded-2xl border border-line-strong bg-surface text-3xl font-bold shadow-raise active:bg-brand-tint" onclick={() => digit(d)} disabled={busy}>{d}</button>
            {/each}
            <button class="flex size-20 items-center justify-center rounded-2xl bg-line text-ink active:bg-line-strong" aria-label={t('keypad_delete')} onclick={() => digit('back')}><IconBackspace size={30} /></button>
            <button class="flex size-20 items-center justify-center rounded-2xl border border-line-strong bg-surface text-3xl font-bold shadow-raise active:bg-brand-tint" onclick={() => digit('0')} disabled={busy}>0</button>
            <button class="flex size-20 items-center justify-center rounded-2xl bg-line text-ink active:bg-line-strong" aria-label={t('cancel')} onclick={goGrid}><IconClose size={30} /></button>
          </div>
        </div>
        {@render cameraCard()}
      </div>
    {:else if screen === 'actions' && selected}
      {@const st = selected.status}
      <div class="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center gap-12">
        <div class="w-full max-w-xl">
          <button class="btn-secondary mb-6 min-h-16 px-5 text-xl" onclick={goGrid}><IconBack size={26} />{t('back')}</button>
          {@render person(80)}
          <p class="mt-3 text-2xl text-ink-muted">
            {#if st.staleOpen}{t('kiosk_forgot_out', { date: staleDay })}
            {:else if st.state === 'in'}{t('kiosk_in_since_short', { time: hhmm(st.since) })} · {elapsed(st.since)}
            {:else if st.state === 'break'}{t('kiosk_break_since_short', { time: hhmm(st.since) })}
            {:else}{t('kiosk_not_clocked_in')}{/if}
          </p>
          {#if !online}<p class="mt-2 text-lg font-bold text-warn-ink">{t('kiosk_pin_offline')}</p>{/if}

          {#if st.staleOpen && !staleAnswered}
            <div class="mt-6 rounded-3xl bg-warn-soft p-5 text-warn-ink" role="alert">
              <p class="flex items-start gap-3 text-2xl leading-snug font-bold"><IconWarn size={30} class="mt-0.5 shrink-0" />{t('kiosk_stale_question', { day: staleDay, time: wall(data.salon.closingTime) })}</p>
              <div class="mt-5 grid gap-3">
                <button class="btn-night min-h-20 text-2xl" disabled={busy} onclick={() => answerStale(true)}>{t('kiosk_stale_yes', { time: wall(data.salon.closingTime) })}</button>
                <button class="btn-secondary min-h-16 text-xl" disabled={busy} onclick={() => answerStale(false)}>{t('kiosk_stale_other')}</button>
              </div>
            </div>
          {:else}
            <div class="mt-8 grid gap-4">
              {#if st.state === 'out' || st.staleOpen}
                <button class="btn-primary min-h-24 flex-col gap-0 rounded-3xl" disabled={busy} onclick={() => act('in')}>
                  <span class="flex items-center gap-3 text-3xl"><IconClockIn size={32} />{t('kiosk_clock_in')}</span><span class="text-lg font-normal opacity-90">{t2('kiosk_clock_in')}</span>
                </button>
              {:else if st.state === 'in'}
                <button class="btn-night min-h-24 flex-col gap-0 rounded-3xl" disabled={busy} onclick={() => act('out')}>
                  <span class="flex items-center gap-3 text-3xl"><IconClockOut size={32} />{t('kiosk_clock_out')}</span><span class="text-lg font-normal opacity-90">{t2('kiosk_clock_out')}</span>
                </button>
                <button class="btn-secondary min-h-[4.5rem] rounded-3xl text-2xl" disabled={busy} onclick={() => act('break_start')}><IconBreak size={28} />{t('kiosk_start_break')}<span class="text-lg font-normal text-ink-muted">· {t2('kiosk_start_break')}</span></button>
              {:else}
                <button class="btn-primary min-h-24 flex-col gap-0 rounded-3xl" disabled={busy} onclick={() => act('break_end')}>
                  <span class="flex items-center gap-3 text-3xl"><IconBreak size={32} />{t('kiosk_end_break')}</span><span class="text-lg font-normal opacity-90">{t2('kiosk_end_break')}</span>
                </button>
                <button class="btn-secondary min-h-[4.5rem] rounded-3xl text-2xl" disabled={busy} onclick={() => act('out')}><IconClockOut size={28} />{t('kiosk_clock_out')}<span class="text-lg font-normal text-ink-muted">· {t2('kiosk_clock_out')}</span></button>
              {/if}
            </div>
          {/if}
        </div>
        {@render cameraCard()}
      </div>
    {:else if screen === 'done' && done}
      <div class="flex flex-1 flex-col items-center justify-center text-center">
        <div class="flex size-32 items-center justify-center rounded-full bg-ok-soft text-ok">
          <svg viewBox="0 0 52 52" class="size-20" aria-hidden="true"><path class="draw" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" d="M14 27l8 8 16-17" /></svg>
        </div>
        <p class="mt-6 max-w-3xl text-4xl leading-tight font-bold" role="status">{done.title}</p>
        {#if done.sub}<p class="mt-3 text-2xl text-ink-muted">{done.sub}</p>{/if}
        {#if done.note}<p class="mt-5 max-w-2xl rounded-2xl bg-warn-soft px-5 py-3 text-xl text-warn-ink">{done.note}</p>{/if}
        <div class="mt-10 flex flex-wrap justify-center gap-4">
          {#if undoPunchId}
            <button class="btn-secondary min-h-[4.5rem] rounded-2xl px-8 text-2xl" onclick={undo}>
              <svg viewBox="0 0 36 36" class="size-9 -rotate-90" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-line)" stroke-width="4" /><circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="94.25" stroke-dashoffset={94.25 * (1 - undoLeft / 8)} style="transition: stroke-dashoffset 1s linear" /></svg>
              <IconUndo size={28} />{t('undo')} <span class="text-lg font-normal text-ink-muted">· {t2('undo')}</span>
            </button>
          {/if}
          <button class="btn-primary min-h-[4.5rem] rounded-2xl px-10 text-2xl" onclick={goGrid}>{t('close')}</button>
        </div>
      </div>
    {/if}
  </main>

  {#if idleLeft > 0 && idleLeft <= 10 && (screen === 'pin' || screen === 'actions')}
    <div class="fixed right-6 bottom-6 flex items-center gap-2 rounded-full bg-night px-4 py-2 text-lg font-bold text-white shadow-float" aria-live="polite">{t('kiosk_returning', { n: idleLeft })}</div>
  {/if}

  {#if dimmed}
    <button class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-950 text-stone-300" onclick={onTouch}>
      <span class="text-5xl font-bold tabular-nums text-stone-200">{timeFmt.format(new Date(now))}</span>
      <span class="mt-3 text-2xl">{t('kiosk_tap_wake')} · {t2('kiosk_tap_wake')}</span>
    </button>
  {/if}
</div>

<style>
  .draw {
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    animation: draw-check 0.6s 0.1s ease-out forwards;
  }
  @keyframes draw-check {
    to { stroke-dashoffset: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .draw { animation: none; stroke-dashoffset: 0; }
  }
</style>
