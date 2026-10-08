import raw from './rules.json';
import type { RuleSet } from '$lib/pay/engine';

export interface RuleEntry {
  jurisdiction: string;
  region: string | null;
  key: string;
  value: number | string;
  unit: string;
  effective_from: string;
  effective_to: string | null;
  source_url: string;
  source_title: string;
  checked_on: string;
}

export const RULES: RuleEntry[] = (raw as { entries: RuleEntry[] }).entries;

export const STATES: { code: string; name: string; tz: string }[] = [
  { code: 'NY', name: 'New York', tz: 'America/New_York' },
  { code: 'CT', name: 'Connecticut', tz: 'America/New_York' },
  { code: 'RI', name: 'Rhode Island', tz: 'America/New_York' },
  { code: 'NJ', name: 'New Jersey', tz: 'America/New_York' },
  { code: 'MA', name: 'Massachusetts', tz: 'America/New_York' },
  { code: 'PA', name: 'Pennsylvania', tz: 'America/New_York' },
  { code: 'VA', name: 'Virginia', tz: 'America/New_York' },
  { code: 'NC', name: 'North Carolina', tz: 'America/New_York' },
  { code: 'GA', name: 'Georgia', tz: 'America/New_York' },
  { code: 'FL', name: 'Florida', tz: 'America/New_York' },
  { code: 'IL', name: 'Illinois', tz: 'America/Chicago' },
  { code: 'TX', name: 'Texas', tz: 'America/Chicago' },
  { code: 'CA', name: 'California', tz: 'America/Los_Angeles' },
  { code: 'WA', name: 'Washington', tz: 'America/Los_Angeles' }
];

export const REGIONS: Record<string, { code: string; name: string }[]> = {
  NY: [
    { code: 'NYC', name: 'New York City, Long Island or Westchester' },
    { code: 'REST', name: 'Rest of New York State' }
  ],
  IL: [
    { code: 'CHI', name: 'City of Chicago' },
    { code: 'REST', name: 'Rest of Illinois' }
  ]
};

export function regionsFor(state: string) {
  return REGIONS[state] ?? [];
}

export function defaultTimezone(state: string) {
  return STATES.find((s) => s.code === state)?.tz ?? 'America/New_York';
}

function pick(entries: RuleEntry[], key: string, date: string): RuleEntry | undefined {
  return entries
    .filter((e) => e.key === key && e.effective_from <= date && (!e.effective_to || e.effective_to >= date))
    .sort((a, b) => (a.effective_from < b.effective_from ? 1 : -1))[0];
}

/** Find a rule: region-specific entry first, then state-wide, then federal. */
export function findRule(state: string, region: string | null | undefined, key: string, date: string): RuleEntry | undefined {
  const st = RULES.filter((e) => e.jurisdiction === state);
  const reg = region && region !== 'REST' ? pick(st.filter((e) => e.region === region), key, date) : undefined;
  if (reg) return reg;
  const stateWide = pick(st.filter((e) => e.region === null), key, date);
  if (stateWide) return stateWide;
  return pick(RULES.filter((e) => e.jurisdiction === 'US'), key, date);
}

/** Build the RuleSet the pay engine needs for a salon on a given date (the workweek start). */
export function ruleSetFor(state: string, region: string | null | undefined, date: string): RuleSet & { entries: RuleEntry[] } {
  const stateMin = findRule(state, region, 'min_wage', date);
  const fedMin = findRule('US', null, 'min_wage', date);
  // The higher of state/local and federal applies.
  const minEntry = stateMin && fedMin ? (Number(stateMin.value) >= Number(fedMin.value) ? stateMin : fedMin) : (stateMin ?? fedMin);
  const otWeekly = findRule(state, region, 'ot_weekly_threshold_hours', date);
  const otDaily = findRule(state, region, 'ot_daily_threshold_hours', date);
  const dtDaily = findRule(state, region, 'dt_daily_threshold_hours', date);
  const spread = findRule(state, region, 'spread_of_hours', date);
  const entries = [minEntry, otWeekly, otDaily, dtDaily, spread].filter(Boolean) as RuleEntry[];
  return {
    jurisdiction: region && region !== 'REST' ? `${state}-${region}` : state,
    minWageCents: Number(minEntry?.value ?? 725),
    otWeeklyThresholdMinutes: Number(otWeekly?.value ?? 40) * 60,
    otDailyThresholdMinutes: otDaily && otDaily.jurisdiction === state ? Number(otDaily.value) * 60 : null,
    dtDailyThresholdMinutes: dtDaily && dtDaily.jurisdiction === state ? Number(dtDaily.value) * 60 : null,
    spreadOfHours: !!spread && spread.jurisdiction === state && Number(spread.value) === 1,
    otPremiumMultiplier: 0.5,
    tipCreditCents: 0,
    sources: entries.map((e) => ({ key: e.key, url: e.source_url, title: e.source_title, effectiveFrom: e.effective_from })),
    entries
  };
}

export function retentionYears(state: string, date: string): number {
  return Number(findRule(state, null, 'record_retention_years', date)?.value ?? 3);
}
