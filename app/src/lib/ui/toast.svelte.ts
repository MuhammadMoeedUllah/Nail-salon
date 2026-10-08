// One toast at a time, bottom centre. Confirmations only; errors go in a Banner (R13).
export type ToastItem = { id: number; text: string; kind: 'ok' | 'info'; undo?: () => unknown; duration: number };

export const toaster = $state<{ current: ToastItem | null }>({ current: null });
let seq = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

export function toast(text: string, opts: { kind?: 'ok' | 'info'; undo?: () => unknown; duration?: number } = {}) {
  clearTimeout(timer);
  const duration = opts.duration ?? (opts.undo ? 8000 : 5000);
  toaster.current = { id: ++seq, text, kind: opts.kind ?? 'ok', undo: opts.undo, duration };
  timer = setTimeout(() => (toaster.current = null), duration);
}

export function dismissToast() {
  clearTimeout(timer);
  toaster.current = null;
}
