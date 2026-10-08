import { useSession, setResponseHeader } from '@tanstack/react-start/server';
import { pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

export function session() {
 setResponseHeader('Cache-Control','no-store');
 const password=process.env['SESSION_SECRET'];
 if(!password) throw new Error('Acesso temporariamente indisponível');
 return useSession<{version?:number}>({password,name:'fairplay-direction',maxAge:60*60*8,cookie:{httpOnly:true,secure:true,sameSite:'lax',path:'/'}});
}
export async function settings(){
 const {data,error}=await supabaseAdmin.from('direction_settings').select('password_hash,session_version').eq('id',1).single();
 if(error||!data)throw new Error('Não foi possível verificar o acesso');
 return data;
}
function derive(password:string,salt:string):Promise<Buffer>{return new Promise((resolve,reject)=>pbkdf2(password,salt,100000,32,'sha256',(e,key)=>e?reject(e):resolve(key)));}
export async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');return `${salt}:${(await derive(password,salt)).toString('hex')}`;}
export async function checkPassword(password:string,hash:string|null){
 if(hash){const [salt,value]=hash.split(':');if(!salt||!value)return false;const a=await derive(password,salt);const b=Buffer.from(value,'hex');return a.length===b.length&&timingSafeEqual(a,b);}
 const initial=process.env['SITE_PASSWORD'];if(!initial)throw new Error('Senha inicial não configurada');
 const salt='fairplay-initial';return timingSafeEqual(await derive(password,salt),await derive(initial,salt));
}
export async function requireDirection(){const s=await session();const config=await settings();if(s.data.version!==config.session_version)throw new Error('Entre no Modo Direção para alterar informações');return {s,config};}