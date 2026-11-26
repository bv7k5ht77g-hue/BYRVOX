'use client';

import { useEffect, useRef, useState } from 'react';
import { readerAccountUrl, readerText, type ReaderMode } from '../../lib/reader-links';
import type { PublicLocale } from '../../lib/i18n';

type ClerkSession = {getToken: () => Promise<string|null>};
type Clerk = {
  session?: ClerkSession | null;
  load:(options:object) => Promise<void>;
  mountSignIn:(el:HTMLElement,options:object) => void;
  mountSignUp:(el:HTMLElement,options:object) => void;
  unmountSignIn:(el:HTMLElement) => void;
  unmountSignUp:(el:HTMLElement) => void;
  addListener:(fn:(state:{session?:ClerkSession|null}) => void) => () => void;
  signOut:(options:{redirectUrl:string}) => Promise<void>;
};

type ClerkWindow = Window & {Clerk?:Clerk; __internal_ClerkUICtor?:unknown};
let loading:Promise<Clerk>|null = null;

function loadScript(src:string, key?:string) {
  return new Promise<void>((resolve,reject) => {
    const script = document.createElement('script');
    script.crossOrigin = 'anonymous';
    script.async = true;
    if (key) script.dataset.clerkPublishableKey = key;
    script.onload = () => resolve();
    script.onerror = () => {script.remove(); reject(new Error('Clerk script unavailable'));};
    script.src = src;
    document.head.appendChild(script);
  });
}

function loadClerk(key:string, issuer:string) {
  if (!loading) loading = (async () => {
    const scope = window as ClerkWindow;
    if (!scope.__internal_ClerkUICtor) await loadScript(issuer + '/npm/@clerk/ui@1/dist/ui.browser.js');
    if (!scope.Clerk) await loadScript(issuer + '/npm/@clerk/clerk-js@6/dist/clerk.browser.js',key);
    if (!scope.Clerk || !scope.__internal_ClerkUICtor) throw new Error('Clerk unavailable');
    await scope.Clerk.load({ui:{ClerkUI:scope.__internal_ClerkUICtor}});
    return scope.Clerk;
  })().catch(error => {loading = null; throw error;});
  return loading;
}

export function ClerkReader({publishableKey,issuer,mode,returnTo,lang}:{
  publishableKey:string; issuer:string; mode:ReaderMode; returnTo:string; lang:PublicLocale;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const [notice,setNotice] = useState<'waiting'|'error'|'suspended'|'banned'|null>('waiting');
  const [attempt,setAttempt] = useState(0);
  const [leaving,setLeaving] = useState(false);
  useEffect(() => {
    const el = mount.current;
    if (!el || !publishableKey || mode === 'sortie') return;
    let closed = false;
    let exchanging = false;
    let cleanup: (() => void)|undefined;
    const fail = () => { if (!closed) setNotice('error'); };
    async function activate(session:ClerkSession) {
      if (exchanging || closed) return;
      exchanging = true;
      try {
        const token = await session.getToken();
        if (!token) throw new Error();
        const response = await fetch('/api/reader-session/activate',{method:'POST',headers:{Authorization:'Bearer ' + token},cache:'no-store'});
        if (closed) return;
        if (response.ok) { window.location.replace(returnTo); return; }
        const result = await response.json() as {status?:string};
        if (result.status === 'suspended' || result.status === 'banned') setNotice(result.status);
        else fail();
      } catch { fail(); }
    }
    setNotice('waiting');
    loadClerk(publishableKey,issuer).then(clerk => {
      if (closed) return;
      if (clerk.session) {void activate(clerk.session);return;}
      const signIn = readerAccountUrl('connexion',returnTo,lang);
      const signUp = readerAccountUrl('inscription',returnTo,lang);
      const options = {routing:'hash', signInUrl:signIn, signUpUrl:signUp, forceRedirectUrl:signIn,
        signInForceRedirectUrl:signIn, signUpForceRedirectUrl:signIn};
      if (mode === 'inscription') clerk.mountSignUp(el,options);
      else clerk.mountSignIn(el,options);
      const unsubscribe = clerk.addListener(state => {if (state.session) void activate(state.session);});
      cleanup = () => {unsubscribe(); if (mode === 'inscription') clerk.unmountSignUp(el); else clerk.unmountSignIn(el);};
      setNotice(null);
    }).catch(fail);
    return () => {closed = true;cleanup?.();};
  },[mode,publishableKey,issuer,returnTo,lang,attempt]);

  async function signOut() {
    setLeaving(true);
    try {
      const response = await fetch('/api/reader-session/logout',{method:'POST',cache:'no-store'});
      if (!response.ok) throw new Error();
      if (publishableKey) {
        const clerk = await loadClerk(publishableKey,issuer);
        if (clerk.session) {await clerk.signOut({redirectUrl:returnTo});return;}
      }
      window.location.replace(returnTo);
    } catch {setNotice('error');setLeaving(false);}
  }

  if (mode === 'sortie') return <><button className="red" disabled={leaving} onClick={signOut}>{readerText(lang,'sortie')}</button>
    {notice === 'error' && <p role="alert">{readerText(lang,'error')}</p>}</>;
  if (!publishableKey) return <p role="status">{readerText(lang,'unavailable')}</p>;
  return <><div ref={mount}/>{notice && <p role="status">{readerText(lang,notice)}</p>}
    {notice === 'error' && <button className="outline" onClick={() => setAttempt(n=>n+1)}>{readerText(lang,'retry')}</button>}
    {(notice === 'banned' || notice === 'suspended') && <a href={readerAccountUrl('sortie',returnTo,lang)}>{readerText(lang,'sortie')}</a>}</>;
}
