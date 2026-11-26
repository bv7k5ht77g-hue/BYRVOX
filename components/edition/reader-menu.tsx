'use client';

import { AudioLines, BookOpen, Bookmark, ChevronRight, CirclePlay, CircleUserRound, Headphones, House, LogOut, Newspaper, Radio, Search, Tv, X } from 'lucide-react';
import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react';
import { editionHref, type Section } from '../../lib/edition';
import { localizedHref, sectionLabel, type PublicLocale } from '../../lib/i18n';
import { readerSignOutUrl, readerText } from '../../lib/reader-links';
import { HeaderTopics } from './header-topics';
import { navText } from './navigation-copy';
import type { DialogName, Profile } from './reader-dialog';
import './reader-menu.css';

const sections = [
  ['accueil',House], ['actualites',Newspaper], ['radio',Radio], ['tv',Tv], ['podcasts',Headphones],
  ['emissions',AudioLines], ['dossiers',BookOpen], ['direct',CirclePlay],
] as const;

function cycleDrawerFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return;
  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:enabled, summary'))
    .filter(element => element.getClientRects().length > 0);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

export function ReaderMenu({ lang, current, category, profile, currentUrl, trigger, dismiss, open }: {
  lang:PublicLocale; current:Section; category?:string; profile:Profile|null; currentUrl:string;
  trigger:RefObject<HTMLButtonElement|null>; dismiss:()=>void; open:(name:DialogName)=>void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const panel = ref.current;
    const previous = trigger.current;
    panel?.showModal();
    close.current?.focus({preventScroll:true});
    return () => {
      panel?.close();
      if (previous?.isConnected) previous.focus({preventScroll:true});
    };
  }, [trigger]);
  return <dialog ref={ref} className="reader-navigation-drawer" id="reader-navigation-panel" aria-labelledby="reader-navigation-title"
    dir={lang==='ar'?'rtl':'ltr'} onKeyDown={cycleDrawerFocus} onCancel={event=>{event.preventDefault();dismiss();}}
    onClick={event=>{
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dismiss();
    }}>
    <div className="reader-navigation-head">
      <h2 id="reader-navigation-title">{navText(lang,'menu')}</h2>
      <button type="button" ref={close} aria-label={navText(lang,'close')} onClick={dismiss}><X size={23} aria-hidden="true"/></button>
    </div>
    <div className="reader-navigation-body">
      {profile && <div className="reader-navigation-identity"><CircleUserRound size={23} aria-hidden="true"/><bdi>{profile.name||navText(lang,'account')}</bdi></div>}
      <nav aria-label={navText(lang,'main')}>
        {sections.map(([section,Icon])=><div className="reader-navigation-row" key={section}>
          <a href={localizedHref(editionHref(section),lang)} aria-current={current===section?'page':undefined}>
            <Icon size={20} aria-hidden="true"/><span>{sectionLabel(section,lang)}</span>
          </a>
          {section==='actualites' && <HeaderTopics category={category}/>}
        </div>)}
      </nav>
      <div className="reader-navigation-account">
        <button type="button" onClick={()=>open('recherche')}><Search size={20} aria-hidden="true"/>{navText(lang,'search')}</button>
        <a href={localizedHref(editionHref('favoris'),lang)} aria-current={current==='favoris'?'page':undefined}><Bookmark size={20} aria-hidden="true"/>{sectionLabel('favoris',lang)}</a>
        <button type="button" onClick={()=>open(profile?'profil':'connexion')}><CircleUserRound size={20} aria-hidden="true"/>{navText(lang,profile?'account':'login')}<ChevronRight size={16} className="drawer-chevron" aria-hidden="true"/></button>
        {profile && <a href={readerSignOutUrl(Boolean(profile.legacy),currentUrl,lang)}><LogOut size={20} aria-hidden="true"/>{readerText(lang,'sortie')}</a>}
      </div>
    </div>
  </dialog>;
}
