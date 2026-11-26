'use client';

import {useRef,useState} from 'react';
import {translationImportLimit, translationSubmission, type TranslationSubmission} from '../../lib/translation-import';
export type {TranslationSubmission} from '../../lib/translation-import';

export function TranslationImport({onChange,onInvalid}:{onChange:(pack:TranslationSubmission|null)=>void;onInvalid?:(invalid:boolean)=>void}) {
  const [message,setMessage]=useState('');
  const [raw,setRaw]=useState('');
  const [invalid,setInvalid]=useState(false);
  const lastRead=useRef(0);
  const file=useRef<HTMLInputElement>(null);

  function change(copy:string) {
    setRaw(copy);
    if (!copy.trim()) {
      setMessage('');setInvalid(false);onInvalid?.(false);onChange(null);return;
    }
    try {
      const pack=translationSubmission.parse(JSON.parse(copy));
      setMessage('Six versions prêtes pour la publication.');setInvalid(false);onInvalid?.(false);onChange(pack);
    } catch {
      setMessage('Vérifie le JSON, les six versions et les légendes de la photo.');setInvalid(true);onInvalid?.(true);onChange(null);
    }
  }
  return <details className="panel editorial-translations">
    <summary>Joindre les traductions</summary>
    <p>Importe les six versions de l’article et de sa photo en anglais, espagnol, arabe, chinois simplifié, russe et coréen.</p>
    <label>Fichier de traductions JSON<input ref={file} type="file" accept=".json,application/json" onChange={async event=>{
      const id=++lastRead.current;
      const picked=event.target.files?.[0];
      if (!picked) {change('');return;}
      onChange(null);onInvalid?.(true);
      try {
        if(picked.size>translationImportLimit) throw Error();
        const value=await picked.text();
        if(id===lastRead.current) change(value);
      } catch {
        if(id===lastRead.current) {setRaw('');setMessage('Le fichier doit être lisible et inférieur à 2 Mo.');setInvalid(true);onInvalid?.(true);}
      }
    }}/></label>
    <label>Ou coller les traductions JSON<textarea value={raw} dir="ltr" spellCheck={false} maxLength={translationImportLimit}
      onChange={event=>{lastRead.current++;if(file.current)file.current.value='';change(event.target.value);}}/></label>
    {message && <p role={invalid?'alert':'status'}>{message}</p>}
    {(raw || invalid) && <button className="outline" type="button" onClick={()=>{
      lastRead.current++;if(file.current)file.current.value='';change('');
    }}>Retirer les traductions jointes</button>}
  </details>;
}
