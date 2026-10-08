// Short feedback tones for the tablet clock (UX-18). Off unless the salon turns them on; only after a tap.
let ctx: AudioContext | null = null;

function tone(freq: number, ms: number, delay = 0, gain = 0.06) {
  try {
    ctx ??= new AudioContext();
    const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + ms / 1000 + 0.02);
  } catch {
    /* audio unavailable */
  }
}

export function feedback(enabled: boolean, kind: 'key' | 'ok' | 'error') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(kind === 'error' ? [30, 40, 30] : 12);
  if (!enabled) return;
  if (kind === 'key') tone(1100, 30, 0, 0.035);
  else if (kind === 'ok') { tone(880, 90); tone(1320, 140, 0.1); }
  else { tone(240, 120); tone(190, 160, 0.15); }
}
