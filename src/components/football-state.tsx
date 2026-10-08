import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { queryOptions, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getFootball, getDirectionStatus, saveFootball } from '@/lib/football.functions';
import { footballSchema } from '@/lib/football-schema';
import type { Player, Match } from '@/lib/football';
type FootballData = {players:Player[];matches:Match[]};

export const footballOptions=queryOptions({queryKey:['football'],queryFn:()=>getFootball(),staleTime:0});
type State=FootballData & {active:boolean;setActive:(active:boolean)=>void;save:(data:FootballData)=>Promise<void>};
const FootballContext=createContext<State|null>(null);
export function FootballProvider({children}:{children:ReactNode}){
 const {data}=useSuspenseQuery(footballOptions);const client=useQueryClient();const [active,setActive]=useState(false);const status=useServerFn(getDirectionStatus);const saveFn=useServerFn(saveFootball);
 useEffect(()=>{status().then(s=>setActive(s.active)).catch(()=>setActive(false));},[status]);
 async function save(payload:FootballData){const result=await saveFn({data:{payload:footballSchema.parse(payload),revision:data.revision}});client.setQueryData(footballOptions.queryKey,{...payload,revision:result.revision});}
 return <FootballContext.Provider value={{...data,active,setActive,save}}>{children}</FootballContext.Provider>;
}
export function useFootball(){const value=useContext(FootballContext);if(!value)throw new Error('FootballProvider ausente');return value;}