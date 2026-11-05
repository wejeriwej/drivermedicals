import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const emailCode = source.slice(source.indexOf('async function sendAppointmentEmails('), source.indexOf('const confirmationTasks'));
const appointment = { email: 'customer@example.com', paidAmount: 500, remainingAmount: 3800 };
function emailHarness(failRecipient) {
  const calls = [];
  const stored = {};
  const context = vm.createContext({
    console: { error() {} }, bookingAdminEmails: ['admin@example.com'],
    sendBookingEmail: async ({ to }) => { calls.push(to); if (to === failRecipient || (Array.isArray(to) && failRecipient === 'admin')) throw new Error('Provider unavailable'); },
    escapeHtml: value => String(value || ''), displayAppointmentDate: () => '',
    getRecordsGuidance: () => ({}), bookingEmailHtml: () => '', parkingNoticeHtml: () => '',
    recordsRequirementHtml: () => '', appointmentChecklistHtml: () => '', recordsRequestHtml: () => ''
  });
  vm.runInContext(emailCode, context);
  return { calls, stored, send: data => context.sendAppointmentEmails(data, { update: async values => Object.assign(stored, values) }) };
}
test('admin is attempted even if customer email fails', async () => {
  const h = emailHarness(appointment.email);
  assert.equal(await h.send(appointment), false);
  assert.equal(h.calls.length, 2);
  assert.equal(h.stored.adminConfirmationEmailSent, true);
  assert.equal(h.stored.customerConfirmationEmailSent, undefined);
});
test('admin failure is retryable without resending customer confirmation', async () => {
  const first = emailHarness('admin');
  assert.equal(await first.send(appointment), false);
  const retry = emailHarness();
  assert.equal(await retry.send({ ...appointment, ...first.stored }), true);
  assert.equal(retry.calls.length, 1);
  assert.ok(Array.isArray(retry.calls[0]));
});
test('successful deliveries are not repeated', async () => {
  const h = emailHarness();
  assert.equal(await h.send({ ...appointment, customerConfirmationEmailSent: true, adminConfirmationEmailSent: true }), true);
  assert.equal(h.calls.length, 0);
});
test('unpaid holds expire without releasing confirmed bookings', () => {
  const code = source.slice(source.indexOf('function appointmentBlocksSlot('), source.indexOf('function escapeHtml('));
  const context = vm.createContext({ Date });
  vm.runInContext(code, context);
  assert.equal(context.appointmentBlocksSlot({ status: 'payment_pending', expiresAt: { toMillis: () => Date.now() - 1 } }), false);
  assert.equal(context.appointmentBlocksSlot({ status: 'payment_pending', expiresAt: { toMillis: () => Date.now() + 60000 } }), true);
  assert.equal(context.appointmentBlocksSlot({ status: 'confirmed' }), true);
});

test('appointment slots run every 30 minutes from 9am through 10pm', () => {
  const code = source.slice(source.indexOf('function appointmentTimeSlots('), source.indexOf('function dateKey('));
  const context = vm.createContext({});
  vm.runInContext(code, context);
  const slots = [...context.appointmentTimeSlots()];
  assert.equal(slots.length, 27);
  assert.equal(slots[0], '9:00am');
  assert.equal(slots[1], '9:30am');
  assert.equal(slots[2], '10:00am');
  assert.equal(slots.at(-1), '10:00pm');
});

test('bookable appointments are no longer restricted to Wednesdays', () => {
  const code = source.slice(source.indexOf('function appointmentTimeSlots('), source.indexOf('// Get available dates for the calendar'));
  const context = vm.createContext({ Date, Intl, APPOINTMENT_START_DATE: '2026-09-09' });
  vm.runInContext(code, context);
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const date = `${tomorrow.getUTCFullYear()}-${String(tomorrow.getUTCMonth() + 1).padStart(2, '0')}-${String(tomorrow.getUTCDate()).padStart(2, '0')}`;
  assert.equal(context.isBookableAppointment(date, '9:00am'), true);
});

test('same-day evening bookings close at 2pm London time', () => {
  const code = source.slice(source.indexOf('function appointmentTimeSlots('), source.indexOf('// Get available dates for the calendar'));
  const bookingAt = instant => {
    class ClockDate extends Date {
      constructor(...args) { super(...(args.length ? args : [instant])); }
      static now() { return new Date(instant).getTime(); }
    }
    const context = vm.createContext({ Date: ClockDate, Intl, APPOINTMENT_START_DATE: '2026-09-09' });
    vm.runInContext(code, context);
    return context.isBookableAppointment;
  };
  const beforeCutoff = bookingAt('2026-11-05T13:59:00Z');
  assert.equal(beforeCutoff('2026-11-05', '5:00pm'), false);
  assert.equal(beforeCutoff('2026-11-05', '5:30pm'), true);
  assert.equal(beforeCutoff('2026-11-05', '10:00pm'), true);
  assert.equal(beforeCutoff('2026-11-06', '9:00am'), true);

  const atCutoff = bookingAt('2026-11-05T14:00:00Z');
  assert.equal(atCutoff('2026-11-05', '5:30pm'), false);
  assert.equal(atCutoff('2026-11-06', '9:00am'), true);

  // British Summer Time is UTC+1, so the cutoff is 13:00 UTC in July.
  assert.equal(bookingAt('2027-07-01T12:59:00Z')('2027-07-01', '5:30pm'), true);
  assert.equal(bookingAt('2027-07-01T13:00:00Z')('2027-07-01', '5:30pm'), false);
});

test('the instant calendar follows the same-day cutoff and evening slot rules', () => {
  const clientSource = readFileSync(new URL('../public/added.js', import.meta.url), 'utf8');
  const code = clientSource.slice(clientSource.indexOf('function fallbackDates()'), clientSource.indexOf('let dateAvailabilityRequest'));
  const context = vm.createContext({
    Date,
    APPOINTMENT_START_DATE: '2026-09-09',
    londonNow: () => ({ date: '2026-11-05', minutes: 13 * 60 + 59 }),
    dateFromKey: value => new Date(`${value}T12:00:00Z`),
    dateKey: value => value.toISOString().slice(0, 10),
    calendarDateLabel: value => value,
    slotMinutes: time => {
      const [, hour, minute, period] = /^(\d+):(\d+)(am|pm)$/.exec(time);
      return Number(hour) % 12 * 60 + Number(minute) + (period === 'pm' ? 720 : 0);
    }
  });
  vm.runInContext(code, context);
  assert.equal(context.fallbackDates()[0].date, '2026-11-05');
  assert.equal(context.fallbackSlots('2026-11-05').find(slot => slot.time === '5:00pm').available, false);
  assert.equal(context.fallbackSlots('2026-11-05').find(slot => slot.time === '5:30pm').available, true);
  context.londonNow = () => ({ date: '2026-11-05', minutes: 14 * 60 });
  assert.equal(context.fallbackDates()[0].date, '2026-11-06');
  assert.equal(context.fallbackSlots('2026-11-05').find(slot => slot.time === '5:30pm').available, false);
});
