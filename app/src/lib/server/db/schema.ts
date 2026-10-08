import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// All money is stored in integer cents. All timestamps are ISO-8601 strings in UTC
// (SQLite has no native datetime). Local-day calculations use the salon's timezone.

export const salons = sqliteTable('salons', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  state: text('state').notNull().default('NY'), // two-letter
  region: text('region'), // e.g. "NYC" for NY downstate; null = rest of state
  licenseNo: text('license_no'),
  address: text('address'),
  timezone: text('timezone').notNull().default('America/New_York'),
  workweekStart: integer('workweek_start').notNull().default(1), // 0=Sun..6=Sat
  payFrequency: text('pay_frequency').notNull().default('weekly'), // weekly | biweekly
  defaultLocale: text('default_locale').notNull().default('en'),
  tipCreditEnabled: integer('tip_credit_enabled', { mode: 'boolean' }).notNull().default(false),
  photoOnPunch: integer('photo_on_punch', { mode: 'boolean' }).notNull().default(true),
  kioskAutoClockIn: integer('kiosk_auto_clock_in', { mode: 'boolean' }).notNull().default(true), // PIN alone clocks in when the worker is out
  kioskShowTickets: integer('kiosk_show_tickets', { mode: 'boolean' }).notNull().default(true), // today's ticket count per technician on the tablet
  kioskSounds: integer('kiosk_sounds', { mode: 'boolean' }).notNull().default(false), // key clicks and success tones on the tablet
  kioskDimAfterClose: integer('kiosk_dim_after_close', { mode: 'boolean' }).notNull().default(false), // dark board after closing time
  closingTime: text('closing_time').notNull().default('19:30'), // usual closing time (HH:MM), offered when someone forgot to clock out
  setupDismissedAt: text('setup_dismissed_at'), // owner hid the setup checklist on Home
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  salonId: text('salon_id').notNull().references(() => salons.id),
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('owner'), // owner | manager | bookkeeper
  passwordHash: text('password_hash').notNull(),
  locale: text('locale').notNull().default('en'),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
}, (t) => [uniqueIndex('users_email_idx').on(t.email)]);

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), // sha256 of the cookie token
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
});

// A shared tablet paired with one salon. The cookie holds a token; we store its hash.
export const devices = sqliteTable('devices', {
  id: text('id').primaryKey(),
  salonId: text('salon_id').notNull().references(() => salons.id),
  name: text('name').notNull(),
  tokenHash: text('token_hash').notNull(),
  pairedByUserId: text('paired_by_user_id').references(() => users.id),
  lastSeenAt: text('last_seen_at'),
  revokedAt: text('revoked_at'),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
});

