import { ArrowLeft, ArrowRight, ArrowUpRight, AudioLines, Bookmark, Radio, RefreshCw, Search, Tv } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { articleHref, editionHref, fold, type EditionRoute, type Summary } from '../../lib/edition';
import { DeskCollections, DeskDirectory, DeskRail, MostRated, sectionStoryLimit } from './desk-collections';
import { NewsLeaders } from './news-leaders';
import type { NewsSlide } from '../../lib/news-leaders';
import {CategoryLink, Mark} from './category-mark';
import { categoryLabel, localizedHref, sectionLabel, type PublicLocale } from '../../lib/i18n';
import { usePublicLocale } from '../language-select';
import { StoryCard, StoryDate } from './story-card';
import { BrandShowcase, MobileReading } from './brand-showcase';
import { FeaturedContents } from './featured-contents';
import { AdSlot } from './ad-slot';
import { CoverFigure } from './cover-figure';
import { canonicalCategory, type CategoryHeadlines, type RatedArticle } from '../../lib/editorial-sections';
import { RadioYO } from './radioyo';
import { readerAccountUrl } from '../../lib/reader-links';
import { sectionText } from './section-copy';
import './front-page.css';
import './hub-pages.css';


const hubPages = {
  actualites: { image: 'news', description: 'newsChannel' },
  presentations: { image: 'editorial' },
  direct: { image: 'live' },
  podcasts: { image: 'listening', description: 'podcastsInfo' },
  emissions: { image: 'formats', description: 'showsInfo' },
  dossiers: { image: 'editorial', description: 'dossiersInfo' },
  radio: { image: 'radio', description: 'radioInfo' },
  tv: { image: 'tv', description: 'tvInfo' }
} as const;

type HubPage = keyof typeof hubPages;

function HubHeader({ section, lang }: { section: HubPage; lang: PublicLocale }) {
  const page = hubPages[section];
  const image = '/media/collection-2026/' + page.image;
  const isChannel = section === 'radio' || section === 'tv';
  return <section className={'by-hub-header by-hub-' + section} aria-labelledby="hub-title">
    <div className="by-hub-copy">
      <a className="by-hub-home" href={localizedHref('/',lang)}>
        <ArrowLeft size={15} aria-hidden="true"/>{sectionLabel('accueil',lang)}
      </a>
      <div className="by-hub-titles">
        {isChannel && <span className="by-hub-status">{sectionText(lang,'upcoming')}</span>}
        <h1 id="hub-title">{sectionLabel(section,lang)}</h1>
        {'description' in page && <p>{sectionText(lang,page.description)}</p>}
        {section === 'presentations' && <a className="by-hub-method" href={localizedHref('/article/verification',lang)}>
          {sectionText(lang,'aboutMethod')}<ArrowUpRight size={17} aria-hidden="true"/>
        </a>}
      </div>
    </div>
    <picture className="by-hub-art">
      <source media="(max-width: 720px)" srcSet={image + '-720.webp'}/>
      <img src={image + '.webp'} alt="" width={section === 'presentations' ? 1536 : 1640} height={section === 'presentations' ? 1024 : 923} decoding="async" fetchPriority="high"/>
    </picture>
  </section>;
}

const liveChannels = [
  { section: 'radio', icon: Radio },
  { section: 'tv', icon: Tv }
] as const;

function LiveChannels({ lang }: { lang: PublicLocale }) {
  return <nav className="by-hub-channels" id="chaines" aria-label={sectionText(lang, 'coverage')}>
    {liveChannels.map(({section, icon: Icon}) => <a key={section} href={localizedHref(editionHref(section),lang)}>
      <Icon size={26} strokeWidth={1.5} aria-hidden="true" />
      <div><strong>{sectionLabel(section,lang)}</strong><span>{sectionText(lang,'upcoming')}</span></div>
      <ArrowUpRight size={20} aria-hidden="true"/>
    </a>)}
  </nav>;
}

