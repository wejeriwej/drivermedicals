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
    getRecordsGuidance: () => ({}), bookingEmailHtml: () => '', clinicTravelHtml: () => '',
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

test('same-day appointments are rejected and availability starts tomorrow', () => {
  const code = source.slice(source.indexOf('function appointmentTimeSlots('), source.indexOf('// Get available dates for the calendar'));
  const context = vm.createContext({ Date, Intl, APPOINTMENT_START_DATE: '2026-09-09' });
  vm.runInContext(code, context);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const today = `${values.year}-${values.month}-${values.day}`;
  assert.equal(context.isBookableAppointment(today, '10:00pm'), false);
});
