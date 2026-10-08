export type Player = { id: number; name: string; position: string; points: number; goals: number; assists: number; yellow: number; red: number; blue: number; attendance: number; photo?: string };
export const players: Player[] = [
 {id:30,name:'JP',position:'MC',points:86,goals:13,assists:14,yellow:2,red:0,blue:0,attendance:100},
 {id:7,name:'Vinícius',position:'MC',points:83,goals:2,assists:5,yellow:4,red:0,blue:0,attendance:100},
 {id:10,name:'Marivaldo',position:'MC',points:82,goals:12,assists:8,yellow:1,red:0,blue:0,attendance:100},
 {id:11,name:'Matheus Vinicyus',position:'AT',points:82,goals:25,assists:8,yellow:0,red:1,blue:0,attendance:100},
 {id:9,name:'Jonathas',position:'AT',points:79,goals:35,assists:8,yellow:0,red:0,blue:0,attendance:100},
 {id:19,name:'Danilo',position:'AT',points:77,goals:19,assists:13,yellow:0,red:0,blue:0,attendance:100},
 {id:1,name:'Naldo',position:'G',points:74,goals:0,assists:1,yellow:0,red:0,blue:0,attendance:100},
 {id:8,name:'Gabriel Teles',position:'MC',points:74,goals:30,assists:11,yellow:2,red:0,blue:0,attendance:100},
];
export const positionNames: Record<string,string> = {MC:'Meio-campo',AT:'Atacante',G:'Goleiro',ZG:'Zagueiro'};
export type Match = { id: number; date: string; short: string; scoreA: number; scoreB: number; teamA: number[]; teamB: number[] };
export const initialMatches: Match[] = [
 {id:1,date:'03 de outubro de 2026',short:'03 OUT',scoreA:5,scoreB:3,teamA:[30,11,1,8],teamB:[7,10,9,19]},
 {id:2,date:'26 de setembro de 2026',short:'26 SET',scoreA:2,scoreB:4,teamA:[30,10,9,1],teamB:[7,11,19,8]},
 {id:3,date:'19 de setembro de 2026',short:'19 SET',scoreA:3,scoreB:3,teamA:[7,9,1,8],teamB:[30,10,11,19]},
];
