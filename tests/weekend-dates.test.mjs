import test from 'node:test'
import assert from 'node:assert/strict'
import { computeWeekendDates } from '../lib/utils/weekend-dates.ts'
test('three matchdays span Friday to Sunday and resume next Friday', () => {
  assert.deepEqual(computeWeekendDates('2026-09-10', 4), ['2026-09-11T16:00:00.000Z','2026-09-12T16:00:00.000Z','2026-09-13T16:00:00.000Z','2026-09-18T16:00:00.000Z'])
})
test('never schedules before the start time and handles a partial weekend', () => {
  assert.deepEqual(computeWeekendDates('2026-09-12T18:00:00+01:00', 2), ['2026-09-13T16:00:00.000Z','2026-09-18T16:00:00.000Z'])
})
test('one and two matchdays skip the remainder of the weekend', () => {
  assert.deepEqual(computeWeekendDates('2026-09-11', 3, 1), ['2026-09-11T16:00:00.000Z','2026-09-18T16:00:00.000Z','2026-09-25T16:00:00.000Z'])
  assert.deepEqual(computeWeekendDates('2026-09-11', 3, 2), ['2026-09-11T16:00:00.000Z','2026-09-12T16:00:00.000Z','2026-09-18T16:00:00.000Z'])
})
test('invalid schedule input is rejected', () => {
  assert.throws(() => computeWeekendDates('invalid', 1))
  assert.throws(() => computeWeekendDates(null, 1, 4))
})
