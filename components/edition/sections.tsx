import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { articleHref, editionHref, fold, sections, type EditionRoute, type Section, type Summary } from '../../lib/edition';
import type { DialogName } from './reader-dialog';

const channels = [
  { section: 'actualites', name: 'News', image: 'news', text: 'Actualités, sources et décryptages.', cta: 'Lire les actualités' },
  { section: 'radio', name: 'Radio', image: 'radio', text: 'Entretiens, débats et formats audio.', cta: 'Découvrir la radio' },
  { section: 'tv', name: 'TV', image: 'tv', text: 'Le journal en images et les formats du studio.', cta: 'Découvrir la télévision' }
] as const;
const formats = {
  radio: { title: 'La radio se prépare.', text: 'BYRVOX Radio prépare ses entretiens et ses débats. La date de la première diffusion sera annoncée ici.', slug: 'radio', cta: 'Lire la présentation de la radio', image: 'radio-live' },
  tv: { title: 'Dans les coulisses du studio.', text: 'BYRVOX TV prépare ses journaux en images. La date du premier direct sera annoncée ici.', slug: 'studio', cta: 'Découvrir le studio', image: 'tv-live' },
  podcasts: { title: 'Les premiers podcasts sont en préparation.', text: 'Les épisodes à écouter et leurs notes de production seront réunis dans cette rubrique.', slug: 'radio', cta: 'Découvrir le projet audio', image: 'radio' },
  emissions: { title: 'La grille des émissions se construit.', text: 'Retrouve ici les rendez-vous de la radio et de la télévision dès leur programmation.', slug: 'studio', cta: 'Découvrir les formats du studio', image: 'tv' },
  dossiers: { title: 'Les dossiers sont en préparation.', text: 'La rédaction réunira ici ses enquêtes, leurs sources et les articles qui les prolongent.', slug: 'verification', cta: 'Lire notre méthode de vérification', image: 'news' }
} as const;
const dateFormat = new Intl.DateTimeFormat('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Toronto' });

function StoryDate({ story }: { story: Summary }) {
  if (story.presentation) return <>Présentation du média</>;
  if (!story.publishedAt) return <>Article de la rédaction</>;
  return <time dateTime={story.publishedAt}>{dateFormat.format(new Date(story.publishedAt))}</time>;
}

function ChannelCards({ direct = false }: { direct?: boolean }) {
  const cards = direct ? channels.slice(1) : channels;
  return <section className={'channels' + (direct ? ' direct-channels' : '')} id="chaines" aria-label="Les rubriques BYRVOX">
    {cards.map(channel => <a className={'channel ' + channel.image} key={channel.section} href={editionHref(channel.section)}>
      <Image unoptimized loading="lazy" decoding="async" width="900" height="400" src={'/media/' + channel.image + '.webp'} alt="" />
      <div><h2>BYRVOX <em>{channel.name.toUpperCase()}</em></h2>
        <p>{direct ? 'Direct en préparation.' : channel.text}</p><span className="glass">{channel.cta} <span aria-hidden="true">→</span></span></div>
    </a>)}
  </section>;
}

