// CSV import: sniff the export format of Square, Fresha, Vagaro, GlossGenius or any spreadsheet,
// map columns, and normalise rows into tickets. Isomorphic (used in the browser for preview and on
// the server for validation).
import Papa from 'papaparse';

export interface Mapping {
  date: string | null;
  time: string | null;
  staff: string | null;
  service: string | null;
  price: string | null;
  tip: string | null;
  tipCash: string | null;
  method: string | null;
  externalId: string | null;
  ticketNo: string | null;
  qty: string | null;
}

export interface NormalizedTicket {
  workDate: string; // YYYY-MM-DD
  time: string; // HH:MM (local, as in the file)
  staffName: string;
  serviceName: string;
  priceCents: number;
  tipCardCents: number;
  tipCashCents: number;
  paymentMethod: 'card' | 'cash' | 'other' | null;
  externalId: string;
  ticketNo: string | null;
}

export type Format = 'square_items' | 'square_transactions' | 'fresha' | 'vagaro' | 'glossgenius' | 'booksy' | 'generic';

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const clean = text.replace(/^﻿/, '');
  const res = Papa.parse<Record<string, string>>(clean, { header: true, skipEmptyLines: 'greedy', transformHeader: (h) => h.trim() });
  const headers = (res.meta.fields ?? []).filter(Boolean);
  return { headers, rows: res.data };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function find(headers: string[], candidates: string[], exclude: string[] = []): string | null {
  const n = headers.map((h) => [h, norm(h)] as const);
  for (const c of candidates) {
    const exact = n.find(([, x]) => x === c && !exclude.some((e) => x.includes(e)));
    if (exact) return exact[0];
  }
  for (const c of candidates) {
    const partial = n.find(([, x]) => x.includes(c) && !exclude.some((e) => x.includes(e)));
    if (partial) return partial[0];
  }
  return null;
}

export function detectFormat(headers: string[]): Format {
  const h = new Set(headers.map(norm));
  if (h.has('itemization type') || (h.has('item') && h.has('employee') && h.has('gross sales'))) return 'square_items';
  if (h.has('staff name') && h.has('gross sales') && h.has('tip')) return 'square_transactions';
  if (h.has('team member') || h.has('sale number') || h.has('appointment reference')) return 'fresha';
  if (h.has('checkout date') || h.has('checkout by') || h.has('amount paid')) return 'vagaro';
  if (h.has('net sales') && h.has('total price') && h.has('tips')) return 'glossgenius';
  if ([...h].some((x) => x.includes('booksy'))) return 'booksy';
  return 'generic';
}

export function guessMapping(headers: string[]): Mapping {
  return {
    date: find(headers, ['date', 'checkout date', 'sale date', 'payment date', 'app date', 'appointment date', 'service date', 'day']),
    time: find(headers, ['time'], ['time zone', 'timezone', 'date time']),
    staff: find(headers, ['employee', 'staff name', 'team member', 'technician', 'tech', 'staff', 'provider', 'stylist', 'checkout by', 'service provider', 'worker', 'name']),
    service: find(headers, ['item', 'service', 'description', 'service name', 'item name', 'product', 'details', 'treatment']),
    price: find(headers, ['net sales', 'gross sales', 'price', 'service price', 'total price', 'amount paid', 'amount', 'sale price', 'subtotal', 'total', 'sales'], ['tax', 'tip', 'discount', 'commission']),
    tip: find(headers, ['tip', 'tips', 'gratuity', 'card tip', 'credit tip'], ['cash']),
    tipCash: find(headers, ['cash tip', 'cash tips']),
    method: find(headers, ['payment method', 'tender', 'payment type', 'card brand', 'method', 'transaction type', 'payment'], ['date', 'id', 'number']),
    externalId: find(headers, ['transaction id', 'payment id', 'sale number', 'payment number', 'ticket id', 'invoice', 'order id', 'appointment reference', 'id']),
    ticketNo: find(headers, ['ticket', 'ticket number', 'ticket no', 'sale number', 'invoice number', 'receipt']),
    qty: find(headers, ['qty', 'quantity'])
  };
}

export function parseMoneyCents(v: string | undefined | null): number | null {
  if (v === undefined || v === null) return null;
  let s = String(v).trim();
  if (!s) return 0;
  const neg = /^\(.*\)$/.test(s) || s.startsWith('-');
  s = s.replace(/[()$,\s]/g, '').replace(/^-/, '');
  if (!/^\d*(\.\d+)?$/.test(s) || s === '') return null;
  const c = Math.round(Number(s) * 100);
  return neg ? -c : c;
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };

