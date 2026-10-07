// Offline punch queue kept in localStorage. Entries hold the PIN only until they are sent.
export interface QueuedPunch {
  clientId: string;
  workerId: string;
  pin: string;
  action: 'in' | 'out' | 'break_start' | 'break_end';
  clientTs: string;
  photo: string | null;
}

const KEY = 'sp_punch_queue_v1';

export function readQueue(): QueuedPunch[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}
function writeQueue(q: QueuedPunch[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(q));
  } catch {
    /* storage full: drop photos */
    try {
      localStorage.setItem(KEY, JSON.stringify(q.map((e) => ({ ...e, photo: null }))));
    } catch {
      /* ignore */
    }
  }
}
export function enqueue(p: QueuedPunch) {
  const q = readQueue();
  q.push(p);
  writeQueue(q);
}

let flushing = false;
/** Try to send queued punches in order. Stops at the first network failure. */
export async function flushQueue(): Promise<number> {
  if (flushing) return 0;
  flushing = true;
  let sent = 0;
  try {
    let q = readQueue();
    while (q.length) {
      const e = q[0];
      let res: Response;
      try {
        res = await fetch('/kiosk/api/punch', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ...e, offline: true })
        });
      } catch {
        break; // still offline
      }
      // 2xx applied; 4xx (bad pin, state conflict) will never succeed: drop it so the queue does not jam
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        q.shift();
        writeQueue(q);
        if (res.ok) sent++;
      } else break;
    }
  } finally {
    flushing = false;
  }
  return sent;
}
