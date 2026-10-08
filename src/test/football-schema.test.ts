import { describe, expect, it } from 'vitest';
import { footballSchema } from '@/lib/football-schema';
import { players } from '@/lib/football';
const match={id:1,date:'10 de outubro',short:'10 OUT',scoreA:0,scoreB:0,teamA:[players[0]?.id??0],teamB:[]};
describe('Football data validation',()=>{
 it('accepts the full original roster and original photo URLs',()=>{expect(footballSchema.safeParse({players,matches:[match]}).success).toBe(true);});
 it('rejects unknown roster references and duplicate lineup entries',()=>{expect(footballSchema.safeParse({players,matches:[{...match,teamB:match.teamA}]}).success).toBe(false);expect(footballSchema.safeParse({players,matches:[{...match,teamA:[99999]}]}).success).toBe(false);});
 it('rejects duplicate player identifiers and negative scores',()=>{expect(footballSchema.safeParse({players:[...players,players[0]],matches:[]}).success).toBe(false);expect(footballSchema.safeParse({players,matches:[{...match,scoreA:-1}]}).success).toBe(false);});
 it('rejects unsafe photo URLs',()=>{expect(footballSchema.safeParse({players:players.map(p=>({...p,photo:'javascript:alert(1)'})),matches:[]}).success).toBe(false);});
});