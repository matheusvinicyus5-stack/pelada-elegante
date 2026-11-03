import { describe, it, expect } from 'vitest';
import { applyQuickAttendance } from '@/lib/attendance';
import { withPreviousSnapshots } from '@/lib/player-changes';
import type { Player } from '@/lib/football';
const p = (id: number, extra: Partial<Player> = {}): Player => ({ id, name: `P${id}`, position: 'MC', points: 0, goals: 0, assists: 0, yellow: 0, red: 0, blue: 0, attendance: 100, attendanceBase: 100, attendanceRecords: [], ...extra });
describe('quick attendance', () => {
  it('marks checked as present and unchecked as absent (80%)', () => {
    const [a, b] = applyQuickAttendance([p(1), p(2)], '2026-10-31', [1]);
    expect(a!.attendance).toBe(100); expect(b!.attendance).toBe(80);
    expect(b!.attendanceRecords).toEqual([{ date: '2026-10-31', status: 'absent' }]);
  });
  it('leaves gold members untouched', () => {
    const [g] = applyQuickAttendance([p(1, { membership: 'ouro' })], '2026-10-31', []);
    expect(g!.attendanceRecords).toEqual([]);
  });
});
describe('same-day snapshots accumulate', () => {
  it('keeps the first baseline so +2 goals and +3 points both show', () => {
    const start = [p(1, { goals: 29, points: 87 })];
    const afterGoals = withPreviousSnapshots(start, [{ ...start[0]!, goals: 31 }], '2026-11-03');
    const afterPoints = withPreviousSnapshots(afterGoals, [{ ...afterGoals[0]!, points: 90 }], '2026-11-03');
    expect(afterPoints[0]!.previous).toMatchObject({ goals: 29, points: 87 });
  });
  it('starts a new baseline on a later day', () => {
    const s = [p(1, { goals: 31, previous: { rank: 1, points: 0, goals: 29, assists: 0, yellow: 0, red: 0, blue: 0, attendance: 100, day: '2026-11-03' } })];
    expect(withPreviousSnapshots(s, [{ ...s[0]!, goals: 32 }], '2026-11-10')[0]!.previous?.goals).toBe(31);
  });
});
