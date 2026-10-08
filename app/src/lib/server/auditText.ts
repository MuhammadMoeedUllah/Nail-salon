// The edit trail as sentences people can read (UX-50): "Tina changed Linh's clock-out on Thu, Oct 1: 6:00 PM → 7:30 PM".
// Raw ids and values stay available behind "Details" on the page and in the binder export.
import type { makeT, MessageKey } from '$lib/i18n';
import { fmtClock, fmtDate, fmtDateYear, fmtWall } from '$lib/time';
import { money } from '$lib/workers/basis';

type T = ReturnType<typeof makeT>;
export type EditRow = {
  entity: string;
  entityId: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  actorType: string;
  actorName: string | null;
};
export type Group = 'hours' | 'tickets' | 'team' | 'pay' | 'salon';
export type Ctx = {
  t: T;
  locale: 'en' | 'vi';
  tz: string;
  worker: Map<string, string>;
  punch: Map<string, { workerId: string; workDate: string }>;
  ticket: Map<string, { workerId: string; workDate: string; serviceName: string; priceCents: number }>;
  line: Map<string, { workerId: string; periodStart: string }>;
  run: Map<string, { periodStart: string }>;
};

const GROUP: Record<string, Group> = { punch: 'hours', ticket: 'tickets', worker: 'team', pay_run: 'pay', pay_line: 'pay', salon: 'salon', device: 'salon', import: 'salon' };

function parse(v: string | null): any {
  if (v === null || v === undefined) return null;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}
const truthy = (v: unknown) => v === true || v === 'true' || v === 1 || v === '1';

function value(field: string, v: unknown, c: Ctx): string {
  const { t } = c;
  if (v === null || v === undefined || v === '') return t('ae_empty');
  if (/Cents$/.test(field)) return money(Number(v));
  switch (field) {
    case 'commissionPct':
      return `${v}%`;
    case 'payBasis':
      return t(`wk_t_${v}` as MessageKey);
    case 'locale':
    case 'defaultLocale':
      return v === 'vi' ? 'Tiếng Việt' : 'English';
    case 'workweekStart':
      return t(`weekday_${v}` as MessageKey);
    case 'classification':
      return v === '1099' ? '1099' : 'W-2';
    case 'birthDate':
    case 'hiredOn':
    case 'endedOn':
      return /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? fmtDateYear(String(v), c.locale) : String(v);
    case 'closingTime':
      return fmtWall(String(v), c.locale);
    case 'tsIn':
    case 'tsOut':
      return fmtClock(String(v), c.tz, c.locale);
    case 'manualBreakMinutes':
      return `${v} min`;
    case 'active':
    case 'photoOnPunch':
    case 'kioskAutoClockIn':
    case 'kioskShowTickets':
    case 'kioskSounds':
    case 'kioskDimAfterClose':
    case 'tipCreditEnabled':
      return truthy(v) ? t('ae_on') : t('ae_off');
  }
  return String(v);
}

