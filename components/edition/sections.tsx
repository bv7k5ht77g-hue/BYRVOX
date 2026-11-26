import { AudioLines, Bookmark, BookOpen, Mail, Newspaper, Radio, RefreshCw, Search, Tv } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { articleHref, editionHref, fold, type EditionRoute, type Section, type Summary } from '../../lib/edition';
import { categoryLabel, localizedHref, sectionLabel, type PublicLocale } from '../../lib/i18n';
import { usePublicLocale } from '../language-select';
import { AdSlot } from './ad-slot';
import { CoverFigure } from './cover-figure';
import type { DialogName } from './reader-dialog';
import { sectionText } from './section-copy';
import './front-page.css';

const channels = [
  { section: 'actualites', name: 'NEWS', icon: Newspaper, text: 'newsChannel' },
  { section: 'radio', name: 'RADIO', icon: Radio, text: 'radioChannel' },
  { section: 'tv', name: 'TV', icon: Tv, text: 'tvChannel' }
] as const;
const formats = {
  radio: { description: 'radioInfo', slug: 'radio', cta: 'aboutRadio', image: 'radio-live' },
  tv: { description: 'tvInfo', slug: 'studio', cta: 'aboutStudio', image: 'tv-live' },
  podcasts: { description: 'podcastsInfo', slug: 'radio', cta: 'aboutRadio', image: 'radio' },
  emissions: { description: 'showsInfo', slug: 'studio', cta: 'aboutStudio', image: 'tv' },
  dossiers: { description: 'dossiersInfo', slug: 'verification', cta: 'aboutMethod', image: 'news' }
} as const;
const dateFormat = (lang: PublicLocale, time: boolean): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', ...(time ? { hour: '2-digit', minute: '2-digit' } : {year:'numeric'}), timeZone: 'America/Toronto' });

function StoryDate({ story, lang, withTime = false }: { story: Summary; lang: PublicLocale; withTime?: boolean }) {
  if (!story.publishedAt || !Number.isFinite(Date.parse(story.publishedAt))) return <>{sectionText(lang, story.presentation ? 'feature' : 'reporting')}</>;
  return <time dateTime={story.publishedAt}>{dateFormat(lang, withTime).format(new Date(story.publishedAt))}</time>;
}

function ChannelCards({ direct = false, lang }: { direct?: boolean; lang: PublicLocale }) {
  const cards = direct ? channels.slice(1) : channels;
  return <nav className="by-channels" id="chaines" aria-label={sectionText(lang, 'coverage')}>
    {cards.map(channel => <a key={channel.section} href={localizedHref(editionHref(channel.section),lang)}>
      <channel.icon size={28} strokeWidth={1.6} aria-hidden="true" />
      <div><strong dir="ltr">BYRVOX {channel.name}</strong><span>{sectionText(lang, direct ? 'upcoming' : channel.text)}</span></div>
    </a>)}
  </nav>;
}

function FrontLead({ story, lang }: { story: Summary; lang: PublicLocale }) {
  const href = localizedHref(articleHref(story), lang);
  return <article className={'by-lead' + (!story.photo ? ' by-lead-type' : '')}>
    <div className="by-lead-meta"><span>{sectionText(lang, story.presentation ? 'feature' : 'lead')}</span><b>{categoryLabel(story.category, lang)}</b></div>
    <h1 id="lead-title" lang={story.contentLocale} dir="auto"><a href={href}>{story.title}</a></h1>
    <p className="by-deck" lang={story.contentLocale} dir="auto">{story.summary}</p>
    {story.photo ? <CoverFigure photo={story.photo} href={href} priority /> :
      story.image && <a className="by-feature-photo" href={href} aria-label={story.title}><Image unoptimized width={900} height={400} src={'/media/' + story.image + '.webp'} alt="" priority /></a>}
    <div className="by-lead-bottom"><small><StoryDate story={story} lang={lang} /></small>
      <a href={href}><BookOpen size={16} aria-hidden="true" />{sectionText(lang,'read')}</a></div>
  </article>;
}

function StoryCard({ story, save, lang, showSummary = false }: { story: Summary; save?: ReactNode; lang: PublicLocale; showSummary?: boolean }) {
  const src = story.photo?.thumbnailUrl || story.photo?.url || (story.image ? '/media/' + story.image + '.webp' : undefined);
  return <article className="by-card"><a href={localizedHref(articleHref(story),lang)}>
    {src && <div className="by-card-photo"><Image unoptimized src={src} width={450} height={250} loading="lazy" decoding="async" alt="" /></div>}
    <p className="by-category">{categoryLabel(story.category,lang)}</p><h3 lang={story.contentLocale} dir="auto">{story.title}</h3>
    {showSummary && <p className="by-card-summary" lang={story.contentLocale} dir="auto">{story.summary}</p>}
    <small><StoryDate story={story} lang={lang} /></small>
  </a>{save}</article>;
}

