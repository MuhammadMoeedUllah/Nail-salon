import { describe, it, expect } from 'vitest';
import { messages } from './messages';

describe('messages', () => {
  it('Vietnamese strings are NFC-normalised so tone marks compare and render consistently', () => {
    const bad = Object.entries(messages.vi).filter(([, v]) => v !== v.normalize('NFC')).map(([k]) => k);
    expect(bad).toEqual([]);
  });
  it('every English key has a non-empty Vietnamese string', () => {
    const missing = Object.keys(messages.en).filter((k) => !(messages.vi as Record<string, string>)[k]?.trim());
    expect(missing).toEqual([]);
  });
  it('placeholders match between languages', () => {
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    const diff = Object.keys(messages.en).filter((k) => ph((messages.en as Record<string, string>)[k]) !== ph((messages.vi as Record<string, string>)[k]));
    expect(diff).toEqual([]);
  });
});
