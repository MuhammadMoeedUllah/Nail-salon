import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { computeSalonWeek, getRun, hydrateLine } from '$lib/server/payrun';
import { weekEnd, localDate, nowIso } from '$lib/time';
import { signShare } from '$lib/server/auth';
import { statementLangs } from '$lib/statementLang';

export const load: PageServerLoad = async (event) => {
  const { salon, locale } = requireUser(event);
  const { start, workerId } = event.params;
  const run = await getRun(salon.id, start);
  let line: any = null;
  let status = 'draft';
  let shareToken: string | null = null;
  if (run && run.status !== 'draft') {
    const l = run.lines.find((x) => x.workerId === workerId);
    if (!l) throw error(404);
    line = hydrateLine(l);
    status = run.status;
    shareToken = signShare(l.id);
  } else {
    const c = await computeSalonWeek(salon, start);
    line = c.lines.find((x) => x.worker.id === workerId);
    if (!line) throw error(404);
  }
  const langs = statementLangs(event.url.searchParams.get('lang'), (line.worker.locale as 'en' | 'vi') || locale);
  return {
    ...langs,
    uiLocale: locale,
    lineId: run && run.status !== 'draft' ? (run.lines.find((x) => x.workerId === workerId)?.id ?? null) : null,
    salon: { name: salon.name, address: salon.address, licenseNo: salon.licenseNo, state: salon.state },
    tz: salon.timezone,
    line,
    period: { start, end: weekEnd(start) },
    status,
    shareToken,
    generatedOn: localDate(nowIso(), salon.timezone)
  };
};
