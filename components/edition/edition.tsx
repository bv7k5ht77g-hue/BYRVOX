'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { editionHref, sections, type EditionRoute, type Section, type Summary } from '../../lib/edition';
import { EditionFront, SectionContent } from './sections';
import { ReaderDialog, type DialogName, type Profile } from './reader-dialog';

const navigation: Section[] = ['accueil', 'actualites', 'radio', 'tv', 'podcasts', 'emissions', 'dossiers'];
const policies = ['Politique éditoriale', 'Corrections', 'Confidentialité', 'Conditions d’utilisation'] as const;

export function Brand() {
  return <Link prefetch={false} className="brand edition-brand" href="/" aria-label="BYRVOX, accueil">
    <span className="brand-mark" aria-hidden="true" />
    <small>BEYOND THE HEADLINES</small>
  </Link>;
}

function NavLinks({ current }: { current: Section }) {
  return navigation.map(section => <a key={section} href={editionHref(section)}
    aria-current={current === section ? 'page' : undefined}>{sections[section]}</a>);
}

function Header({ current, profile, open }: {
  current: Section; profile: Profile | null; open: (name: DialogName) => void;
}) {
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
  return <header className="edition-header"><div className="topbar">
    <Brand />
    <nav className="desktop-nav" aria-label="Navigation principale"><NavLinks current={current} /></nav>
    <div className="tools">
      <button className="tool-icon" aria-label="Rechercher" onClick={() => show('recherche')}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10" cy="10" r="6.5" /><path d="m15 15 6 6" /></svg>
      </button>
      <button className="tool-icon" onClick={toggleTheme} aria-label="Changer le thème clair ou sombre"><span className="theme-sun" aria-hidden="true">☀</span><span className="theme-moon" aria-hidden="true">☾</span></button>
      <button className="outline account" onClick={() => show(profile ? 'profil' : 'connexion')}>{profile ? 'Mon compte' : 'Se connecter'}</button>
      <details className="edition-menu" ref={menu} onKeyDown={event => {
        if (event.key === 'Escape' && menu.current?.open) {
          menu.current.open = false;
          menu.current.querySelector('summary')?.focus();
        }
      }}>
        <summary>Menu <span aria-hidden="true">☰</span></summary>
        <nav aria-label="Menu principal"><NavLinks current={current} />
          <a href={editionHref('favoris')}>Mes favoris</a>
          <button onClick={() => show(profile ? 'profil' : 'connexion')}>{profile ? 'Mon compte' : 'Se connecter'}</button>
        </nav>
      </details>
    </div>
  </div></header>;
}

function Footer({ open }: { open: (name: DialogName) => void }) {
  return <footer><div className="wrap footer-grid">
    <div><Brand /><p>Un nouveau regard sur le monde.</p></div>
    <div><b>Explorer</b>{(['actualites', 'radio', 'tv', 'podcasts', 'favoris'] as Section[]).map(section =>
      <a key={section} href={editionHref(section)}>{sections[section]}</a>)}<a href="/rss.xml">Flux RSS</a></div>
    <div><b>Le groupe</b><button onClick={() => open('marques')}>RadioYO &amp; TVYO</button>
      <Link prefetch={false} href="/article/notre-methode">Notre démarche</Link><button onClick={() => open('abonnement')}>Abonnements</button>
      <a href="/admin">Command Center ↗</a></div>
    <div><b>Transparence</b>{policies.map(policy => <button key={policy} onClick={() => open(policy)}>{policy}</button>)}</div>
  </div>
  <div className="wrap footer-bottom">© {new Date().getUTCFullYear()} BYRVOX Media Group <span>v0.2.0 · Information · Radio · Télévision · Podcasts</span></div></footer>;
}

type EditionProps = {
  route: EditionRoute;
  stories: Summary[];
  presentations: Summary[];
  unavailable: boolean;
  hasNext: boolean;
  categories: string[];
};

export function Edition({ route, stories, presentations, unavailable, hasNext, categories }: EditionProps) {
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
    fetch(route.section === 'favoris' ? '/api/profile?lectures=1' : '/api/profile', { signal: controller.signal, cache: 'no-store' }).then(async response => {
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
  }, [route.section]);

  async function updatePreferences(slug?: string) {
    if (writing.current) return;
    if (!profile) {
      if (accountStatus === 'error') setNotice('Ton espace est temporairement indisponible.');
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
      setNotice(!slug ? 'Tes préférences ont été effacées.' : alreadySaved ? 'Article retiré de tes favoris.' : 'Article ajouté à tes favoris.');
    } catch { setNotice('Impossible de modifier tes préférences. Réessaie dans un instant.'); }
    finally { writing.current = false; setPending(false); }
  }
  const saved = profile?.preferences.saved || [];
  function saveButton(story: Summary) {
    const selected = saved.includes(story.slug);
    return <button className="save" disabled={pending || accountStatus === 'loading'} aria-pressed={selected}
      aria-label={(selected ? 'Retirer des favoris : ' : 'Sauvegarder : ') + story.title}
      onClick={() => updatePreferences(story.slug)}>{selected ? '◆ Enregistré' : '◇ Sauvegarder'}</button>;
  }
  const currentUrl = editionHref(route.section, route.query, route.category, route.page);
  return <div className="edition-site">
    <a className="skip" href="#main">Aller au contenu</a>
    <Header current={route.section} open={setDialog} profile={profile} />
    <main id="main" tabIndex={-1}>
      {route.section === 'accueil'
        ? <EditionFront stories={stories} presentations={presentations} unavailable={unavailable} open={setDialog} />
        : <SectionContent route={route} hasNext={hasNext} publishedCategories={categories} stories={route.section === 'favoris' ? savedStories : stories} presentations={presentations} unavailable={unavailable}
            saved={saved} accountStatus={accountStatus} signedIn={Boolean(profile)} saveButton={saveButton} />}
    </main>
    <Footer open={setDialog} />
    {dialog && <ReaderDialog name={dialog} close={close} open={setDialog} profile={profile} currentUrl={currentUrl}
      query={route.query} pending={pending} clear={() => updatePreferences()} />}
    {notice && <div className="toast" role="status">{notice}<button aria-label="Fermer la notification" onClick={() => setNotice('')}>×</button></div>}
  </div>;
}