function FrontLead({ story, lang }: { story: Summary; lang: PublicLocale }) {
  const href = localizedHref(articleHref(story), lang);
  const hasPhoto = Boolean(story.photo || story.image);
  return <article aria-labelledby="lead-title" className={'by-lead' + (hasPhoto ? '' : ' by-lead-type')}>
    <div className="by-lead-copy">
      <div className="by-lead-meta">
        <span className="by-lead-badge">{sectionText(lang, 'lead')}</span>
        <span><Mark category={story.category} label={categoryLabel(story.category, lang)}/></span>
      </div>
      <h1 id="lead-title" lang={story.contentLocale} dir="auto"><a href={href}>{story.title}</a></h1>
      <p className="by-deck" lang={story.contentLocale} dir="auto">{story.summary}</p>
      <div className="by-lead-bottom">
        <a href={href}>{sectionText(lang,'read')}<ArrowRight className="by-direction-arrow" size={17} aria-hidden="true" /></a>
        <small><StoryDate story={story} lang={lang} /></small>
      </div>
    </div>
    {hasPhoto && <div className="by-lead-media">
      {story.photo ? <CoverFigure photo={story.photo} href={href} priority /> :
        <a className="by-feature-photo" href={href} aria-label={story.title}>
          <Image unoptimized width={900} height={400} src={'/media/' + story.image + '.webp'} alt="" priority />
        </a>}
    </div>}
  </article>;
}

function LatestFeed({ stories, lang }: { stories: Summary[]; lang: PublicLocale }) {
  return <section className="by-feed" aria-labelledby="feed-title">
    <h2 id="feed-title"><AudioLines size={21} aria-hidden="true" />{sectionText(lang, 'wire')}</h2>
    <ul>{stories.map(story => <li key={story.slug}><a href={localizedHref(articleHref(story),lang)}>
      <div><span className="by-category"><Mark category={story.category} label={categoryLabel(story.category,lang)}/></span><h3 lang={story.contentLocale} dir="auto">{story.title}</h3><small><StoryDate story={story} lang={lang} withTime /></small></div>
      {story.photo && <Image unoptimized loading="lazy" decoding="async" width={128} height={88} src={story.photo.thumbnailUrl || story.photo.url} alt="" />}
    </a></li>)}</ul>
    <a className="by-section-link" href={localizedHref(editionHref('actualites'),lang)}>{sectionText(lang,'allNews')}</a>
  </section>;
}

function AllTopicLinks({ categories, lang }: { categories:string[]; lang:PublicLocale }) {
  return <details className="by-all-topics"><summary>{sectionText(lang,'allTopics')}</summary>
    <DeskDirectory categories={categories} lang={lang}/>
  </details>;
}

type FrontProps = { mostRated: RatedArticle[] | null; stories: Summary[]; headlines: CategoryHeadlines[]; unavailable: boolean };
type HomeProps = FrontProps & {
  presentations: Summary[];
  savedCount: number;
  saveButton: (story: Summary) => ReactNode;
};

