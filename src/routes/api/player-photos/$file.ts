import {createFileRoute} from '@tanstack/react-router';
export const Route=createFileRoute('/api/player-photos/$file')({server:{handlers:{GET:async({params})=>{
 if(!/^[a-f0-9-]+\.(jpeg|png|webp)$/.test(params.file)) return new Response('Foto não encontrada',{status:404});
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 // Only immutable roster-photo objects are public through this read-only endpoint.
 const {data,error}=await supabaseAdmin.storage.from('player-photos').download(params.file);
 if(error||!data) return new Response('Foto não encontrada',{status:404});
 return new Response(data,{headers:{'Content-Type':data.type,'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
}}}});
