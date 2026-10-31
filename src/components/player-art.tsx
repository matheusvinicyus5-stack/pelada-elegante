import {useEffect,useRef,useState} from 'react';
import {Download,ImageDown,LoaderCircle,Share2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {renderPlayerArt} from '@/lib/player-art';
import {downloadBlob,deliverFile} from '@/lib/download';
import type {Player} from '@/lib/football';
export function PlayerArt({player}:{player:Player}){
 const [open,setOpen]=useState(false);const [blob,setBlob]=useState<Blob|null>(null);const [error,setError]=useState('');const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{if(!open)return;let cancelled=false;setBlob(null);setError('');const frame=requestAnimationFrame(()=>{if(canvas.current)renderPlayerArt(canvas.current,player).then(b=>{if(!cancelled)setBlob(b);}).catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:'Não foi possível gerar a arte.');});});return()=>{cancelled=true;cancelAnimationFrame(frame);};},[open,player]);
 const filename=`amigos-fair-play-jogador-${player.id}.png`;
 return <><Button variant="outline" className="w-full mt-4" onClick={()=>setOpen(true)}><ImageDown size={16}/>Criar cartão do jogador</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="match-art-dialog"><DialogTitle>Cartão de {player.name}</DialogTitle><DialogDescription>Amigos Fair Play · Temporada 2026</DialogDescription><div className="match-art-preview" aria-busy={!blob&&!error}><canvas ref={canvas} aria-label={`Cartão de ${player.name}`} className={blob?'':'invisible'}/>{!blob&&!error&&<div className="match-art-loading"><LoaderCircle className="animate-spin"/>Preparando cartão…</div>}</div>{error&&<p role="alert" className="direction-error">{error}</p>}<div className="profile-art-actions"><Button disabled={!blob} onClick={()=>{if(blob)downloadBlob(blob,filename);}}><Download size={16}/>Baixar imagem</Button><Button variant="outline" disabled={!blob} onClick={()=>{if(blob)void deliverFile(blob,filename).catch(()=>setError('Não foi possível compartilhar. Tente baixar a imagem.'));}}><Share2 size={16}/>Compartilhar</Button></div></DialogContent></Dialog></>;
}
