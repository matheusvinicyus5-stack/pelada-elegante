export type AttendanceRecord = { date: string; status: 'present' | 'absent' };
export type AttendancePlayer = { attendance: number; attendanceBase?: number | undefined; attendanceRecords?: AttendanceRecord[] | undefined };
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
export function attendanceValue(base: number, records: AttendanceRecord[]) {
 const presences=Math.max(0,Math.min(5,Math.round(base/20)));
 const virtual:boolean[]=Array.from({length:5},(_,i)=>i>=5-presences);
 const real=[...records].sort((a,b)=>a.date.localeCompare(b.date)).map(record=>record.status==='present');
 return [...virtual,...real].slice(-5).filter(Boolean).length*20;
}
export function recordAttendance<T extends AttendancePlayer>(player: T, date: string, status: AttendanceRecord['status'] | null): T & AttendancePlayer {
 const base=player.attendanceBase??player.attendance;
 const records=[...(player.attendanceRecords??[]).filter(record=>record.date!==date),...(status?[{date,status}]:[])].sort((a,b)=>a.date.localeCompare(b.date));
 return {...player,attendanceBase:base,attendanceRecords:records,attendance:attendanceValue(base,records)};
}
export function shortDate(date: string) {return `${date.slice(8,10)}/${date.slice(5,7)}`;}