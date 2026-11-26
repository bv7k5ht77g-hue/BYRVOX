'use client';
import {useEffect,useState} from 'react';
import type { AudienceScore } from '../../lib/audience-rankings';
export type Metric=AudienceScore & {category:string;title:string;titles?:Record<string,string>};
let cached:Promise<Metric[]>|undefined;
export function useAudience(){
 const [data,set]=useState<Metric[]>([]);
 useEffect(()=>{cached??=fetch('/api/audience').then(r=>r.ok?r.json() as Promise<Metric[]>:[]).catch(()=>[]);cached.then(set)},[]);
 return data;
}
export function ArticleMeter({slug}:{slug:string}){
 useEffect(()=>{
  const sent=new Set<string>();
  function record(kind:string){
   if(document.hidden||sent.has(kind))return;
   const key='by-audience:'+new Date().toISOString().slice(0,10)+':'+slug+':'+kind;
   try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1')}catch{}
   sent.add(kind);void fetch('/api/audience',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,kind}),keepalive:true}).catch(()=>{});
  }
  let seconds=0;const timer=setInterval(()=>{if(!document.hidden){record('view');if(++seconds>=30)record('read')}},1000);
  function engagement(e:MouseEvent){const link=(e.target as Element)?.closest('article a[href]');if(e.isTrusted&&link)record('engage')}
  record('view');document.addEventListener('click',engagement);return()=>{clearInterval(timer);document.removeEventListener('click',engagement)}
 },[slug]);return null;
}
