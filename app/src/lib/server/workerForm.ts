import { z } from 'zod';
import { parseDollars } from '$lib/money';

export const WorkerSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  legalName: z.string().trim().min(1).max(120),
  address: z.string().trim().max(200).optional().default(''),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  occupation: z.string().trim().max(60).default('Nail technician'),
  sex: z.string().trim().max(20).optional().default(''),
  locale: z.enum(['en', 'vi']).default('vi'),
  classification: z.enum(['w2', '1099']).default('w2'),
  pin: z.string().regex(/^\d{4}$/).optional().or(z.literal('')),
  payBasis: z.enum(['hourly', 'day_rate', 'commission', 'day_rate_plus_commission', 'guarantee_or_commission']),
  hourlyRate: z.string().optional().default(''),
  dayRate: z.string().optional().default(''),
  commissionPct: z.coerce.number().int().min(0).max(100).default(0),
  guarantee: z.string().optional().default(''),
  hiredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  endedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  active: z.string().optional()
});

export function toWorkerValues(v: z.infer<typeof WorkerSchema>) {
  const hourlyRateCents = parseDollars(v.hourlyRate) ?? 0;
  const dayRateCents = parseDollars(v.dayRate) ?? 0;
  const guaranteeCents = parseDollars(v.guarantee) ?? 0;
  return {
    displayName: v.displayName,
    legalName: v.legalName,
    address: v.address || null,
    birthDate: v.birthDate || null,
    occupation: v.occupation || 'Nail technician',
    sex: v.sex || null,
    locale: v.locale,
    classification: v.classification,
    payBasis: v.payBasis,
    hourlyRateCents,
    dayRateCents,
    commissionPct: v.commissionPct,
    guaranteeCents,
    hiredOn: v.hiredOn || null,
    endedOn: v.endedOn || null,
    active: v.active === 'on' || v.active === 'true'
  };
}

/** Zod issues as message keys per field, shown under each control (R19). */
export function fieldErrors(issues: { path: PropertyKey[] }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? 'form');
    out[k] ??= k === 'pin' ? 'wk_pin_digits' : 'wk_required';
  }
  return out;
}
