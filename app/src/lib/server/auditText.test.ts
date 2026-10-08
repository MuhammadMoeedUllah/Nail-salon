import { describe, expect, it } from 'vitest';
import { makeT } from '$lib/i18n';
import { describeEdit, type Ctx } from './auditText';

const ctx = (locale: 'en' | 'vi'): Ctx => ({
  t: makeT(locale),
  locale,
  tz: 'America/New_York',
  worker: new Map([['w1', 'Linh']]),
  punch: new Map([['p1', { workerId: 'w1', workDate: '2026-10-01' }]]),
  ticket: new Map([['t1', { workerId: 'w1', workDate: '2026-10-01', serviceName: 'Pedicure', priceCents: 4000 }]]),
  line: new Map([['l1', { workerId: 'w1', periodStart: '2026-09-28' }]]),
  run: new Map([['r1', { periodStart: '2026-09-28' }]])
});
const row = (o: Partial<Parameters<typeof describeEdit>[0]>) => ({ entity: 'punch', entityId: 'p1', action: 'update', field: null, oldValue: null, newValue: null, actorType: 'user', actorName: 'Tina', ...o });

describe('describeEdit', () => {
  it('a clock-out fixed by the owner reads as a sentence with times', () => {
    const r = describeEdit(row({ field: 'tsOut', oldValue: '2026-10-01T22:00:00.000Z', newValue: '2026-10-01T23:30:00.000Z' }), ctx('en'));
    expect(r.text).toBe("Tina changed Linh's clock-out on Thu, Oct 1: 6:00 PM → 7:30 PM");
    expect(r.group).toBe('hours');
    expect(r.workerId).toBe('w1');
  });
  it('a tablet clock-in names the technician, not the device', () => {
    const r = describeEdit(row({ action: 'create', field: 'ts_in', newValue: '2026-10-01T13:05:00.000Z', actorType: 'worker', actorName: 'Linh' }), ctx('en'));
    expect(r.text).toBe('Linh clocked in at 9:05 AM on Thu, Oct 1');
  });
  it('pay plan changes use the salon words, in Vietnamese too', () => {
    const r = describeEdit(row({ entity: 'worker', entityId: 'w1', field: 'payBasis', oldValue: 'commission', newValue: 'guarantee_or_commission' }), ctx('vi'));
    expect(r.text).toBe('Tina sửa cách trả lương của Linh: Chỉ ăn chia → Bao lương');
  });
  it('money fields are dollars and voided tickets keep the service', () => {
    expect(describeEdit(row({ entity: 'worker', entityId: 'w1', field: 'guaranteeCents', oldValue: '80000', newValue: '90000' }), ctx('en')).text).toBe("Tina changed Linh's weekly guarantee: $800 → $900");
    expect(describeEdit(row({ entity: 'ticket', entityId: 't1', action: 'void', oldValue: JSON.stringify({ service: 'Pedicure', price: 4000 }) }), ctx('en')).text).toBe("Tina voided Linh's ticket: Pedicure, $40");
  });
  it('salon switches read as on and off; unknown edits still say something', () => {
    expect(describeEdit(row({ entity: 'salon', entityId: 's', field: 'kioskSounds', oldValue: 'false', newValue: 'true' }), ctx('en')).text).toBe('Tina changed the tablet sounds: off → on');
    expect(describeEdit(row({ entity: 'pay_line', entityId: 'l1', action: 'mystery' }), ctx('en')).text).toBe('Tina: pay_line mystery');
  });
});