/** One sentence per edit, in the reader's language, plus the technician it concerns (for the filter). */
export function describeEdit(e: EditRow, c: Ctx): { text: string; group: Group; workerId: string | null } {
  const { t, locale } = c;
  const actor = e.actorName ?? (e.actorType === 'device' ? t('ae_tablet') : e.actorType === 'system' ? t('ae_system') : t('ae_someone'));
  const oldV = parse(e.oldValue);
  const newV = parse(e.newValue);
  const group = GROUP[e.entity] ?? 'salon';
  const day = (d: string | undefined) => (d ? fmtDate(d, locale) : '');
  const clock = (iso: unknown) => (typeof iso === 'string' && iso ? fmtClock(iso, c.tz, locale) : t('ae_empty'));
  const nameOf = (id: string | undefined | null) => (id ? (c.worker.get(id) ?? t('ae_someone')) : t('ae_someone'));
  const fieldLabel = (f: string) => {
    const k = `fl_${f}` as MessageKey;
    const s = t(k);
    return s === k ? f : s;
  };
  const out = (key: MessageKey, params: Record<string, string | number>, workerId: string | null = null) => ({ text: t(key, { actor, ...params }), group, workerId });

  switch (e.entity) {
    case 'punch': {
      const p = c.punch.get(e.entityId);
      const name = nameOf(p?.workerId) ;
      const w = p?.workerId ?? null;
      const d = day(p?.workDate);
      if (e.action === 'create' && e.field === 'ts_in') return out('ae_clock_in', { name, time: clock(newV), day: d }, w);
      if (e.action === 'create') return out('ae_shift_added', { name: newV?.worker ?? name, day: d, from: clock(newV?.tsIn), to: clock(newV?.tsOut) }, w);
      if (e.action === 'void') return out('ae_shift_deleted', { name, day: d }, w);
      if (e.field === 'break_start') return out('ae_break_start', { name, time: clock(newV), day: d }, w);
      if (e.field === 'break_end') return out('ae_break_end', { name, time: clock(newV), day: d }, w);
      if (e.field === 'ts_out') {
        if (newV === null) return out('ae_clock_out_undone', { name, day: d }, w);
        if (e.actorType === 'worker' || e.actorType === 'device') return out('ae_clock_out', { name, time: clock(newV), day: d }, w);
        return out('ae_clock_out_set', { name, day: d, time: clock(newV) }, w);
      }
      if (e.field === 'tsIn' || e.field === 'tsOut' || e.field === 'manualBreakMinutes') {
        const what = t(e.field === 'tsIn' ? 'ae_w_clock_in' : e.field === 'tsOut' ? 'ae_w_clock_out' : 'ae_w_break');
        return out('ae_shift_changed', { name, what, day: d, from: value(e.field, oldV, c), to: value(e.field, newV, c) }, w);
      }
      break;
    }
    case 'ticket': {
      if (e.field === 'tip_card_paid_out') {
        const [wid, date] = e.entityId.split(':');
        const name = wid === '*' ? t('au_tech_all') : nameOf(wid);
        return Number(newV) > 0 ? out('ae_tips_paid', { name, amount: money(Number(newV)), day: day(date) }, wid === '*' ? null : wid) : out('ae_tips_unpaid', { name, day: day(date) }, wid === '*' ? null : wid);
      }
      const tk = c.ticket.get(e.entityId);
      const name = nameOf(tk?.workerId);
      const w = tk?.workerId ?? null;
      if (e.action === 'create') return out('ae_ticket_added', { name: newV?.worker ?? name, service: newV?.service ?? tk?.serviceName ?? '', amount: money(Number(newV?.price ?? tk?.priceCents ?? 0)) }, w);
      if (e.action === 'void') return out('ae_ticket_voided', { name, service: oldV?.service ?? tk?.serviceName ?? '', amount: money(Number(oldV?.price ?? tk?.priceCents ?? 0)) }, w);
      if (e.field === 'voided') return out('ae_ticket_restored', { name, service: tk?.serviceName ?? '' }, w);
      break;
    }
    case 'worker': {
      const name = c.worker.get(e.entityId) ?? newV?.displayName ?? t('ae_someone');
      const w = e.entityId;
      if (e.action === 'create') return out('ae_worker_added', { name }, w);
      if (e.field === 'active') return out(truthy(newV) ? 'ae_worker_on' : 'ae_worker_off', { name }, w);
      if (e.field === 'pin') return out('ae_worker_pin', { name }, w);
      if (e.field === 'pin_lock') return out('ae_worker_unlock', { name }, w);
      if (e.field) return out('ae_worker_changed', { name, what: fieldLabel(e.field), from: value(e.field, oldV, c), to: value(e.field, newV, c) }, w);
      break;
    }
    case 'pay_run': {
      const week = day(c.run.get(e.entityId)?.periodStart);
      if (e.action === 'approve') return out('ae_week_approved', { week });
      if (e.action === 'pay') return out('ae_week_paid', { week });
      if (e.action === 'reopen') return out('ae_week_reopened', { week });
      break;
    }
    case 'pay_line': {
      const l = c.line.get(e.entityId);
      const name = nameOf(l?.workerId);
      const week = day(l?.periodStart);
      const w = l?.workerId ?? null;
      if (e.action === 'approve') return out('ae_line_approved', { name, week, amount: money(Number(newV ?? 0)) }, w);
      if (e.action === 'pay') return out('ae_line_paid', { name, week }, w);
      if (e.field === 'statement_sent') return out('ae_line_sent', { name, week }, w);
      break;
    }
    case 'salon': {
      if (e.field === 'service') {
        const v = newV ?? oldV;
        return out(e.action === 'create' ? 'ae_service_added' : 'ae_service_changed', { service: v?.name ?? '' });
      }
      if (e.field === 'service_shown') return out(truthy(newV?.shown) ? 'ae_service_shown' : 'ae_service_hidden', { service: newV?.name ?? '' });
      if (e.field === 'user') {
        if (e.action === 'create') return out('ae_login_added', { name: newV?.name ?? '', role: t(`se_role_${newV?.role ?? 'manager'}` as MessageKey) });
        return out('ae_login_removed', { name: oldV?.name ?? '' });
      }
      if (e.action === 'create') return out('ae_salon_created', {});
      if (e.field) return out('ae_salon_changed', { what: fieldLabel(e.field), from: value(e.field, oldV, c), to: value(e.field, newV, c) });
      break;
    }
    case 'device':
      if (e.action === 'create') return out('ae_device_paired', { device: String(newV ?? '') });
      if (e.action === 'revoke') return out('ae_device_unpaired', { device: String(oldV ?? '') });
      break;
    case 'import':
      return out('ae_import', { n: Number(newV?.imported ?? 0), file: String(newV?.file ?? newV?.format ?? '') });
  }
  return out('ae_other', { entity: e.entity, action: [e.action, e.field].filter(Boolean).join(' ') });
}
