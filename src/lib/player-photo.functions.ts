import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { decodePhoto } from './player-photo';
export const uploadPlayerPhoto=createServerFn({method:'POST'}).inputValidator(z.object({image:z.string().max(2800000),token:z.string().optional()})).handler(async({data})=>{
 const {requireDirection}=await import('./direction.server'); await requireDirection(data.token);
 const photo=decodePhoto(data.image);
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const filename=`${crypto.randomUUID()}.${photo.type}`;
 const {error}=await supabaseAdmin.storage.from('player-photos').upload(filename,photo.bytes,{contentType:photo.contentType,upsert:false});
 if(error) throw new Error('Não foi possível enviar a foto. Sua foto anterior foi preservada.');
 const check=await supabaseAdmin.storage.from('player-photos').download(filename);
 if(check.error || !check.data || check.data.size!==photo.bytes.length) throw new Error('Não foi possível confirmar a foto enviada. Tente novamente.');
 return {url:`/api/player-photos/${filename}`};
});
