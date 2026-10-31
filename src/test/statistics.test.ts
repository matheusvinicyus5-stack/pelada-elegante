import {describe,it,expect} from 'vitest';
import {normalizeSearch,rankingMovement,statisticsCsv,profileChangeKeys} from '@/lib/statistics';
import type {Player} from '@/lib/football';
const base:Player={id:1,name:'João; "Álvaro"',position:'MC',points:10,goals:2,assists:3,yellow:1,red:0,blue:2,attendance:80};
const snap={rank:3,points:5,goals:1,assists:1,yellow:0,red:0,blue:0,attendance:60};
describe('Requested statistics rules',()=>{
 it('matches João with Joao and ignores case and added accents',()=>{expect(normalizeSearch('João')).toBe(normalizeSearch('JOAO'));expect(normalizeSearch('Káio')).toBe(normalizeSearch('kaio'));});
 it('uses points ranking even when the display is filtered or goal-sorted',()=>{expect(rankingMovement([base,{...base,id:2,points:0}],{...base,previous:snap})).toEqual({delta:2,label:'Subiu 2 posições'});});
 it('indicates falling one position',()=>{expect(rankingMovement([{...base,id:2,points:20},base],{...base,previous:{...snap,rank:1}})).toEqual({delta:-1,label:'Caiu 1 posição'});});
 it('omits unchanged and missing historical ranks',()=>{expect(rankingMovement([base],base)).toBeNull();expect(rankingMovement([base],{...base,previous:{...snap,rank:1}})).toBeNull();});
 it('excludes attendance from profile stat changes',()=>{expect([...profileChangeKeys]).toEqual(['points','goals','assists','yellow','red','blue']);});
 it('exports only visible rows with BOM, semicolons, CRLF and escaped accents',()=>{const csv=statisticsCsv([base],[{...base,id:2,points:20},base]);expect(csv.charCodeAt(0)).toBe(0xfeff);expect(csv).toContain('"2";"João; ""Álvaro""";"MC";"10";"2";"3";"1";"0";"2";"80"');expect(csv.split('\r\n')).toHaveLength(2);});
 it('neutralizes formula names in spreadsheets',()=>{expect(statisticsCsv([{...base,name:'=SUM(A1)'}],[base])).toContain('"\'=SUM(A1)"');});
});
