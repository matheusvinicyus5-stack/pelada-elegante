import { describe, expect, it } from 'vitest';
import { attendanceValue, isSaturday, recentSaturdays, recordAttendance } from '@/lib/attendance';
import { playerSchema } from '@/lib/football-schema';
import { players } from '@/lib/football';
describe('Attendance',()=>{
 it('finds five Saturdays across month boundaries',()=>{expect(recentSaturdays('2026-10-09')).toEqual(['2026-09-05','2026-09-12','2026-09-19','2026-09-26','2026-10-03']);});
 it('includes today when today is Saturday',()=>{expect(recentSaturdays('2026-10-10')[4]).toBe('2026-10-10');});
 it('keeps imported baseline',()=>{let p=recordAttendance({attendance:100},'2026-09-26','present');p=recordAttendance(p,'2026-10-03','absent');expect(p.attendance).toBe(80);expect(p.attendanceBase).toBe(100);expect(attendanceValue(0,[{date:'2026-10-03',status:'absent'}])).toBe(0);});
 it('absence stays 80% for 5 Saturdays and recovers on the 6th',()=>{let p=recordAttendance({attendance:100},'2026-11-07','absent');expect(p.attendance).toBe(80);for(const d of ['2026-11-14','2026-11-21','2026-11-28','2026-12-05']){p=recordAttendance(p,d,'present');expect(p.attendance).toBe(80);}p=recordAttendance(p,'2026-12-12','present');expect(p.attendance).toBe(100);});
 it('corrects and clears records without double counting',()=>{let p=recordAttendance({attendance:100},'2026-10-03','absent');expect(p.attendance).toBe(80);p=recordAttendance(p,'2026-10-03','present');expect(p.attendance).toBe(100);expect(p.attendanceRecords).toHaveLength(1);p=recordAttendance(p,'2026-10-03',null);expect(p.attendance).toBe(100);});
 it('replays older corrections chronologically',()=>{const p=recordAttendance(recordAttendance({attendance:100},'2026-10-03','present'),'2026-09-26','absent');expect(p.attendance).toBe(80);});
 it('validates Saturday dates, unique records and computed totals',()=>{expect(isSaturday('2026-10-03')).toBe(true);expect(isSaturday('2026-10-04')).toBe(false);expect(isSaturday('2026-02-31')).toBe(false);const p=players[0];if(!p)throw new Error('Missing fixture');const updated=recordAttendance(p,'2026-10-03','absent');expect(playerSchema.safeParse(updated).success).toBe(true);expect(playerSchema.safeParse({...updated,attendance:99}).success).toBe(false);expect(playerSchema.safeParse({...updated,attendanceRecords:[{date:'2026-10-03',status:'absent'},{date:'2026-10-03',status:'absent'}]}).success).toBe(false);});
});