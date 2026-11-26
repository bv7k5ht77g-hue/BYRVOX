'use client';

import Image from 'next/image';
import { Bookmark, BookmarkCheck, CircleUserRound, Menu, Rss, Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { editionHref, type EditionRoute, type Section, type Summary } from '../../lib/edition';
import type { CategoryHeadlines, RatedArticle } from '../../lib/editorial-sections';
import { AdSlot } from './ad-slot';
import { HeaderTopics } from './header-topics';
import { ThemeToggle } from './theme-toggle';
import { WeatherNav } from '../weather-nav';
import { LanguageSelect, usePublicLocale } from '../language-select';
import { localizedHref, sectionLabel, type PublicLocale } from '../../lib/i18n';
import { readerAccountUrl } from '../../lib/reader-links';
import { navText } from './navigation-copy';
import { ReaderMenu } from './reader-menu';
import { ArticleHeaderTitle } from './article-header-title';
import { ReadingProgress } from './reading-progress';
import './navigation.css';
import './footer.css';
import { EditionFront, SectionContent } from './sections';
import { ReaderDialog, type DialogName, type Profile } from './reader-dialog';

const navigation: Section[] = ['accueil', 'actualites', 'radio', 'tv', 'podcasts', 'emissions', 'dossiers'];
const policies = ['Politique éditoriale', 'Corrections', 'Confidentialité', 'Conditions d’utilisation'] as const;

export function Brand() {
  const lang = usePublicLocale();
  return <a className="brand edition-brand" href={localizedHref('/',lang)} aria-label={'BYRVOX · '+sectionLabel('accueil',lang)}>
    <span className="brand-mark" aria-hidden="true" />
    <small>BEYOND THE HEADLINES</small>
  </a>;
}

function NavLinks({ current, category }: { current: Section; category?: string }) {
  const lang = usePublicLocale();
  return navigation.map(section => {
    const link = <a key={section} href={localizedHref(editionHref(section), lang)}
      aria-current={current === section ? 'page' : undefined}>{sectionLabel(section, lang)}</a>;
    return section === 'actualites'
      ? <div className="news-nav-item" key={section}>{link}<HeaderTopics category={category} /></div>
      : link;
  });
}

function Header({ current, category, profile, open, currentUrl, article }: {
  current: Section; category?: string; profile: Profile | null; open: (name: DialogName) => void;
  currentUrl: string; article?: { title: string; language: PublicLocale };
}) {
  const lang = usePublicLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  function show(name:DialogName) {
    setMenuOpen(false);
    open(name);
  }
  return <><header className="edition-site edition-header"><div className="topbar" dir="ltr">
    <Brand />
    {article && <ArticleHeaderTitle {...article} />}
    <nav className="desktop-nav" dir={lang === 'ar' ? 'rtl' : 'ltr'} aria-label={navText(lang,'main')}><NavLinks current={current} category={category} /></nav>
    <div className="tools" dir={lang === 'ar' ? 'rtl' : 'ltr'}><WeatherNav locale={lang} /><LanguageSelect />
      <button className="tool-icon" aria-label={navText(lang,'search')} onClick={() => show('recherche')}>
        <Search size={20} aria-hidden="true" />
      </button>
      <ThemeToggle locale={lang} />
      {!profile && <button className="outline account" onClick={() => show('connexion')}><CircleUserRound size={16} aria-hidden="true" /> {navText(lang,'login')}</button>}
      <button type="button" ref={menuTrigger} className={'edition-menu reader-menu-trigger' + (profile ? ' signed-in-menu' : '')}
        aria-label={navText(lang,'menu')} aria-expanded={menuOpen} aria-haspopup="dialog"
        aria-controls={menuOpen ? 'reader-navigation-panel' : undefined} onClick={()=>setMenuOpen(true)}>
        <Menu size={21} aria-hidden="true"/>
      </button>
    </div>
  </div>
    <ReadingProgress /></header>
    {menuOpen && <ReaderMenu trigger={menuTrigger} lang={lang} current={current} category={category} currentUrl={currentUrl} profile={profile}
      dismiss={()=>setMenuOpen(false)} open={show}/>}
    <div id={current === 'accueil' ? 'publicite-sous-navigation' : undefined} className="wrap by-masthead-placement"><AdSlot placement={current === 'accueil' ? 'home' : 'masthead'} /></div></>;
}

function Footer({ open }: { open: (name: DialogName) => void }) {
  const lang = usePublicLocale();
  const policyLabels = ['editorial','corrections','privacy','terms'] as const;
  return <footer className="by-footer">
    <div className="wrap"><AdSlot placement="footer"/></div><div className="wrap by-footer-main">
      <div className="by-footer-brand"><Brand /><p>{navText(lang,'perspective')}</p></div>
      <nav aria-label={navText(lang,'explore')}>
        <h2>{navText(lang,'explore')}</h2>
        {(['actualites', 'radio', 'tv', 'podcasts', 'favoris'] as const).map(section =>
          <a key={section} href={localizedHref(editionHref(section),lang)}>{sectionLabel(section,lang)}</a>)}
        <a href="/rss.xml"><Rss size={15} aria-hidden="true" />{navText(lang,'rss')}</a>
      </nav>
      <nav aria-label={navText(lang,'group')}>
        <h2>{navText(lang,'group')}</h2>
        <a href={localizedHref(editionHref('presentations'),lang)}>{sectionLabel('presentations',lang)}</a>
        <button onClick={() => open('marques')}>RadioYO &amp; TVYO</button>
        <button onClick={() => open('abonnement')}>{navText(lang,'subscriptions')}</button>

      </nav>
      <nav aria-label={navText(lang,'transparency')}>
        <h2>{navText(lang,'transparency')}</h2>
        {policies.map((policy,i) => <button key={policy} onClick={() => open(policy)}>{navText(lang,policyLabels[i])}</button>)}
      </nav>
    </div>
    <div className="by-footer-base"><div className="wrap by-footer-colophon">
      <small>© {new Date().getUTCFullYear()} BYRVOX Media Group</small>
      <span className="by-footer-partner">
        {navText(lang,'poweredBy')}
        <Image unoptimized src="/brand/zm06tech.webp" width={500} height={105} loading="lazy" alt="ZM06TECH" />
      </span>
    </div></div>
  </footer>;
}

type EditionProps = {
  mostRated: RatedArticle[] | null;
  leaders: import('../../lib/news-leaders').NewsSlide[];
  route: EditionRoute;
  stories: Summary[];
  headlines: CategoryHeadlines[];
  presentations: Summary[];
  unavailable: boolean;
  hasNext: boolean;
  categories: string[];
};

export function Edition({ mostRated, leaders, route, stories, headlines, presentations, unavailable, hasNext, categories }: EditionProps) {
  const lang = usePublicLocale();
  const [dialog, setDialog] = useState<DialogName | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accountStatus, setAccountStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [savedStories, setSavedStories] = useState<Summary[]>([]);
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const writing = useRef(false);
  const close = useCallback(() => setDialog(null), []);
  useEffect(() => {
    const controller = new AbortController();
    fetch(route.section === 'favoris' ? '/api/profile?lectures=1&lang=' + lang : '/api/profile', { signal: controller.signal, cache: 'no-store' }).then(async response => {
      if (response.status === 401) return null;
      if (!response.ok) throw new Error();
      return await response.json() as Profile & { stories?: Summary[] };
    }).then(data => {
      if (data) {
        setProfile({ name: data.name, legacy: data.legacy, preferences: data.preferences });
        setSavedStories(data.stories || []);
      }
      setAccountStatus('ready');
    }).catch(() => {
      if (!controller.signal.aborted) setAccountStatus('error');
    });
    return () => controller.abort();
  }, [route.section, lang]);

  async function updatePreferences(slug?: string) {
    if (writing.current) return;
    if (!profile) {
      if (accountStatus === 'error') setNotice(navText(lang,'unavailable'));
      else if (accountStatus === 'ready') setDialog('connexion');
      return;
    }
    writing.current = true;
    setPending(true);
    const alreadySaved = slug ? profile.preferences.saved.includes(slug) : false;
    const saved = !slug ? [] : alreadySaved ? profile.preferences.saved.filter(item => item !== slug) : [...profile.preferences.saved, slug];
    const preferences = { ...profile.preferences, saved, topics: slug ? profile.preferences.topics : [] };
    try {
      const response = await fetch('/api/profile', slug ? {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(preferences)
      } : { method: 'DELETE' });
      if (response.status === 401 || response.status === 403) { setProfile(null); setDialog('connexion'); return; }
      if (!response.ok) throw new Error();
      setProfile({ ...profile, preferences });
      if (!slug) setDialog(null);
      setNotice(navText(lang,!slug ? 'cleared' : alreadySaved ? 'removed' : 'added'));
    } catch { setNotice(navText(lang,'failed')); }
    finally { writing.current = false; setPending(false); }
  }
  const saved = profile?.preferences.saved || [];
  function saveButton(story: Summary) {
    const selected = saved.includes(story.slug);
    const SaveIcon = selected ? BookmarkCheck : Bookmark;
    return <button className="save edition-icon-link" disabled={pending || accountStatus === 'loading'} aria-pressed={selected}
      aria-label={navText(lang,selected ? 'remove' : 'save') + ' · ' + story.title}
      onClick={() => updatePreferences(story.slug)}><SaveIcon size={16} aria-hidden="true" />{navText(lang,selected ? 'saved' : 'save')}</button>;
  }
  const currentUrl = localizedHref(editionHref(route.section, route.query, route.category, route.page),lang);
  return <div className="edition-site">
    <a className="skip" href="#main">{navText(lang,'skip')}</a>
    <Header current={route.section} category={route.category} open={setDialog} profile={profile} currentUrl={currentUrl} />
    <main id="main" tabIndex={-1}>
      {route.section === 'accueil'
        ? <EditionFront mostRated={mostRated} stories={stories} headlines={headlines} presentations={presentations} savedCount={saved.length} saveButton={saveButton} unavailable={unavailable} />
        : <SectionContent mostRated={mostRated} leaders={leaders} headlines={headlines} route={route} hasNext={hasNext} publishedCategories={categories} stories={route.section === 'favoris' ? savedStories : stories} presentations={presentations} unavailable={unavailable}
            saved={saved} accountStatus={accountStatus} signedIn={Boolean(profile)} saveButton={saveButton} />}
    </main>
    <Footer open={setDialog} />
    {dialog && <ReaderDialog name={dialog} close={close} open={setDialog} profile={profile} currentUrl={currentUrl}
      query={route.query} pending={pending} clear={() => updatePreferences()} />}
    {notice && <div className="toast" role="status">{notice}<button aria-label={navText(lang,'close')} onClick={() => setNotice('')}><X size={17} aria-hidden="true" /></button></div>}
  </div>;
}

export function ArticleNavigation({children, currentUrl, article}: {children: ReactNode; currentUrl: string; article: { title:string; language:PublicLocale }}) {
  const [dialog, setDialog] = useState<DialogName | null>(null);
  const lang = usePublicLocale();
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/profile', {signal:controller.signal, cache:'no-store'}).then(async r => {
      if (r.ok) setProfile(await r.json() as Profile);
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  const [clearing,setClearing] = useState(false);
  const [clearMessage,setClearMessage] = useState('');
  async function clearPreferences() {
    if (clearing || !profile) return;
    setClearing(true);
    try {
      const result = await fetch('/api/profile',{method:'DELETE'});
      if (!result.ok) throw Error();
      setProfile({...profile,preferences:{saved:[],topics:[]}});
      setDialog(null);
      setClearMessage(navText(lang,'cleared'));
    } catch {setClearMessage(navText(lang,'failed'));}
    finally {setClearing(false);}
  }
  function open(name: DialogName) {
    if (name === 'connexion') {
      window.location.assign(readerAccountUrl('connexion',location.pathname+location.search,lang));
    } else {
      setDialog(name);
    }
  }
  return <>
    <Header current="actualites" profile={profile} open={open} currentUrl={currentUrl} article={article} />
    {children}
    <Footer open={setDialog} />
    {dialog && <ReaderDialog name={dialog} close={() => setDialog(null)} open={open}
      profile={profile} currentUrl={currentUrl} query="" pending={clearing} clear={clearPreferences} />}
    {clearMessage && <div className="toast" role="status">{clearMessage}<button aria-label={navText(lang,'close')} onClick={() => setClearMessage('')}><X size={17}/></button></div>}
  </>;
}
