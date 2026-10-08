import { postAction } from '$lib/ui/actions';

/**
 * Send a statement link through the phone's share sheet (Messages, Zalo, WhatsApp...), falling back to copying the link.
 * Records how it went out on the week's send page (UX-39). Returns the channel used, or null if cancelled.
 */
export async function sendStatement(o: { start: string; lineId: string; url: string; title: string; text: string }): Promise<'share' | 'copy' | null> {
  let via: 'share' | 'copy' | null = null;
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: o.title, text: o.text, url: o.url });
      via = 'share';
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return null;
    }
  }
  if (!via) {
    try {
      await navigator.clipboard.writeText(`${o.text}\n${o.url}`);
      via = 'copy';
    } catch {
      return null;
    }
  }
  await postAction(`/app/pay/${o.start}/send?/markSent`, { lineId: o.lineId, via });
  return via;
}

/** sms: link with the message body (iOS and Android both read `?&body=`). */
export function smsHref(text: string, url: string) {
  return `sms:?&body=${encodeURIComponent(`${text}\n${url}`)}`;
}