function LatestFeed({ stories, lang }: { stories: Summary[]; lang: PublicLocale }) {
  return <section className="by-feed" aria-labelledby="feed-title">
    <h2 id="feed-title"><AudioLines size={21} aria-hidden="true" />{sectionText(lang, 'wire')}</h2>
    <ul>{stories.map(story => <li key={story.slug}><a href={localizedHref(articleHref(story),lang)}>
      <div><span className="by-category">{categoryLabel(story.category,lang)}</span><h3 lang={story.contentLocale} dir="auto">{story.title}</h3><small><StoryDate story={story} lang={lang} withTime /></small></div>
      {story.photo && <Image unoptimized loading="lazy" decoding="async" width={128} height={88} src={story.photo.thumbnailUrl || story.photo.url} alt="" />}
    </a></li>)}</ul>
    <a className="by-section-link" href={localizedHref(editionHref('actualites'),lang)}>{sectionText(lang,'allNews')}</a>
  </section>;
}

type FrontProps = { stories: Summary[]; presentations: Summary[]; unavailable: boolean; open: (name: DialogName) => void };
export function EditionFront({ stories, presentations, unavailable, open }: FrontProps) {
  const lang = usePublicLocale();
  const [latest, ...remaining] = stories;
  const lead = latest || presentations[0];
  const feed = remaining.slice(0, 4);
  const extras = remaining.slice(4, 8);
  const features = presentations.filter(story=>story.slug!==lead?.slug);
  return <div className="wrap by-home">
    {unavailable && <p role="status" className="by-feed-status">{sectionText(lang,'unavailable')}</p>}
    {!latest && !unavailable && <p className="by-feed-status">{sectionText(lang,'emptyNews')}</p>}
    {lead && <div className={'by-front-grid' + (feed.length ? '' : ' by-single')}>
      <FrontLead story={lead} lang={lang} />
      {feed.length>0 && <LatestFeed stories={feed} lang={lang} />}
    </div>}
    <AdSlot placement="home" />
    {extras.length>0 && <section className="by-section" aria-labelledby="also-title">
      <div className="by-section-title"><h2 id="also-title">{sectionText(lang,'also')}</h2>
        <a className="by-section-link" href={localizedHref(editionHref('actualites'),lang)}>{sectionText(lang,'allNews')}</a></div>
      <div className="by-story-grid">{extras.map(story=><StoryCard key={story.slug} story={story} lang={lang}/>)}</div>
    </section>}
    <section className="by-section" aria-labelledby="channels-title"><div className="by-section-title"><h2 id="channels-title">{sectionText(lang,'coverage')}</h2></div>
      <ChannelCards lang={lang} /></section>
    <section className="by-project" aria-labelledby="project-title"><div className="by-section-title">
      <h2 id="project-title">{sectionText(lang, 'project')}</h2><a className="by-section-link" href={localizedHref(editionHref('presentations'),lang)}>{sectionText(lang,'allFeatures')}</a>
    </div>
      <div className="by-project-links">{features.slice(0,3).map(story=><a key={story.slug} lang={story.contentLocale} dir="auto" href={localizedHref(articleHref(story),lang)}>{story.title}</a>)}</div>
      <button className="by-section-link by-mail" onClick={()=>open('newsletters')}><Mail size={16} aria-hidden="true" />{sectionText(lang,'subscribe')}</button>
    </section>
  </div>;
}

function SearchForm({ route, lang }: { route: EditionRoute; lang: PublicLocale }) {
  return <form className="edition-search" action="/" role="search">
    <input type="hidden" name="rubrique" value={route.section} />
    {lang !== 'fr' && <input type="hidden" name="lang" value={lang} />}
    {route.category && <input type="hidden" name="categorie" value={route.category} />}
    <input type="search" name="q" aria-label={sectionText(lang,'searchField')} placeholder={sectionText(lang,'placeholder')} defaultValue={route.query} maxLength={160} />
    <button className="outline" type="submit"><Search size={16} aria-hidden="true" />{sectionText(lang,'search')}</button>
  </form>;
}

