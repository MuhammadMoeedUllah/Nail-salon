import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guard';
import { getRun, hydrateLine, computeSalonWeek } from '$lib/server/payrun';
import { gustoCsv, adpCsv, genericCsv } from '$lib/server/payrollExport';
import { weekEnd } from '$lib/time';

export const GET: RequestHandler = async (event) => {
  const { salon } = requireUser(event);
  const start = event.params.start;
  const format = event.url.searchParams.get('format') ?? 'generic';
  const run = await getRun(salon.id, start);
  const lines = run && run.status !== 'draft' ? run.lines.map(hydrateLine) : (await computeSalonWeek(salon, start)).lines;
  const end = weekEnd(start);
  const csv = format === 'gusto' ? gustoCsv(lines, start, end) : format === 'adp' ? adpCsv(lines) : genericCsv(lines, start, end);
  if (!csv && format !== 'generic') throw error(400);
  const name = `${salon.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${start}-${format}.csv`;
  return new Response('﻿' + csv, {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"` }
  });
};
