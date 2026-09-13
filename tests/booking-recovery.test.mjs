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
