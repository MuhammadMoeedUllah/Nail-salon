/** Parse a dollars string like "45", "45.5", "$1,234.56" into integer cents. Returns null if invalid. */
export function parseDollars(v: FormDataEntryValue | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/[$,\s]/g, '');
  if (s === '') return 0;
  if (!/^-?\d*(\.\d{0,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}
export const dollars = (cents: number) => (cents / 100).toFixed(2);
