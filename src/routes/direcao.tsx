import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route=createFileRoute('/direcao')({beforeLoad:()=>{throw redirect({to:'/',replace:true});}});
