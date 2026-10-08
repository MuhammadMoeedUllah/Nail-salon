// Initials avatars: identity, not status, so no reds or greens that could read as owed or ok. All pass 4.5:1 with white.
const HUES = ['#4f46e5', '#7c3aed', '#a21caf', '#0369a1', '#0f766e', '#475569', '#b45309', '#4338ca'];

export function initials(name: string): string {
  const parts = name.normalize('NFC').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = Array.from(parts[0])[0] ?? '';
  const last = parts.length > 1 ? (Array.from(parts[parts.length - 1])[0] ?? '') : '';
  return (first + last).toLocaleUpperCase('vi');
}

export function hue(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return HUES[h % HUES.length];
}
