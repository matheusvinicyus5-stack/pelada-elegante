import { z } from 'zod';
const count = z.number().int().min(0).max(100000);
export const playerSchema = z.object({ id: count, number: count.optional(), name: z.string().trim().min(1).max(100), position: z.enum(['MC','AT','G','ZG','DF','LAT']), points: count, goals: count, assists: count, yellow: count, red: count, blue: count, attendance: z.number().min(0).max(100), photo: z.string().max(2000000).refine(s => !s || s.startsWith('/__l5e/assets-v1/') || /^https:\/\//.test(s) || /^data:image\/(png|jpeg|webp);base64,/.test(s), 'Foto inválida').optional() });
export const matchSchema = z.object({id:count,date:z.string().trim().min(1).max(100),short:z.string().trim().min(1).max(20),scoreA:count,scoreB:count,teamA:z.array(count),teamB:z.array(count),example:z.boolean().optional()});
export const footballSchema = z.object({players:z.array(playerSchema).max(500),matches:z.array(matchSchema).max(1000)}).superRefine((data,ctx)=>{
 const ids = new Set(data.players.map(p=>p.id));
 if(ids.size!==data.players.length || new Set(data.matches.map(m=>m.id)).size!==data.matches.length) ctx.addIssue({code:'custom',message:'Identificadores repetidos'});
 for(const m of data.matches) { const all=[...m.teamA,...m.teamB]; if(new Set(all).size!==all.length || all.some(id=>!ids.has(id))) ctx.addIssue({code:'custom',message:'Escalação inválida'}); }
});
export type FootballData = z.infer<typeof footballSchema>;