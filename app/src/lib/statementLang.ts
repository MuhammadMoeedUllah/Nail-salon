import type { Locale } from '$lib/i18n';

/** Statement language from ?lang=: both (default: the technician's language first), or one language only (UX-40). */
export function statementLangs(q: string | null, workerLocale: Locale): { lang: 'both' | 'vi' | 'en'; locale: Locale; second: Locale | null } {
  if (q === 'vi' || q === 'en') return { lang: q, locale: q, second: null };
  return { lang: 'both', locale: workerLocale, second: workerLocale === 'vi' ? 'en' : 'vi' };
}