type FrontProps = { stories: Summary[]; presentations: Summary[]; unavailable: boolean; open: (name: DialogName) => void };
export function EditionFront({ stories, presentations, unavailable, open }: FrontProps) {
  const lead = stories[0] || presentations[0];
  const stack = presentations.filter(story => story.slug !== lead.slug).slice(0, 3);
  const feed = stories.slice(1, 6);
  return <>
    <section className="hero"><picture className="hero-image"><source media="(max-width: 640px)" srcSet="/media/hero-mobile.webp" />
      <img src="/media/hero.webp" width="1104" height="540" fetchPriority="high" alt="" /></picture>
      <div className="wrap hero-content"><p className="eyebrow">INFORMATION · RADIO · TÉLÉVISION</p>
        <h1>L’information<br />nouvelle génération<span>.</span></h1>
        <p>Comprendre les faits, remonter aux sources et découvrir les voix de BYRVOX.</p>
        <div className="actions"><a className="red" href={stories.length ? articleHref(lead) : '/article/notre-methode'}>{stories.length ? 'Lire la une' : 'Découvrir notre démarche'} <span aria-hidden="true">→</span></a>
          <a className="outline" href="#chaines">Explorer les rubriques</a></div>
      </div>
    </section>
    <div className="wrap">
      <div className="launch"><span className="dot" /> ÉDITION DE LANCEMENT <span>Les directs radio et TV sont en préparation.</span></div>
      <ChannelCards />
      <section className="headlines" aria-label="La sélection de la rédaction">
        <div><div className="section-title"><h2>{stories.length ? 'À la une' : 'À la découverte de BYRVOX'}</h2></div>
          <a href={articleHref(lead)} className={lead.presentation ? "lead-story" : "lead-story published-lead"}>
            {lead.image && <Image unoptimized loading="lazy" decoding="async" width="900" height="400" src={'/media/' + lead.image + '.webp'} alt="" />}
            <div><span className="pill">{lead.category}</span><h3>{lead.title}</h3><p>{lead.summary}</p><small><StoryDate story={lead} /></small></div>
          </a>
        </div>
        <div className="story-stack"><h2>Le projet BYRVOX</h2>{stack.map(story =>
          <a href={articleHref(story)} key={story.slug}><Image unoptimized loading="lazy" decoding="async" width="88" height="78" src={'/media/' + story.image + '.webp'} alt="" />
            <div><span className="eyebrow">{story.category}</span><h3>{story.title}</h3></div></a>)}
          <a className="text-button" href={editionHref('presentations')}>Toutes les présentations →</a>
        </div>
        <aside className="feed"><h2>Le fil info</h2>
          {feed.length ? feed.map(story => <a className="feed-entry" href={articleHref(story)} key={story.slug}>
            <small><StoryDate story={story} /></small><p>{story.title}</p></a>) : <div className="empty-feed">
            <p>{unavailable ? 'Le fil est temporairement indisponible.' : stories.length ? 'La dernière publication est à la une.' : 'Le premier article apparaîtra ici après sa publication par la rédaction.'}</p></div>}
          <a className="outline" href={editionHref('actualites')}>Toutes les actualités →</a></aside>
      </section>
      <section className="app-banner"><div><p className="eyebrow">WEB ET MOBILE</p><h2>BYRVOX te suit partout.</h2>
        <p>Lis BYRVOX sur ton navigateur et garde les articles que tu veux retrouver.</p><a className="outline" href={editionHref('favoris')}>Mes favoris →</a></div>
        <div className="phone" aria-hidden="true"><Image unoptimized loading="lazy" decoding="async" src="/brand/logo-dark.png" width="150" height="29" alt="" />
          <div className="phone-screen">BEYOND<br />THE<br /><span>HEADLINES.</span></div><small>NEWS · RADIO · TV</small></div>
        <ul><li>Articles et décryptages</li><li>Lectures sauvegardées</li><li>Applications en préparation</li></ul>
      </section>
      <section className="newsletter"><div><p className="eyebrow">BYRVOX MAIL</p><h2>L’essentiel. Avec du recul.</h2>
        <p>Découvre les éditions de la newsletter en préparation.</p></div>
        <button className="red" onClick={() => open('newsletters')}>Découvrir les éditions →</button></section>
    </div>
  </>;
}

const descriptions: Partial<Record<Section, string>> = {
  actualites: 'Les articles publiés par la rédaction, du plus récent au plus ancien.',
  presentations: 'L’équipe, ses méthodes et les formats en préparation.',
  favoris: 'Retrouve les lectures que tu as sauvegardées.',
  recherche: 'Retrouve un article ou une présentation par titre, sujet ou rubrique.',
  direct: 'Suis la préparation des directs de BYRVOX Radio et BYRVOX TV.'
};

function SearchForm({ route }: { route: EditionRoute }) {
  return <form className="edition-search" action="/" role="search">
    <input type="hidden" name="rubrique" value={route.section} />
    {route.category && <input type="hidden" name="categorie" value={route.category} />}
    <input type="search" name="q" aria-label="Rechercher dans cette rubrique" placeholder="Rechercher un sujet…" defaultValue={route.query} maxLength={160} />
    <button className="outline" type="submit">Rechercher</button>
  </form>;
}

function StoryCard({ story, save }: { story: Summary; save: ReactNode }) {
  return <article className={story.image ? 'story-card' : 'story-card published-card'}><a href={articleHref(story)}>
    {story.image && <div className="thumb"><Image unoptimized src={'/media/' + story.image + '.webp'} width="900" height="400" loading="lazy" decoding="async" alt="" />
      <span>PRÉSENTATION</span></div>}
    <p className="eyebrow">{story.category}</p><h3>{story.title}</h3><p>{story.summary}</p>
    <small><StoryDate story={story} /></small></a>{save}</article>;
}