type SectionProps = Omit<FrontProps, 'open'> & {
  hasNext: boolean; publishedCategories: string[]; route: EditionRoute; saved: string[];
  signedIn: boolean; accountStatus: string; saveButton: (story: Summary) => ReactNode;
};
export function SectionContent({ route, stories, presentations, unavailable, saved, signedIn, accountStatus, saveButton, hasNext, publishedCategories }: SectionProps) {
  const lang = usePublicLocale();
  const href = (path: string)=>localizedHref(path,lang);
  const { section, query, category, page } = route;
  const format = Object.hasOwn(formats, section) ? formats[section as keyof typeof formats] : undefined;
  const serverFiltered = section === 'actualites' || section === 'recherche';
  const visiblePresentations = section === 'recherche' && page !== 1 ? [] : presentations;
  const articles = section === 'actualites' ? stories : section === 'presentations' ? presentations : [...stories, ...visiblePresentations];
  const pool = section === 'favoris' ? articles.filter(story => saved.includes(story.slug)) : articles;
  const categories = [...new Set([...publishedCategories, ...pool.map(story => story.category), ...(section === 'recherche' ? presentations.map(story => story.category) : [])])];
  const terms = fold(query).split(/\s+/).filter(Boolean);
  const list = pool.filter(story => (serverFiltered && !story.presentation) || ((!category || fold(story.category) === fold(category)) &&
    terms.every(term => fold([story.title, story.category, categoryLabel(story.category,lang), story.summary, story.slug].join(' ')).includes(term))));
  const empty = category || query ? 'noMatch' : page>1 ? 'noPage' : section==='favoris' ? 'emptySaved' : section==='actualites' ? 'emptyNews' : 'empty';
  function card(story: Summary) { return <StoryCard key={story.slug} story={story} save={saveButton(story)} lang={lang} showSummary/>; }
  return <div className="wrap section-page by-index"><section className="page-title">
    <a className="by-section-link" href={href('/')}>{sectionLabel('accueil',lang)}</a>
    <h1>{sectionLabel(section,lang)}</h1>
    {(section==='favoris'||section==='recherche') && <p>{sectionText(lang,section==='favoris'?'favoritesIntro':'searchIntro')}</p>}
  </section>
    {format ? <section className="availability format-card">
      <Image unoptimized src={'/media/' + format.image + '.webp'} width="900" height="400" alt="" />
      <div><h2>{sectionText(lang,'upcoming')}</h2><p>{sectionText(lang,format.description)}</p>
        <a href={href('/article/' + format.slug)} className="outline">{sectionText(lang,format.cta)}</a></div>
    </section> : section === 'direct' ? <ChannelCards direct lang={lang}/> : <section className="content-section">
      {section === 'favoris' && !signedIn ? <div className="empty">
        {accountStatus === 'loading' ? sectionText(lang,'loading') : accountStatus === 'error' ? <><p>{sectionText(lang,'accountError')}</p><a className="edition-icon-link" href={href(editionHref('favoris'))}><RefreshCw size={16} aria-hidden="true" />{sectionText(lang,'retry')}</a></> :
          <><p>{sectionText(lang,'loginPrompt')}</p><a className="outline" href={'/signin-with-chatgpt?return_to=' + encodeURIComponent(href(editionHref('favoris')))} target="_top">{sectionText(lang,'login')}</a></>}
      </div> : <>
        <div className="by-section-title"><h2>{sectionText(lang,section==='recherche'?'results':section==='favoris'?'saved':section==='presentations'?'presentations':'wire')}</h2>
          {section !== 'favoris' && <a className="by-section-link" href={href(editionHref('favoris'))}><Bookmark size={15} aria-hidden="true" />{sectionLabel('favoris',lang)}</a>}</div>
        {(pool.length > 0 || section === 'recherche' || query || category) && <div className="filter-area"><SearchForm route={route} lang={lang} />
          {categories.length > 0 && <nav className="edition-filters" aria-label={sectionText(lang,'filter')}>
            {['', ...categories].map(item => <a key={item} href={href(editionHref(section, query, item))}
              aria-current={fold(category) === fold(item) ? 'true' : undefined}>{item ? categoryLabel(item,lang) : sectionText(lang,'all')}</a>)}</nav>}
        </div>}
        {unavailable && section !== 'presentations' && <div className="empty"><p>{sectionText(lang,'unavailable')}</p><a className="edition-icon-link" href={href(editionHref(section, query, category))}><RefreshCw size={16} aria-hidden="true" />{sectionText(lang,'retry')}</a></div>}
        {list.length>0 ? <><div className="by-story-grid">{(section==='actualites'?list.slice(0,4):list).map(card)}</div>
          {section==='actualites' && <><AdSlot placement="news"/>{list.length>4 && <div className="by-story-grid">{list.slice(4).map(card)}</div>}</>}
        </> : (!unavailable || section === 'presentations') && <div className="empty"><p>{sectionText(lang,empty)}</p>
          {category || query || page>1 ? <a href={href(editionHref(section))}>{sectionText(lang,'reset')}</a> : <a href={href(editionHref('presentations'))}>{sectionText(lang,'allFeatures')}</a>}</div>}
        {serverFiltered && (hasNext || page>1) && <nav className="edition-pagination" aria-label={sectionText(lang,'pagination')}>
          {page>1 && <a className="outline" rel="prev" href={href(editionHref(section,query,category,page-1))}>{sectionText(lang,'prev')}</a>}
          <span>{sectionText(lang,'page')} {new Intl.NumberFormat(lang).format(page)}</span>
          {hasNext && <a className="outline" rel="next" href={href(editionHref(section,query,category,page+1))}>{sectionText(lang,'next')}</a>}
        </nav>}
      </>}
    </section>}
  </div>;
}
