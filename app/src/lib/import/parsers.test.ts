import { describe, it, expect } from 'vitest';
import { parseCsv, detectFormat, guessMapping, normalizeRows, parseDate, parseMoneyCents, matchStaff } from './parsers';

const SQUARE_ITEMS = `Date,Time,Time Zone,Category,Item,Qty,Price Point Name,SKU,Modifiers Applied,Gross Sales,Discounts,Net Sales,Tax,Transaction ID,Payment ID,Device Name,Notes,Details,Event Type,Location,Dining Option,Customer ID,Customer Name,Customer Reference ID,Unit,Count,Itemization Type,Commission,Employee
2026-10-05,10:15:00,Eastern Time (US & Canada),Nails,Gel Manicure,1,Regular,,,"$45.00","$0.00","$45.00","$0.00",ABC123,PAY1,iPad,,,Payment,Main,,,,,,1,Service,"$27.00",Linh Nguyen
2026-10-05,11:40:00,Eastern Time (US & Canada),Nails,Pedicure,1,Regular,,,"$40.00","$0.00","$40.00","$0.00",ABC124,PAY2,iPad,,,Payment,Main,,,,,,1,Service,"$24.00",Mai Tran
2026-10-05,12:00:00,Eastern Time (US & Canada),Retail,Cuticle Oil,1,Regular,,,"$12.00","$0.00","$12.00","$1.06",ABC125,PAY3,iPad,,,Payment,Main,,,,,,1,Item,"$0.00",Mai Tran
2026-10-05,13:00:00,Eastern Time (US & Canada),Nails,Gel Manicure,1,Regular,,,"-$45.00","$0.00","-$45.00","$0.00",ABC126,PAY4,iPad,,,Refund,Main,,,,,,1,Service,"$0.00",Linh Nguyen`;

const SQUARE_TX = `Date,Time,Time Zone,Gross Sales,Discounts,Service Charges,Net Sales,Gift Card Sales,Tax,Tip,Partial Refunds,Total Collected,Source,Card,Card Entry Methods,Cash,Square Gift Card,Other Tender,Other Tender Type,Other Tender Note,Fees,Net Total,Transaction ID,Payment ID,Card Brand,PAN Suffix,Device Name,Staff Name,Staff ID,Details,Description,Event Type,Location,Dining Option,Customer ID,Customer Name,Customer Reference ID,Device Nickname,Third Party Fees,Deposit ID,Deposit Date,Deposit Details,Fee Percentage Rate,Fee Fixed Rate,Refund Reason,Discount Name,Transaction Status,Cash App,Order Reference ID,Fulfillment Note
10/05/2026,2:30:00 PM,Eastern Time (US & Canada),$60.00,$0.00,$0.00,$60.00,$0.00,$0.00,$10.00,$0.00,$70.00,Point of Sale,$70.00,Tapped,$0.00,$0.00,$0.00,,,-$1.85,$68.15,TX900,PM900,Visa,1234,iPad,Linh Nguyen,S1,,Acrylic Full Set,Payment,Main,,,,,,,,,,,,,,Complete,,,`;

const FRESHA = `Date,Team member,Client,Item,Item type,Sale price,Commission rate,Commission
"Oct 5, 2026",Linh,Jane D.,Gel Manicure,Service,$45.00,60%,$27.00
"Oct 5, 2026",Mai,Ann K.,Pedicure,Service,$40.00,60%,$24.00`;

const GENERIC = `Day,Tech,Service,Price,Tip,Payment
10/5/26,Linh,Dip powder,50,8,Visa
10/5/26,Linh,Polish change,15,0,Cash
10/6/26,Hoa,Pedicure,40,5,cash`;

