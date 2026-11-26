import { PortalThemeToggle } from './theme-toggle';
import { SITE_ORIGIN } from '../../lib/site-url';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { AudioLines, BookOpen, Clapperboard, History, LayoutDashboard, Menu, Settings2, SquarePen, X } from 'lucide-react';

const sections = [
  { name: 'Tableau de bord', icon: LayoutDashboard },
  { name: 'Articles', icon: BookOpen },
  { name: 'Éditeur', icon: SquarePen },
  { name: 'PULSE AI', icon: AudioLines },
  { name: 'Studio AI', icon: Clapperboard },
  { name: 'Historique', icon: History },
  { name: 'Intégrations', icon: Settings2 },
];

export function AdminNavigation({ tab, busy, onNavigate }: { tab: string; busy: boolean; onNavigate: (tab: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return <aside className="sidebar portal-sidebar" onKeyDown={event => {
    if (expanded && event.key === 'Escape') { setExpanded(false); toggle.current?.focus(); }
  }}>
    <div className="portal-brand"><a href={SITE_ORIGIN} className="brand" aria-label="BYRVOX, accueil">
      <Image unoptimized width={600} height={112} src="/brand/logo-dark.png" alt="BYRVOX" /></a>
      <PortalThemeToggle/>
      <button ref={toggle} type="button" className="portal-menu-toggle" aria-controls="portal-navigation"
        aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        {expanded ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />} Menu
      </button>
    </div>
    <nav id="portal-navigation" aria-label="Navigation de la rédaction" className={expanded ? 'is-open' : ''}>
      {sections.map(({name, icon: Icon}) => <button key={name} aria-current={name === tab ? 'page' : undefined}
        disabled={busy} onClick={() => {
          setExpanded(false); onNavigate(name);
        }}><Icon size={18} aria-hidden="true" /> {name}</button>)}
      <a className="portal-site-link" href={SITE_ORIGIN}>Voir le site public</a>
      <form method="post" action="/api/editor-session/logout"><button type="submit">Se déconnecter</button></form>
    </nav>
  </aside>;
}
