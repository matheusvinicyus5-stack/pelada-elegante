export const photoPathPattern = /^\/api\/player-photos\/[a-f0-9-]+\.(jpeg|png|webp)$/;
export function decodePhoto(value: string) {
 const match=value.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
 if(!match?.[1] || !match[2]) throw new Error('Foto inválida. Use JPEG, PNG ou WebP.');
 const bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));
 if(bytes.length>2*1024*1024 || bytes.length<12) throw new Error('Use uma foto de até 2 MB.');
 const type=match[1];
 const valid=type==='jpeg' ? bytes[0]===255&&bytes[1]===216&&bytes[2]===255 : type==='png' ? [137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n) : String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 if(!valid) throw new Error('O arquivo não corresponde a uma imagem válida.');
 return {bytes,type,contentType:`image/${type}`};
}
