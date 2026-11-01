import {describe,it,expect} from 'vitest';
import {applyQuickRound,recentForm} from '@/lib/statistics';
import type {Player,Match} from '@/lib/football';
const p=(id:number):Player=>({id,name:`P${id}`,position:'MC',points:10,goals:0,assists:0,yellow:0,red:0,blue:0,attendance:100});
const m=(id:number,a:number,b:number):Match=>({id,date:'',short:'',scoreA:a,scoreB:b,teamA:[1],teamB:[2]});
describe('Quick round and form',()=>{
 it('gives +3 to selected winners only',()=>{const r=applyQuickRound([p(1),p(2)],3,[1],[]);expect(r.map(x=>x.points)).toEqual([13,10]);});
 it('gives +2 for the second game winners',()=>{expect(applyQuickRound([p(1)],2,[1],[])[0]?.points).toBe(12);});
 it('credits goals and cards to losers too',()=>{const r=applyQuickRound([p(1),p(2)],3,[1],[{playerId:2,kind:'goals'},{playerId:2,kind:'goals'},{playerId:2,kind:'yellow'}]);expect(r[1]).toMatchObject({points:10,goals:2,yellow:1});});
 it('marks win, draw, loss and not played in chronological order',()=>{const f=recentForm([m(3,1,1),m(2,0,2),m(1,3,1)],1).map(x=>x.result);expect(f).toEqual(['V','D','E']);expect(recentForm([m(1,1,0)],9)[0]?.result).toBe('N');});
 it('uses at most the last 5 matches',()=>{expect(recentForm([1,2,3,4,5,6,7].map(i=>m(i,1,0)),1)).toHaveLength(5);});
});
