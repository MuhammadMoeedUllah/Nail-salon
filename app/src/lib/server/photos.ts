import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { env } from '$env/dynamic/private';

const root = () => resolve(env.PHOTO_DIR ?? './data/photos');

/** Store a small JPEG (data URL or base64) and return its relative reference. */
export function savePhoto(salonId: string, punchId: string, kind: 'in' | 'out', dataUrl: string): string | null {
  const m = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 400_000) return null; // the client compresses to ~20-60 KB
  const month = new Date().toISOString().slice(0, 7);
  const dir = join(root(), salonId, month);
  mkdirSync(dir, { recursive: true });
  const ext = m[1] === 'png' ? 'png' : m[1] === 'webp' ? 'webp' : 'jpg';
  const rel = `${salonId}/${month}/${punchId}-${kind}.${ext}`;
  writeFileSync(join(root(), rel), buf);
  return rel;
}

export function readPhoto(rel: string): { buf: Buffer; type: string } | null {
  if (rel.includes('..')) return null;
  const p = join(root(), rel);
  if (!existsSync(p)) return null;
  const type = rel.endsWith('.png') ? 'image/png' : rel.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  return { buf: readFileSync(p), type };
}