type SectionProps = Omit<FrontProps, 'open'> & {
  hasNext: boolean; publishedCategories: string[];
  route: EditionRoute; saved: string[]; signedIn: boolean; accountStatus: string; saveButton: (story: Summary) => ReactNode;
};
export function SectionContent({ route, stories, presentations, unavailable, saved, signedIn, accountStatus, saveButton, hasNext, publishedCategories }: SectionProps) {
  const { section, query, category, page } = route;
  const format = Object.hasOwn(formats, section) ? formats[section as keyof typeof formats] : undefined;
  const serverFiltered = section === 'actualites' || section === 'recherche';
  const visiblePresentations = section === 'recherche' && page !== 1 ? [] : presentations;
  const articles = section === 'actualites' ? stories : section === 'presentations' ? presentations : [...stories, ...visiblePresentations];
  const pool = section === 'favoris' ? articles.filter(story => saved.includes(story.slug)) : articles;
  const categories = [...new Set([
    ...publishedCategories, ...pool.map(story => story.category),
    ...(section === 'recherche' ? presentations.map(story => story.category) : [])
  ])];
  const terms = fold(query).split(/\s+/).filter(Boolean);
  const list = pool.filter(story => (serverFiltered && !story.presentation) || ((!category || fold(story.category) === fold(category)) &&
    terms.every(term => fold([story.title, story.category, story.summary, story.slug].join(' ')).includes(term))));
  let empty = section === 'favoris' ? 'Tu n’as pas encore enregistré de lecture.' : section === 'actualites' ? 'La rédaction prépare ses premières publications.' : 'Aucun contenu disponible.';
  if (page > 1) empty = 'Aucun résultat sur cette page.';
  if (category || query) empty = 'Aucun résultat pour cette sélection.';
  return <div className="wrap section-page"><section className="page-title">
    <Link className="eyebrow" prefetch={false} href="/">Accueil</Link>
    <h1>{sections[section]}</h1>{descriptions[section] && <p>{descriptions[section]}</p>}</section>
    {format ? <section className="availability format-card">
      <Image unoptimized src={'/media/' + format.image + '.webp'} width="900" height="400" alt="" />
      <div><p className="eyebrow">EN PRÉPARATION</p><h2>{format.title}</h2><p>{format.text}</p>
        <a href={'/article/' + format.slug} className="outline">{format.cta} →</a></div>
    </section> : section === 'direct' ? <ChannelCards direct /> : <section className="content-section">
      {section === 'favoris' && !signedIn ? <div className="empty">
        {accountStatus === 'loading' ? 'Chargement de tes favoris…' : accountStatus === 'error' ? <><p>Ton espace est temporairement indisponible.</p><a href={editionHref('favoris')}>Réessayer →</a></> :
          <><p>Connecte-toi pour retrouver tes articles sauvegardés.</p><a className="outline" href={'/signin-with-chatgpt?return_to=' + encodeURIComponent(editionHref('favoris'))} target="_top">Se connecter</a></>}
      </div> : <>
        <div className="section-title"><h2>{section === 'recherche' ? 'Résultats' : section === 'favoris' ? 'Tes lectures' : section === 'presentations' ? 'Les présentations' : 'Le fil de la rédaction'}</h2>
          {section !== 'favoris' && <a className="text-button" href={editionHref('favoris')}>Mes favoris →</a>}</div>
        {(pool.length > 0 || section === 'recherche' || query || category) && <div className="filter-area"><SearchForm route={route} />
          {categories.length > 0 && <nav className="edition-filters" aria-label="Filtrer par catégorie">
            {['', ...categories].map(item => <a key={item} href={editionHref(section, query, item)}
              aria-current={fold(category) === fold(item) ? 'true' : undefined}>{item || 'Tout'}</a>)}</nav>}
        </div>}
        {unavailable && section !== 'presentations' && <div className="empty"><p>Le fil d’actualité est temporairement indisponible.</p><a href={editionHref(section, query, category)}>Réessayer →</a></div>}
        {list.length > 0 ? <div className="content-grid">{list.map(story => <StoryCard key={story.slug} story={story} save={saveButton(story)} />)}</div> :
          (!unavailable || section === 'presentations') && <div className="empty"><p>{empty}</p>
            {category || query || page > 1 ? <a href={editionHref(section)}>Effacer les filtres →</a> : <a href={editionHref('presentations')}>Découvrir les présentations du média →</a>}</div>}
        {serverFiltered && (hasNext || page > 1) && <nav className="edition-pagination" aria-label="Pagination">
          {page > 1 && <a className="outline" rel="prev" href={editionHref(section, query, category, page - 1)}>← Précédent</a>}
          <span>Page {page}</span>
          {hasNext && <a className="outline" rel="next" href={editionHref(section, query, category, page + 1)}>Suivant →</a>}
        </nav>}
      </>}
    </section>}
  </div>;
}
