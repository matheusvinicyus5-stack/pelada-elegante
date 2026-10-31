import type { Player } from './football';
import {positionNames} from './football';
import logo from '@/assets/amigos-fair-play-logo.jpeg.asset.json';
export async function renderPlayerArt(canvas: HTMLCanvasElement, player: Player) {
 await document.fonts.ready;
 const load=(src:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Não foi possível carregar a foto. Tente novamente.'));img.src=src;});
 const [brand,photo]=await Promise.all([load(logo.url),player.photo?load(player.photo):Promise.resolve(null)]);
 canvas.width=1080;canvas.height=1350;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Não foi possível criar a arte.');
 const style=getComputedStyle(document.documentElement);const color=(token:string)=>style.getPropertyValue(token).trim();
 const text=(value:string,x:number,y:number,size:number,fill=color('--foreground'),width=940,display=false)=>{ctx.font=`${display?700:500} ${size}px "${display?'Barlow Condensed':'DM Sans'}"`;while(ctx.measureText(value).width>width&&size>20){size--;ctx.font=`${display?700:500} ${size}px "${display?'Barlow Condensed':'DM Sans'}"`;}ctx.fillStyle=fill;ctx.fillText(value,x,y);};
 const circle=(img:HTMLImageElement,x:number,y:number,size:number)=>{ctx.save();ctx.beginPath();ctx.arc(x,y,size/2,0,Math.PI*2);ctx.clip();const side=Math.min(img.naturalWidth,img.naturalHeight);ctx.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,x-size/2,y-size/2,size,size);ctx.restore();};
 ctx.fillStyle=color('--background');ctx.fillRect(0,0,1080,1350);ctx.fillStyle=color('--primary');ctx.fillRect(0,0,1080,12);
 circle(brand,110,110,94);text('AMIGOS FAIR PLAY',180,108,46,undefined,800,true);text('TEMPORADA 2026 · PERFIL DO ATLETA',180,145,22,color('--muted-foreground'));
 ctx.fillStyle=color('--secondary');ctx.fillRect(64,220,952,530);
 if(photo) circle(photo,540,444,360);else{ctx.fillStyle=color('--primary');ctx.beginPath();ctx.arc(540,444,180,0,Math.PI*2);ctx.fill();ctx.textAlign='center';text(player.name.split(' ').map(n=>n[0]).slice(0,2).join(''),540,484,116,color('--primary-foreground'),300,true);}
 ctx.textAlign='center';text(player.name,540,698,76,undefined,870,true);text(positionNames[player.position]??player.position,540,799,32,color('--primary'));
 const values:[[number|string,string],[number|string,string],[number|string,string],[number|string,string]]=[[player.points,'PONTOS'],[player.goals,'GOLS'],[player.assists,'ASSISTÊNCIAS'],[`${player.attendance}%`,'FREQUÊNCIA']];
 values.forEach(([v,label],i)=>{const x=300+(i%2)*480,y=930+Math.floor(i/2)*180;text(String(v),x,y,90,undefined,390,true);text(label,x,y+43,25,color('--muted-foreground'),390);});
 text(`CARTÕES  ·  ${player.yellow} AMARELOS  /  ${player.red} VERMELHOS  /  ${player.blue} AZUIS`,540,1202,24,color('--muted-foreground'),930);
 ctx.fillStyle=color('--border');ctx.fillRect(64,1250,952,2);text('DENTRO DE CAMPO, RIVAIS. FORA DELE, AMIGOS.',540,1302,22,color('--muted-foreground'));
 return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Não foi possível gerar a imagem.')),'image/png'));
}
