import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { footballSchema } from './football-schema';
import type { Database, Json } from '@/integrations/supabase/types';

export const getFootball=createServerFn({method:'GET'}).handler(async()=>{
 const key=process.env['SUPABASE_PUBLISHABLE_KEY']!;
 const db=createClient<Database>(process.env['SUPABASE_URL']!,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers);if(key.startsWith('sb_')&&h.get('Authorization')===`Bearer ${key}`)h.delete('Authorization');h.set('apikey',key);return fetch(input,{...init,headers:h});}}});
 const {data,error}=await db.from('football_data').select('payload,revision').eq('id',1).single();
 if(error||!data)throw new Error('Não foi possível carregar os jogadores');
 return {...footballSchema.parse(data.payload),revision:data.revision};
});
export const getDirectionStatus=createServerFn({method:'GET'}).inputValidator(z.object({token:z.string().optional()})).handler(async({data})=>{const {session,settings}=await import('./direction.server');const s=await session();const config=await settings();if(s.data.version===config.session_version)return {active:true};const {checkDirectionToken}=await import('./direction-token');return {active:checkDirectionToken(data?.token,config.session_version)};});
export const enterDirection=createServerFn({method:'POST'}).inputValidator(z.object({password:z.string().min(1).max(128)})).handler(async({data})=>{const {session,settings,checkPassword}=await import('./direction.server');const s=await session();const config=await settings();if(!await checkPassword(data.password,config.password_hash))return {ok:false};await s.update({version:config.session_version});const {makeDirectionToken}=await import('./direction-token');return {ok:true,token:makeDirectionToken(config.session_version)};});
export const exitDirection=createServerFn({method:'POST'}).handler(async()=>{const {session}=await import('./direction.server');await (await session()).clear();return {ok:true};});
export const saveFootball=createServerFn({method:'POST'}).inputValidator(z.object({payload:footballSchema,revision:z.number().int().positive(),token:z.string().optional()})).handler(async({data})=>{
 const {requireDirection}=await import('./direction.server');await requireDirection(data.token);
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 // Reject new embedded images even when a caller bypasses the upload UI.
 const {data:current,error:readError}=await supabaseAdmin.from('football_data').select('payload').eq('id',1).single();
 if(readError || !current) throw new Error('Não foi possível verificar as fotos anteriores.');
 const existing=footballSchema.parse(current.payload);
 for(const player of data.payload.players){
  if(player.photo?.startsWith('data:image/') && existing.players.find(p=>p.id===player.id)?.photo!==player.photo) throw new Error('Envie a foto como arquivo antes de salvar.');
 }
 const {data:row,error}=await supabaseAdmin.from('football_data').update({payload:data.payload as Json,revision:data.revision+1}).eq('id',1).eq('revision',data.revision).select('revision').maybeSingle();
 if(error)throw new Error('Não foi possível salvar');if(!row)throw new Error('Os dados mudaram em outra janela. Atualize a página antes de salvar.');return {revision:row.revision};
});
export const changeDirectionPassword=createServerFn({method:'POST'}).inputValidator(z.object({current:z.string().min(1).max(128),password:z.string().min(8,'Use pelo menos 8 caracteres').max(128),token:z.string().optional()})).handler(async({data})=>{
 const {requireDirection,checkPassword,hashPassword}=await import('./direction.server');const {s,config}=await requireDirection(data.token);
 if(!await checkPassword(data.current,config.password_hash))throw new Error('Senha atual incorreta');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const version=config.session_version+1;
 const {data:row,error}=await supabaseAdmin.from('direction_settings').update({password_hash:await hashPassword(data.password),session_version:version}).eq('id',1).eq('session_version',config.session_version).select('id').maybeSingle();
 if(error||!row)throw new Error('Não foi possível alterar a senha');await s.update({version});const {makeDirectionToken}=await import('./direction-token');return {ok:true,token:makeDirectionToken(version)};
});