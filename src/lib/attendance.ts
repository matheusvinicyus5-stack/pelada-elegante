export type AttendanceRecord = { date: string; status: 'present' | 'absent' };
export type MedicalLeavePeriod = { start: string; end?: string | undefined };
export type AttendancePlayer = { medicalLeave?: boolean | undefined; medicalLeavePeriods?: MedicalLeavePeriod[] | undefined; attendance: number; attendanceBase?: number | undefined; attendanceRecords?: AttendanceRecord[] | undefined };
export function isSaturday(date: string) {
 const parsed = new Date(`${date}T12:00:00Z`);
 return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10) === date && parsed.getUTCDay() === 6;
}
export function recentSaturdays(today: string): string[] {
 const date = new Date(`${today}T12:00:00Z`);
 date.setUTCDate(date.getUTCDate() - ((date.getUTCDay()+1)%7));
 return Array.from({length:5},(_,index)=>{const day=new Date(date);day.setUTCDate(day.getUTCDate()-(4-index)*7);return day.toISOString().slice(0,10);});
}
// Frequência = presenças nos últimos 5 sábados registrados × 20%.
// A base importada vira 5 sábados "virtuais" (faltas mais antigas primeiro) que vão saindo da janela.
export function inMedicalLeave(date: string, periods?: MedicalLeavePeriod[]) {
 return (periods??[]).some(p=>date>=p.start&&(!p.end||date<=p.end));
}
function activeRecords(records: AttendanceRecord[], periods?: MedicalLeavePeriod[]) {return records.filter(r=>!inMedicalLeave(r.date,periods));}
export function setMedicalLeave<T extends AttendancePlayer>(player: T, on: boolean, today: string): T {
 const periods=[...(player.medicalLeavePeriods??[])];
 if(on){if(!periods.some(p=>!p.end))periods.push({start:today});}
 else{const i=periods.findIndex(p=>!p.end);if(i>=0)periods[i]={...periods[i]!,end:today};}
 const base=player.attendanceBase??player.attendance;const records=player.attendanceRecords??[];
 return {...player,medicalLeave:on,medicalLeavePeriods:periods,attendanceBase:base,attendanceRecords:records,attendance:attendanceValue(base,records,periods)};
}
export function attendanceValue(base: number, allRecords: AttendanceRecord[], periods?: MedicalLeavePeriod[]) {
 const records=activeRecords(allRecords,periods);
 const presences=Math.max(0,Math.min(5,Math.round(base/20)));
 const virtual:boolean[]=Array.from({length:5},(_,i)=>i>=5-presences);
 const real=[...records].sort((a,b)=>a.date.localeCompare(b.date)).map(record=>record.status==='present');
 return [...virtual,...real].slice(-5).filter(Boolean).length*20;
}
export function recordAttendance<T extends AttendancePlayer>(player: T, date: string, status: AttendanceRecord['status'] | null): T & AttendancePlayer {
 const base=player.attendanceBase??player.attendance;
 const records=[...(player.attendanceRecords??[]).filter(record=>record.date!==date),...(status?[{date,status}]:[])].sort((a,b)=>a.date.localeCompare(b.date));
 return {...player,attendanceBase:base,attendanceRecords:records,attendance:attendanceValue(base,records,player.medicalLeavePeriods)};
}
export function shortDate(date: string) {return `${date.slice(8,10)}/${date.slice(5,7)}`;}

export function attendanceWindow(base: number, allRecords: AttendanceRecord[], periods?: MedicalLeavePeriod[]): boolean[] {
  const records = activeRecords(allRecords, periods);
  const presences = Math.max(0, Math.min(5, Math.round(base / 20)));
  const virtual: boolean[] = Array.from({ length: 5 }, (_, i) => i >= 5 - presences);
  const real = [...records].sort((a, b) => a.date.localeCompare(b.date)).map(record => record.status === 'present');
  return [...virtual, ...real].slice(-5);
}