export function EditionFront({ mostRated, stories, headlines, presentations, savedCount, saveButton, unavailable }: HomeProps) {
  const lang = usePublicLocale();
  const [lead,...remaining] = stories;
  const feed = remaining.slice(0,4);
  const above = new Set(stories.slice(0,5).map(story => story.slug));
  const more = [...remaining.slice(4), ...headlines.flatMap(group => group.stories)].filter(story => !above.has(story.slug));
  return <div className="wrap by-home">
    {unavailable && <p role="status" className="by-feed-status">{sectionText(lang,'unavailable')}</p>}
    {!lead && !unavailable && <p className="by-feed-status">{sectionText(lang,'emptyNews')}</p>}
    {lead && <>
      <FrontLead story={lead} lang={lang} />
      <AdSlot placement="home-lower" />
    </>}
    {feed.length>0 && <LatestFeed stories={feed} lang={lang} />}
    
    <FeaturedContents stories={more} presentations={[]} savedCount={savedCount} saveButton={saveButton} />
    {mostRated && <MostRated rows={mostRated} lang={lang}/>}
    {headlines.length>0 && <section className="by-section" aria-labelledby="topics-heading">
      <div className="by-section-title"><h2 id="topics-heading">{sectionText(lang,'topics')}</h2></div>
      <AllTopicLinks categories={headlines.map(group=>group.category)} lang={lang}/>
      <DeskCollections groups={headlines} lang={lang}/>
    </section>}
    <BrandShowcase lang={lang}/><RadioYO lang={lang} compact/>
    <MobileReading lang={lang} />
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

type SectionProps = FrontProps & {
  leaders: NewsSlide[];
  presentations:Summary[];
  hasNext: boolean; publishedCategories: string[]; route: EditionRoute; saved: string[];
  signedIn: boolean; accountStatus: string; saveButton: (story: Summary) => ReactNode;
};
export function SectionContent({ mostRated, leaders, route, stories, headlines, presentations, unavailable, saved, signedIn, accountStatus, saveButton, hasNext, publishedCategories }: SectionProps) {
  const lang = usePublicLocale();
  const href = (path: string)=>localizedHref(path,lang);
  const { section, query, category, page } = route;
  const format = section === 'podcasts' || section === 'emissions' || section === 'dossiers';
  const serverFiltered = section === 'actualites' || section === 'recherche';
  const articles = section === 'presentations' ? presentations : stories;
  const pool = section === 'favoris' ? articles.filter(story => saved.includes(story.slug)) : articles;
  const categories = [...new Set([...publishedCategories, ...pool.map(story => canonicalCategory(story.category))])];
  const topicPage = section === 'actualites' && !!category;
  const topicIndex = section === 'actualites' && !category && !query && page===1;
  const hubPage = section === 'actualites' ? topicIndex : Object.hasOwn(hubPages,section);
  const terms = fold(query).split(/\s+/).filter(Boolean);
  const list = pool.filter(story => (serverFiltered && !story.presentation) || ((!category || fold(story.category) === fold(category)) &&
    terms.every(term => fold([story.title, story.category, categoryLabel(story.category,lang), story.summary, story.slug].join(' ')).includes(term))));
  const empty = category || query ? 'noMatch' : page>1 ? 'noPage' : section==='favoris' ? 'emptySaved' : section==='actualites' ? 'emptyNews' : 'empty';
  const featured = topicPage && !query && page===1 ? list.slice(0,sectionStoryLimit) : [];
  const archive = list.slice(featured.length);
  function card(story: Summary) { return <StoryCard key={story.slug} story={story} save={saveButton(story)} lang={lang} showSummary/>; }
  return <div className="wrap section-page by-index">
    {topicIndex && leaders.length > 0 ? <NewsLeaders slides={leaders} lang={lang}/> : hubPage ? <HubHeader section={section as HubPage} lang={lang}/> : <section className="page-title">
      <a className="by-section-link" href={href('/')}>{sectionLabel('accueil',lang)}</a>
      <h1>{topicPage ? categoryLabel(category,lang) : sectionLabel(section,lang)}</h1>
      {(section==='favoris'||section==='recherche') && <p>{sectionText(lang,section==='favoris'?'favoritesIntro':'searchIntro')}</p>}
    </section>}
    {topicPage && <>
      <DeskDirectory categories={categories} current={category} lang={lang}/>
      {featured.length>0 && <DeskRail name={category} stories={featured} lang={lang} current renderStory={card}/>}
      {featured.length>0 && <AdSlot placement="news"/>}
    </>}
    {section === 'radio' && <><RadioYO lang={lang}/><AdSlot placement="radio"/></>}
    {section === 'direct' && <LiveChannels lang={lang}/>}
    {format && <section className="content-section">
      {section === 'dossiers' ? <>
        <div className="by-section-title"><h2>{sectionText(lang,'dossierSelection')}</h2></div>
        {unavailable && <p role="status">{sectionText(lang,'unavailable')}</p>}
        <div className="by-story-grid">{stories.map(story => <StoryCard key={story.slug} story={story} save={saveButton(story)} lang={lang} showSummary />)}</div>
      </> : <>
        <div className="by-section-title"><h2>{sectionText(lang,section === 'podcasts' ? 'radioChannel' : 'tvChannel')}</h2>
          <a className="by-section-link" href={href(editionHref(section === 'podcasts' ? 'radio' : 'tv'))}>{sectionLabel(section === 'podcasts' ? 'radio' : 'tv',lang)} <ArrowRight size={16} aria-hidden="true"/></a></div>
        <div className="by-story-grid">{presentations.map(story => <StoryCard key={story.slug} story={story} lang={lang} showSummary />)}</div>
      </>}
    </section>}
    {!format && section !== 'radio' && section !== 'tv' && section !== 'direct' && <section className="content-section">
      {section === 'favoris' && !signedIn ? <div className="empty">
        {accountStatus === 'loading' ? sectionText(lang,'loading') : accountStatus === 'error' ? <><p>{sectionText(lang,'accountError')}</p><a className="edition-icon-link" href={href(editionHref('favoris'))}><RefreshCw size={16} aria-hidden="true" />{sectionText(lang,'retry')}</a></> :
          <><p>{sectionText(lang,'loginPrompt')}</p><a className="outline" href={readerAccountUrl('connexion',href(editionHref('favoris')),lang)} target="_top">{sectionText(lang,'login')}</a></>}
      </div> : <>
        {topicIndex && <>{mostRated && <MostRated rows={mostRated} lang={lang}/>}<AllTopicLinks categories={categories} lang={lang}/><DeskCollections groups={headlines} lang={lang}/><AdSlot placement="news-lower"/></>}
        {(!featured.length || archive.length>0) && <div className="by-section-title"><h2>{sectionText(lang,topicPage||topicIndex?'archive':section==='recherche'?'results':section==='favoris'?'saved':section==='presentations'?'presentations':'wire')}</h2>
          {section !== 'favoris' && <a className="by-section-link" href={href(editionHref('favoris'))}><Bookmark size={15} aria-hidden="true" />{sectionLabel('favoris',lang)}</a>}</div>}
        {(pool.length > 0 || section === 'recherche' || query || category) && <div className="filter-area"><SearchForm route={route} lang={lang} />
          {!topicPage && !topicIndex && categories.length > 0 && <nav className="edition-filters" aria-label={sectionText(lang,'filter')}>
            {['', ...categories].map(item => <CategoryLink key={item} category={item} label={item ? categoryLabel(item,lang) : sectionText(lang,'all')} href={href(editionHref(section, query, item))}
              aria-current={fold(category) === fold(item) ? 'true' : undefined}/>)}</nav>}
        </div>}
        {unavailable && section !== 'presentations' && <div className="empty"><p>{sectionText(lang,'unavailable')}</p><a className="edition-icon-link" href={href(editionHref(section, query, category))}><RefreshCw size={16} aria-hidden="true" />{sectionText(lang,'retry')}</a></div>}
        {archive.length>0 ? <><div className="by-story-grid">{(section==='actualites'?archive.slice(0,4):archive).map(card)}</div>
          {section==='actualites' && archive.length>4 && <><AdSlot placement={topicPage?'news-lower':'news'}/><div className="by-story-grid">{archive.slice(4).map(card)}</div></>}
        </> : !featured.length && (!unavailable || section === 'presentations') && <div className="empty"><p>{sectionText(lang,topicPage && !query && page===1?'emptyTopic':empty)}</p>
          {category || query || page>1 ? <a href={href(editionHref(section))}>{sectionText(lang,'reset')}</a> : <a href={href(editionHref('actualites'))}>{sectionText(lang,'allNews')}</a>}</div>}
        {serverFiltered && (hasNext || page>1) && <nav className="edition-pagination" aria-label={sectionText(lang,'pagination')}>
          {page>1 && <a className="outline" rel="prev" href={href(editionHref(section,query,category,page-1))}>{sectionText(lang,'prev')}</a>}
          <span>{sectionText(lang,'page')} {new Intl.NumberFormat(lang).format(page)}</span>
          {hasNext && <a className="outline" rel="next" href={href(editionHref(section,query,category,page+1))}>{sectionText(lang,'next')}</a>}
        </nav>}
      </>}
    </section>}
  </div>;
}