export const workers = sqliteTable('workers', {
  id: text('id').primaryKey(),
  salonId: text('salon_id').notNull().references(() => salons.id),
  displayName: text('display_name').notNull(), // what shows on the tablet, e.g. "Linh"
  legalName: text('legal_name').notNull(),
  address: text('address'),
  birthDate: text('birth_date'), // only required if under 19 (29 CFR 516.2(a)(3))
  occupation: text('occupation').notNull().default('Nail technician'),
  classification: text('classification').notNull().default('w2'), // w2 | 1099 (shown with a warning)
  sex: text('sex'), // 29 CFR 516.2(a)(3) asks for it; optional free text
  locale: text('locale').notNull().default('vi'),
  pinHash: text('pin_hash').notNull(),
  pinFailedCount: integer('pin_failed_count').notNull().default(0),
  pinLockedUntil: text('pin_locked_until'),
  // Pay basis
  payBasis: text('pay_basis').notNull().default('day_rate_plus_commission'),
  // hourly | day_rate | commission | day_rate_plus_commission | guarantee_or_commission
  hourlyRateCents: integer('hourly_rate_cents').notNull().default(0),
  dayRateCents: integer('day_rate_cents').notNull().default(0),
  commissionPct: integer('commission_pct').notNull().default(0), // whole percent, e.g. 60
  guaranteeCents: integer('guarantee_cents').notNull().default(0), // weekly guarantee for guarantee_or_commission
  hiredOn: text('hired_on'),
  endedOn: text('ended_on'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
}, (t) => [index('workers_salon_idx').on(t.salonId)]);

// One row per shift. tsOut null = still clocked in. Breaks live in a child table.
export const punches = sqliteTable('punches', {
  id: text('id').primaryKey(),
  salonId: text('salon_id').notNull().references(() => salons.id),
  workerId: text('worker_id').notNull().references(() => workers.id),
  workDate: text('work_date').notNull(), // local calendar date YYYY-MM-DD when the shift started
  tsIn: text('ts_in').notNull(),
  tsOut: text('ts_out'),
  photoInRef: text('photo_in_ref'),
  photoOutRef: text('photo_out_ref'),
  manualBreakMinutes: integer('manual_break_minutes').notNull().default(0), // owner-entered unpaid break
  source: text('source').notNull().default('tablet'), // tablet | owner | import
  deviceId: text('device_id'),
  note: text('note'),
  voidedAt: text('voided_at'),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
}, (t) => [index('punches_salon_date_idx').on(t.salonId, t.workDate), index('punches_worker_idx').on(t.workerId)]);

export const breaks = sqliteTable('breaks', {
  id: text('id').primaryKey(),
  punchId: text('punch_id').notNull().references(() => punches.id),
  tsStart: text('ts_start').notNull(),
  tsEnd: text('ts_end'),
  paid: integer('paid', { mode: 'boolean' }).notNull().default(false)
}, (t) => [index('breaks_punch_idx').on(t.punchId)]);

export const services = sqliteTable('services', {
  id: text('id').primaryKey(),
  salonId: text('salon_id').notNull().references(() => salons.id),
  nameEn: text('name_en').notNull(),
  nameVi: text('name_vi'),
  defaultPriceCents: integer('default_price_cents').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  active: integer('active', { mode: 'boolean' }).notNull().default(true)
}, (t) => [index('services_salon_idx').on(t.salonId)]);

export const tickets = sqliteTable('tickets', {
  id: text('id').primaryKey(),
  salonId: text('salon_id').notNull().references(() => salons.id),
  workerId: text('worker_id').notNull().references(() => workers.id),
  workDate: text('work_date').notNull(), // local date
  ts: text('ts').notNull(),
  ticketNo: text('ticket_no'), // the paper or POS ticket number
  serviceName: text('service_name').notNull(),
  priceCents: integer('price_cents').notNull(),
  tipCardCents: integer('tip_card_cents').notNull().default(0),
  tipCashCents: integer('tip_cash_cents').notNull().default(0),
  paymentMethod: text('payment_method'), // card | cash | other
  tipCardPaidOutAt: text('tip_card_paid_out_at'), // set when the card tip was handed over in cash
  source: text('source').notNull().default('manual'), // manual | csv:vagaro | csv:square | csv:fresha | csv:generic
  importBatchId: text('import_batch_id'),
  externalId: text('external_id'), // id from the POS export, used to skip duplicates
  voidedAt: text('voided_at'),
  voidReason: text('void_reason'),
  createdByUserId: text('created_by_user_id'),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
}, (t) => [
  index('tickets_salon_date_idx').on(t.salonId, t.workDate),
  index('tickets_worker_idx').on(t.workerId),
  uniqueIndex('tickets_external_idx').on(t.salonId, t.source, t.externalId)
]);

export const importBatches = sqliteTable('import_batches', {
  id: text('id').primaryKey(),
  salonId: text('salon_id').notNull().references(() => salons.id),
  format: text('format').notNull(),
  fileName: text('file_name'),
  rowCount: integer('row_count').notNull().default(0),
  importedCount: integer('imported_count').notNull().default(0),
  skippedCount: integer('skipped_count').notNull().default(0),
  unmatched: text('unmatched'), // JSON array of staff names we could not map
  createdByUserId: text('created_by_user_id'),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
});

export const payRuns = sqliteTable('pay_runs', {
  id: text('id').primaryKey(),
  salonId: text('salon_id').notNull().references(() => salons.id),
  periodStart: text('period_start').notNull(), // YYYY-MM-DD inclusive
  periodEnd: text('period_end').notNull(), // YYYY-MM-DD inclusive
  status: text('status').notNull().default('draft'), // draft | approved | paid
  approvedAt: text('approved_at'),
  approvedByUserId: text('approved_by_user_id'),
  paidOn: text('paid_on'),
  rulesSnapshot: text('rules_snapshot'), // JSON of the rule values used
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
}, (t) => [uniqueIndex('pay_runs_period_idx').on(t.salonId, t.periodStart)]);

export const payLines = sqliteTable('pay_lines', {
  id: text('id').primaryKey(),
  payRunId: text('pay_run_id').notNull().references(() => payRuns.id),
  workerId: text('worker_id').notNull().references(() => workers.id),
  // Inputs frozen at approval time
  payBasis: text('pay_basis').notNull(),
  hoursWorked: integer('hours_minutes').notNull(), // total minutes worked in the workweek
  daysWorked: integer('days_worked').notNull().default(0),
  salesCents: integer('sales_cents').notNull().default(0),
  // Computed
  baseCents: integer('base_cents').notNull().default(0), // day rate / hourly / guarantee portion
  commissionCents: integer('commission_cents').notNull().default(0),
  regularRateCents: integer('regular_rate_cents').notNull().default(0), // per hour, rounded to cent
  overtimeMinutes: integer('overtime_minutes').notNull().default(0),
  overtimePremiumCents: integer('overtime_premium_cents').notNull().default(0),
  minWageTopupCents: integer('min_wage_topup_cents').notNull().default(0),
  tipsCardCents: integer('tips_card_cents').notNull().default(0),
  tipsCashCents: integer('tips_cash_cents').notNull().default(0),
  deductionsCents: integer('deductions_cents').notNull().default(0),
  grossWagesCents: integer('gross_wages_cents').notNull().default(0), // wages excluding tips
  totalCents: integer('total_cents').notNull().default(0), // wages + card tips owed through payroll
  paidCashCents: integer('paid_cash_cents').notNull().default(0),
  paidCheckCents: integer('paid_check_cents').notNull().default(0),
  paidPayrollCents: integer('paid_payroll_cents').notNull().default(0),
  paidOn: text('paid_on'),
  version: integer('version').notNull().default(1),
  shareToken: text('share_token'),
  statementSentAt: text('statement_sent_at'), // when the owner last sent the statement to the technician
  statementSentVia: text('statement_sent_via'), // share | sms | copy
  flags: text('flags'), // JSON array of warning codes
  breakdown: text('breakdown') // JSON of the full calculation for the statement
}, (t) => [uniqueIndex('pay_lines_run_worker_idx').on(t.payRunId, t.workerId)]);

// Append-only edit trail. Never updated or deleted.
export const edits = sqliteTable('edits', {
  id: text('id').primaryKey(),
  salonId: text('salon_id').notNull(),
  entity: text('entity').notNull(), // punch | ticket | worker | pay_run | pay_line | salon
  entityId: text('entity_id').notNull(),
  action: text('action').notNull(), // create | update | void | approve | pay
  field: text('field'),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  reason: text('reason'),
  actorType: text('actor_type').notNull(), // user | device | worker | system
  actorId: text('actor_id'),
  actorName: text('actor_name'),
  ts: text('ts').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
}, (t) => [index('edits_salon_ts_idx').on(t.salonId, t.ts), index('edits_entity_idx').on(t.entity, t.entityId)]);

export type Salon = typeof salons.$inferSelect;
export type User = typeof users.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type Worker = typeof workers.$inferSelect;
export type Punch = typeof punches.$inferSelect;
export type Break = typeof breaks.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type PayRun = typeof payRuns.$inferSelect;
export type PayLine = typeof payLines.$inferSelect;
export type Edit = typeof edits.$inferSelect;
export type Service = typeof services.$inferSelect;

// Remembered CSV import choices per salon and source format, so a returning import needs no mapping.
export const importMappings = sqliteTable('import_mappings', {
  id: text('id').primaryKey(),
  salonId: text('salon_id').notNull().references(() => salons.id),
  format: text('format').notNull(),
  staffMap: text('staff_map').notNull().default('{}'), // JSON: staff name in the file -> worker id ('' = skip)
  columnMap: text('column_map'), // JSON Mapping, only when the owner changed the detected columns
  tipsAre: text('tips_are').notNull().default('by_method'),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
}, (t) => [uniqueIndex('import_mappings_salon_format_idx').on(t.salonId, t.format)]);