describe('import parsers', () => {
  it('parses money and dates', () => {
    expect(parseMoneyCents('$1,234.56')).toBe(123456);
    expect(parseMoneyCents('(45.00)')).toBe(-4500);
    expect(parseMoneyCents('-$45.00')).toBe(-4500);
    expect(parseMoneyCents('abc')).toBeNull();
    expect(parseDate('2026-10-05')).toEqual({ date: '2026-10-05', time: null });
    expect(parseDate('10/5/26 2:30 PM')).toEqual({ date: '2026-10-05', time: '14:30' });
    expect(parseDate('Oct 5, 2026')).toEqual({ date: '2026-10-05', time: null });
    expect(parseDate('5 Oct 2026')?.date).toBe('2026-10-05');
  });

  it('detects Square Items Detail, skips refunds and retail, keeps employee', async () => {
    const { headers, rows } = parseCsv(SQUARE_ITEMS);
    expect(detectFormat(headers)).toBe('square_items');
    const map = guessMapping(headers);
    expect(map.staff).toBe('Employee');
    expect(map.service).toBe('Item');
    expect(map.price).toBe('Net Sales');
    const r = await normalizeRows(rows, map, { skipServicePattern: /^$/ });
    expect(r.tickets).toHaveLength(3); // refund skipped
    expect(r.skipped.map((s) => s.reason)).toContain('refund');
    expect(r.tickets[0]).toMatchObject({ workDate: '2026-10-05', time: '10:15', staffName: 'Linh Nguyen', serviceName: 'Gel Manicure', priceCents: 4500, tipCardCents: 0 });
    expect(r.staffNames).toEqual(['Linh Nguyen', 'Mai Tran']);
  });

  it('detects Square Transactions with tips and staff', async () => {
    const { headers, rows } = parseCsv(SQUARE_TX);
    expect(detectFormat(headers)).toBe('square_transactions');
    const map = guessMapping(headers);
    expect(map.staff).toBe('Staff Name');
    expect(map.tip).toBe('Tip');
    const r = await normalizeRows(rows, map);
    expect(r.tickets[0]).toMatchObject({ workDate: '2026-10-05', time: '14:30', priceCents: 6000, tipCardCents: 1000, serviceName: 'Acrylic Full Set', paymentMethod: 'card' });
    expect(r.tickets[0].externalId).toMatch(/^(PM900|TX900)/);
  });

  it('detects Fresha commission activity', async () => {
    const { headers, rows } = parseCsv(FRESHA);
    expect(detectFormat(headers)).toBe('fresha');
    const map = guessMapping(headers);
    expect(map.staff).toBe('Team member');
    expect(map.price).toBe('Sale price');
    const r = await normalizeRows(rows, map);
    expect(r.tickets).toHaveLength(2);
    expect(r.tickets[1]).toMatchObject({ staffName: 'Mai', priceCents: 4000 });
  });

  it('handles a generic sheet and splits tips by payment method', async () => {
    const { headers, rows } = parseCsv(GENERIC);
    expect(detectFormat(headers)).toBe('generic');
    const map = guessMapping(headers);
    expect(map).toMatchObject({ date: 'Day', staff: 'Tech', service: 'Service', price: 'Price', tip: 'Tip', method: 'Payment' });
    const r = await normalizeRows(rows, map, { tipsAre: 'by_method' });
    expect(r.tickets[0]).toMatchObject({ priceCents: 5000, tipCardCents: 800, tipCashCents: 0 });
    expect(r.tickets[2]).toMatchObject({ workDate: '2026-10-06', tipCardCents: 0, tipCashCents: 500, paymentMethod: 'cash' });
    // hashed ids are stable per row content
    const again = await normalizeRows(rows, map, { tipsAre: 'by_method' });
    expect(again.tickets[0].externalId).toBe(r.tickets[0].externalId);
  });

  it('Square transactions without a payment-method column infer tender from Cash/Card amounts', async () => {
    const csv = `Date,Time,Gross Sales,Net Sales,Tip,Card,Cash,Transaction ID,Staff Name,Description
2026-10-05,10:00:00,$40.00,$40.00,$0.00,$0.00,$40.00,T1,Hoa,Pedicure
2026-10-05,11:00:00,$45.00,$45.00,$9.00,$54.00,$0.00,T2,Hoa,Gel Manicure`;
    const { headers, rows } = parseCsv(csv);
    const map = guessMapping(headers);
    expect(map.method).toBeNull();
    const r = await normalizeRows(rows, map, { tipsAre: 'by_method' });
    expect(r.tickets[0].paymentMethod).toBe('cash');
    expect(r.tickets[1]).toMatchObject({ paymentMethod: 'card', tipCardCents: 900 });
  });

  it('recognises Vagaro combined checkout header and service provider sheets', async () => {
    const h1 = parseCsv(`Checkout Date / Checkout By / Transaction ID,App. Date / Customer,Service Provider,Service,Tip,Discount,Amount Paid,Sales Tax
"10/05/2026 / Tina / 88811","10/05/2026 / Jane D.",Linh,Gel Manicure,$8.00,$0.00,$45.00,$0.00`);
    expect(detectFormat(h1.headers)).toBe('vagaro');
    const map = guessMapping(h1.headers);
    expect(map.staff).toBe('Service Provider');
    expect(map.price).toBe('Amount Paid');
    const r = await normalizeRows(h1.rows, map);
    expect(r.tickets[0]).toMatchObject({ workDate: '2026-10-05', staffName: 'Linh', priceCents: 4500, tipCardCents: 800 });
  });

  it('flags period summaries that are not per-sale records', () => {
    const { headers } = parseCsv(`Team member,Sales qty,Items sold,Gross sales,Commission base,Commission,% Commission
Linh,23,23,$1,535.00,$1,535.00,$921.00,60%`);
    expect(detectFormat(headers)).toBe('summary_unsupported');
  });

  it('matches staff names to technicians', () => {
    const ws = [
      { id: 'a', displayName: 'Linh', legalName: 'Linh Thi Nguyen' },
      { id: 'b', displayName: 'Mai', legalName: 'Mai Tran' },
      { id: 'c', displayName: 'Hoa', legalName: 'Hoa Pham' }
    ];
    expect(matchStaff('Linh Nguyen', ws)).toBe('a');
    expect(matchStaff('mai', ws)).toBe('b');
    expect(matchStaff('Mai Tran', ws)).toBe('b');
    expect(matchStaff('Kim', ws)).toBeNull();
  });
});