/** Accepts 2026-10-05, 10/05/2026, 10/5/26, Oct 5 2026, 5 Oct 2026, with an optional trailing time. */
export function parseDate(v: string | undefined | null): { date: string; time: string | null } | null {
  if (!v) return null;
  const s = String(v).trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?)?/.exec(s);
  let y: number, mo: number, d: number, time: string | null = null;
  if (m) {
    [y, mo, d] = [+m[1], +m[2], +m[3]];
    if (m[4]) time = toHHMM(+m[4], +m[5], m[6]);
  } else if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?)?/.exec(s))) {
    [mo, d] = [+m[1], +m[2]];
    y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    if (m[4]) time = toHHMM(+m[4], +m[5], m[6]);
  } else if ((m = /^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})(?:[ ,]+(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?)?/.exec(s))) {
    mo = MONTHS[m[1].slice(0, 4).toLowerCase()] ?? MONTHS[m[1].slice(0, 3).toLowerCase()];
    [d, y] = [+m[2], +m[3]];
    if (!mo) return null;
    if (m[4]) time = toHHMM(+m[4], +m[5], m[6]);
  } else if ((m = /^(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{4})/.exec(s))) {
    mo = MONTHS[m[2].slice(0, 3).toLowerCase()];
    [d, y] = [+m[1], +m[3]];
    if (!mo) return null;
  } else return null;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { date: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`, time };
}

function toHHMM(h: number, m: number, ampm?: string): string {
  if (ampm) {
    const p = ampm.toLowerCase();
    if (p === 'pm' && h < 12) h += 12;
    if (p === 'am' && h === 12) h = 0;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function parseTime(v: string | undefined | null): string | null {
  if (!v) return null;
  const m = /(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?/.exec(String(v));
  if (!m) return null;
  return toHHMM(+m[1], +m[2], m[3]);
}

function methodOf(v: string | undefined): NormalizedTicket['paymentMethod'] {
  if (!v) return null;
  const s = v.toLowerCase();
  if (/cash/.test(s)) return 'cash';
  if (/card|visa|master|amex|discover|credit|debit|tap|chip|swipe|apple|google|online/.test(s)) return 'card';
  return 'other';
}

async function hashId(parts: string[]): Promise<string> {
  const data = new TextEncoder().encode(parts.join('|'));
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const buf = await subtle.digest('SHA-256', data);
    return 'h:' + Array.from(new Uint8Array(buf)).slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // very old browsers: fall back to the raw key
  return 'h:' + parts.join('|').slice(0, 120);
}

export interface NormalizeOptions {
  /** when the file has one tip column, treat it as card (default) or cash tips */
  tipsAre?: 'card' | 'cash' | 'by_method';
  /** skip rows whose service matches (e.g. retail products) */
  skipServicePattern?: RegExp;
  /** skip a raw row entirely (e.g. Square "Itemization Type" = Item) */
  skipRow?: (row: Record<string, string>) => boolean;
}

export interface NormalizeResult {
  tickets: NormalizedTicket[];
  skipped: { row: number; reason: string }[];
  staffNames: string[];
}

export async function normalizeRows(rows: Record<string, string>[], map: Mapping, opts: NormalizeOptions = {}): Promise<NormalizeResult> {
  const out: NormalizedTicket[] = [];
  const skipped: { row: number; reason: string }[] = [];
  const staff = new Set<string>();
  const tipsAre = opts.tipsAre ?? 'card';
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (opts.skipRow?.(r)) {
      skipped.push({ row: i + 2, reason: 'filtered' });
      continue;
    }
    if (!map.date || !map.staff || !map.price) {
      skipped.push({ row: i + 2, reason: 'mapping' });
      continue;
    }
    const dt = parseDate(r[map.date]);
    if (!dt) {
      skipped.push({ row: i + 2, reason: 'date' });
      continue;
    }
    const time = (map.time && parseTime(r[map.time])) || dt.time || '12:00';
    const staffName = (r[map.staff] ?? '').trim();
    if (!staffName) {
      skipped.push({ row: i + 2, reason: 'staff' });
      continue;
    }
    const price = parseMoneyCents(r[map.price]);
    if (price === null) {
      skipped.push({ row: i + 2, reason: 'price' });
      continue;
    }
    if (price < 0) {
      skipped.push({ row: i + 2, reason: 'refund' });
      continue;
    }
    const serviceName = (map.service ? r[map.service] : '')?.trim() || 'Service';
    if (opts.skipServicePattern && opts.skipServicePattern.test(serviceName)) {
      skipped.push({ row: i + 2, reason: 'filtered' });
      continue;
    }
    const qty = map.qty ? Math.max(1, Math.round(Number(r[map.qty]) || 1)) : 1;
    const method = methodOf(map.method ? r[map.method] : undefined);
    const tip = Math.max(0, (map.tip ? parseMoneyCents(r[map.tip]) : 0) ?? 0);
    const tipCashCol = Math.max(0, (map.tipCash ? parseMoneyCents(r[map.tipCash]) : 0) ?? 0);
    let tipCard = 0;
    let tipCash = tipCashCol;
    if (tipsAre === 'cash') tipCash += tip;
    else if (tipsAre === 'by_method' && method === 'cash') tipCash += tip;
    else tipCard += tip;
    const ext = (map.externalId ? r[map.externalId] : '')?.trim();
    const externalId = ext ? `${ext}:${i}` : await hashId([dt.date, time, staffName, serviceName, String(price), String(tip), String(i)]);
    staff.add(staffName);
    out.push({
      workDate: dt.date,
      time,
      staffName,
      serviceName: qty > 1 ? `${serviceName} ×${qty}` : serviceName,
      priceCents: price,
      tipCardCents: tipCard,
      tipCashCents: tipCash,
      paymentMethod: method,
      externalId,
      ticketNo: (map.ticketNo && map.ticketNo !== map.externalId ? r[map.ticketNo] : ext)?.trim() || null
    });
  }
  return { tickets: out, skipped, staffNames: [...staff].sort() };
}

/** Tolerant match of a POS staff name to a technician: exact, then first-name, then contains. */
export function matchStaff(name: string, workers: { id: string; displayName: string; legalName: string }[]): string | null {
  const n = norm(name);
  const exact = workers.find((w) => norm(w.displayName) === n || norm(w.legalName) === n);
  if (exact) return exact.id;
  const first = n.split(' ')[0];
  const byFirst = workers.filter((w) => norm(w.displayName).split(' ')[0] === first || norm(w.legalName).split(' ')[0] === first);
  if (byFirst.length === 1) return byFirst[0].id;
  const contains = workers.filter((w) => n.includes(norm(w.displayName)) || norm(w.legalName).includes(n));
  if (contains.length === 1) return contains[0].id;
  return null;
}
