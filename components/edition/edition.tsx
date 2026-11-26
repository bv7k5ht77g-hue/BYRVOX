'use client';

import { Bookmark, BookmarkCheck, CircleUserRound, Menu, Moon, Rss, Search, Settings2, Sun, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { editionHref, type EditionRoute, type Section, type Summary } from '../../lib/edition';
import type { CategoryHeadlines } from '../../lib/editorial-sections';
import { AdSlot } from './ad-slot';
import { HeaderTopics } from './header-topics';
import { WeatherNav } from '../weather-nav';
import { LanguageSelect, usePublicLocale } from '../language-select';
import { localizedHref, sectionLabel } from '../../lib/i18n';
import { navText } from './navigation-copy';
import { ReadingProgress } from './reading-progress';
import './navigation.css';
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

function Header({ current, category, profile, open }: {
  current: Section; category?: string; profile: Profile | null; open: (name: DialogName) => void;
}) {
  const lang = usePublicLocale();
  const menu = useRef<HTMLDetailsElement>(null);
  function show(name: DialogName) {
    if (menu.current) menu.current.open = false;
    open(name);
  }
  function toggleTheme() {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('byrvox-theme', next); } catch { /* Applies for this page. */ }
  }
  return <><header className="edition-site edition-header"><div className="topbar">
    <Brand />
    <nav className="desktop-nav" aria-label={navText(lang,'main')}><NavLinks current={current} category={category} /></nav>
    <div className="tools"><WeatherNav locale={lang} /><LanguageSelect />
      <button className="tool-icon" aria-label={navText(lang,'search')} onClick={() => show('recherche')}>
        <Search size={20} aria-hidden="true" />
      </button>
      <button className="tool-icon" onClick={toggleTheme}>
        <span className="theme-sun"><Sun size={20} aria-hidden="true" /><span className="edition-sr-only">{navText(lang,'light')}</span></span>
        <span className="theme-moon"><Moon size={20} aria-hidden="true" /><span className="edition-sr-only">{navText(lang,'dark')}</span></span>
      </button>
      <button className="outline account" onClick={() => show(profile ? 'profil' : 'connexion')}><CircleUserRound size={16} aria-hidden="true" /> {navText(lang,profile ? 'account' : 'login')}</button>
      <details className="edition-menu" ref={menu} onKeyDown={event => {
        if (event.key === 'Escape' && menu.current?.open) {
          menu.current.open = false;
          menu.current.querySelector('summary')?.focus();
        }
      }}>
        <summary><Menu className="menu-show" size={19} aria-hidden="true" /><X className="menu-hide" size={19} aria-hidden="true" /> <span className="menu-caption">{navText(lang,'menu')}</span></summary>
        <nav aria-label={navText(lang,'main')}><NavLinks current={current} category={category} />
          <a className="edition-icon-link" aria-current={current === 'favoris' ? 'page' : undefined} href={localizedHref(editionHref('favoris'),lang)}><Bookmark size={16} aria-hidden="true" /> {sectionLabel('favoris',lang)}</a>
          <button onClick={() => show(profile ? 'profil' : 'connexion')}><CircleUserRound size={16} aria-hidden="true" /> {navText(lang,profile ? 'account' : 'login')}</button>
        </nav>
      </details>
    </div>
  </div>
    <ReadingProgress /></header>
    <div className="wrap by-masthead-placement"><AdSlot placement={current === 'accueil' ? 'home' : 'masthead'} /></div></>;
}

function Footer({ open }: { open: (name: DialogName) => void }) {
  const lang = usePublicLocale();
  const policyLabels = ['editorial','corrections','privacy','terms'] as const;
  return <footer><div className="wrap footer-grid">
    <div><Brand /><p>{navText(lang,'perspective')}</p></div>
    <div><b>{navText(lang,'explore')}</b>{(['actualites', 'radio', 'tv', 'podcasts', 'favoris'] as Section[]).map(section =>
      <a key={section} href={localizedHref(editionHref(section),lang)}>{sectionLabel(section,lang)}</a>)}<a className="edition-icon-link" href="/rss.xml"><Rss size={16} aria-hidden="true" /> {navText(lang,'rss')}</a></div>
    <div><b>{navText(lang,'group')}</b><button onClick={() => open('marques')}>RadioYO &amp; TVYO</button>
      <button onClick={() => open('abonnement')}>{navText(lang,'subscriptions')}</button>
      <a className="edition-icon-link" href="/admin"><Settings2 size={16} aria-hidden="true" /> {navText(lang,'editor')}</a></div>
    <div><b>{navText(lang,'transparency')}</b>{policies.map((policy,i) => <button key={policy} onClick={() => open(policy)}>{navText(lang,policyLabels[i])}</button>)}</div>
  </div>
  <div className="wrap footer-bottom">© {new Date().getUTCFullYear()} BYRVOX Media Group <span>v0.7.2</span></div></footer>;
}

type EditionProps = {
  route: EditionRoute;
  stories: Summary[];
  headlines: CategoryHeadlines[];
  presentations: Summary[];
  unavailable: boolean;
  hasNext: boolean;
  categories: string[];
};

export function Edition({ route, stories, headlines, presentations, unavailable, hasNext, categories }: EditionProps) {
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
        setProfile({ name: data.name, preferences: data.preferences });
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
    <Header current={route.section} category={route.category} open={setDialog} profile={profile} />
    <main id="main" tabIndex={-1}>
      {route.section === 'accueil'
        ? <EditionFront stories={stories} headlines={headlines} presentations={presentations} savedCount={saved.length} saveButton={saveButton} unavailable={unavailable} />
        : <SectionContent headlines={headlines} route={route} hasNext={hasNext} publishedCategories={categories} stories={route.section === 'favoris' ? savedStories : stories} presentations={presentations} unavailable={unavailable}
            saved={saved} accountStatus={accountStatus} signedIn={Boolean(profile)} saveButton={saveButton} />}
    </main>
    <Footer open={setDialog} />
    {dialog && <ReaderDialog name={dialog} close={close} open={setDialog} profile={profile} currentUrl={currentUrl}
      query={route.query} pending={pending} clear={() => updatePreferences()} />}
    {notice && <div className="toast" role="status">{notice}<button aria-label={navText(lang,'close')} onClick={() => setNotice('')}><X size={17} aria-hidden="true" /></button></div>}
  </div>;
}

export function ArticleNavigation() {
  const lang = usePublicLocale();
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/profile', {signal:controller.signal, cache:'no-store'}).then(async r => {
      if (r.ok) setProfile(await r.json() as Profile);
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  function open(name: DialogName) {
    if (name === 'connexion') {
      window.location.assign('/signin-with-chatgpt?return_to='+encodeURIComponent(location.pathname+location.search));
    } else {
      window.location.assign(localizedHref(editionHref(name==='recherche'?'recherche':'favoris'),lang));
    }
  }
  return <Header current="actualites" profile={profile} open={open} />;
}
