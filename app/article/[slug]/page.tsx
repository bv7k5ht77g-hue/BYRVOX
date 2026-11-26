import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache, Fragment } from 'react';
import { and, eq } from 'drizzle-orm';
import { Clock3, House, Link2 } from 'lucide-react';
import {CategoryLink, Mark} from '../../../components/edition/category-mark';
import {Awards} from '../../../components/edition/rankings';
import {ArticleMeter} from "../../../components/edition/audience";
import { ArticleNavigation } from '../../../components/edition/edition';
import { CoverFigure } from '../../../components/edition/cover-figure';
import { AdSlot } from '../../../components/edition/ad-slot';
import { PublicEditionProvider } from '../../../components/edition/public-edition-provider';
import type { ArticlePhoto } from '../../../lib/article-photo';
import { articleAdState } from '../../../lib/article-ad-policy';
import { resolveCover, type CoverPhoto } from '../../../lib/cover-photo';
import { NEW_SITE_ORIGIN, publicPublisher } from '../../../lib/site-url';
import { features, type Story } from '../../../lib/content';
import { getDb } from '../../../db';
import { articles } from '../../../db/schema';
import { isoDate } from '../../../lib/publication-date';
import { categoryHref } from '../../../lib/editorial-sections';
import { articleRegion, publicStoryCategory } from '../../../lib/story-topics';
import { editionHref } from '../../../lib/edition';
import { categoryLabel, localeLabels, localizedHref, sectionLabel, translationFallbackHref, type PublicLocale } from '../../../lib/i18n';
import { resolvePublicLocale } from '../../../lib/public-locale';
import { availableStoryLanguages, localizeCover, translateStory, translateSummaries } from '../../../lib/public-translations';
import { readerCandidates } from '../../../lib/public-articles';
import { recommend } from '../../../lib/reader-recommendations';
import { sourcesForReader } from '../presentation';
import { readerLabels } from '../reader-labels';
import { Recommendations } from '../recommendations';
import { ArticleDiscussion } from '../discussion';
import { ArticlePostCover } from '../post-cover';
import '../reader.css';

export const dynamic = 'force-dynamic';
type ArticleProps = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string,string | string[] | undefined>> };
type ReaderArticle = { adsEnabled: boolean; reserveArticleSpaces: boolean; story: Story; isFeature: boolean; isWire: boolean; photo: CoverPhoto | null; gallery: ArticlePhoto[] };

const getArticle = cache(async (slug: string): Promise<ReaderArticle | null> => {
  const feature = features.find(article => article.slug === slug);
  if (feature) return { adsEnabled:true, reserveArticleSpaces:false, story: feature, isFeature: true, isWire:false, photo:null, gallery:[] };
  const [row] = await getDb().select({
    adReview:articles.adReview, slug:articles.slug, title:articles.title, category:articles.category, summary:articles.summary, authorId:articles.authorId,
    photo:articles.photo, photoHidden:articles.photoHidden, gallery:articles.gallery,
    body:articles.body, sources:articles.sources, publishedAt:articles.publishedAt, updatedAt:articles.updatedAt,
  }).from(articles).where(and(eq(articles.slug,slug),eq(articles.status,'published'))).limit(1);
  if (!row) return null;
  const {photo, photoHidden, gallery, authorId, adReview, ...story} = row;
  const state = articleAdState(adReview);
  return {
    adsEnabled:state === 'allowed',
    reserveArticleSpaces:state === 'pending', story:{...story, category:publicStoryCategory(story)}, isFeature:false,
    isWire:authorId === 'byrvox-agent-horaire' || authorId === 'byrvox-agent-thematique',
    photo:resolveCover(slug,photo,photoHidden,true), gallery:gallery || [],
  };
});
const localizedArticle = cache(async (slug:string, locale:PublicLocale) => {
  const article = await getArticle(slug);
  if (!article) return null;
  const [{story,translated}, cover] = await Promise.all([
    translateStory(article.story,locale), localizeCover(slug,article.photo,locale),
  ]);
  const art = article.isFeature && story.image && story.imageAlt ? {
    url: '/media/' + story.image + '.webp',
    smallUrl: '/media/' + story.image + '-720.webp',
    alt: [story.imageAlt[locale], readerLabels(locale).illustration].join(' '),
  } : null;
  return { ...article, original:article.story, story, art, photo:cover.photo, photoLanguage:cover.translated ? locale : 'fr', language:translated ? locale : 'fr' as const };
});
const openGraphLocales = {fr:'fr_CA', en:'en_CA', es:'es_ES', ar:'ar_SA', 'zh-CN':'zh_CN', ru:'ru_RU', ko:'ko_KR'} as const;
function absoluteArticleUrl(slug:string, locale:PublicLocale, origin:string) {
  return new URL(localizedHref('/article/' + encodeURIComponent(slug),locale),origin).href;
}
export async function generateMetadata({params,searchParams}:ArticleProps):Promise<Metadata> {
  const {slug} = await params;
  const locale = await resolvePublicLocale(await searchParams);
  const record = await localizedArticle(slug,locale);
  if (!record) return {title:readerLabels(locale).missing, robots:{index:false,follow:false}};
  const {story, photo, art, language} = record;
  const origin = NEW_SITE_ORIGIN;
  const path = absoluteArticleUrl(slug,language,origin);
  const available = await availableStoryLanguages(record.original);
  const languages = Object.fromEntries(available.map(lang=>[lang,absoluteArticleUrl(slug,lang,origin)]));
  languages['x-default'] = languages.fr;
  const cover = photo ?? art;
  const image = cover ? {url:new URL(cover.url,origin).href, alt:cover.alt} : null;
  return {
    title:story.title, description:story.summary, robots:{'max-image-preview':'large'}, alternates:{canonical:path, languages, types:{'application/rss+xml':'/rss.xml'}},
    openGraph:{ title:story.title, description:story.summary, type:'article', url:path, locale:openGraphLocales[language],
      siteName:'BYRVOX', section:categoryLabel(story.category,locale), publishedTime:isoDate(story.publishedAt) ?? undefined,
      modifiedTime:isoDate(story.updatedAt) ?? undefined, ...(image ? {images:[image]} : {}) },
    twitter:{ card:image ? 'summary_large_image':'summary', title:story.title, description:story.summary, ...(image ? {images:[image]} : {}) }
  };
}

export default async function Article({params,searchParams}:ArticleProps) {
  const {slug} = await params;
  const locale = await resolvePublicLocale(await searchParams);
  const record = await localizedArticle(slug,locale);
  if (!record) notFound();
  const {story, original, isFeature, isWire, photo, art, language} = record;
  const copy = readerLabels(locale);
  const region = articleRegion(original);
  const sources = sourcesForReader(story.sources);
  const paragraphs = story.body.split(/\r?\n/).filter(paragraph => paragraph.trim());
  const midpoint = Math.ceil(paragraphs.length / 2);
  const published = isoDate(story.publishedAt), updated = isoDate(story.updatedAt);
  const dateFormat = new Intl.DateTimeFormat(locale, {day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'America/Toronto', timeZoneName:'short'});
  // The French word count gives a consistent estimate even for languages without spaces.
  const minutes = Math.max(1,Math.ceil(original.body.trim().split(/\s+/u).length/220));
  const candidates = await readerCandidates(original).catch(() => []);
  const suggestions = recommend(original,candidates);
  const cards = await translateSummaries(suggestions.stories,locale);
  const origin = NEW_SITE_ORIGIN;
  const url = absoluteArticleUrl(slug,language,origin);
  const coverFigure = photo && <div lang={record.photoLanguage} dir="auto"><CoverFigure photo={photo} priority /></div>;
  const linkedData = {
    '@context':'https://schema.org', '@type':isFeature?'Article':'NewsArticle', '@id':url+'#article', url, mainEntityOfPage:{'@type':'WebPage','@id':url},
    image:art ? new URL(art.url,origin).href : photo ? new URL(photo.url,origin).href : undefined, headline:story.title, description:story.summary,
    articleSection:categoryLabel(story.category,locale), inLanguage:language, author:{'@type':'Organization',name:'BYRVOX',url:absoluteArticleUrl('notre-methode',language,origin)},
    publisher:publicPublisher, datePublished:published || undefined, dateModified:updated || undefined,
    citation:sources.length ? sources.map(s=>s.url) : undefined,
  };
  return <PublicEditionProvider locale={locale} adsEnabled={record.adsEnabled} reserveArticleSpaces={record.reserveArticleSpaces}>
    <a className="skip" href="#lecture">{copy.skip}</a>
    <ArticleNavigation article={{title:story.title, language}} currentUrl={localizedHref('/article/'+encodeURIComponent(slug),locale)}><ArticleMeter slug={slug}/>
    <main id="lecture" tabIndex={-1}>
      <div className={isFeature ? "reader-main reader-feature" : "reader-main"}>
        <article>
          <div className="reader-heading">
            {locale !== language && <p className="reader-translation-note">{localeLabels[locale].sourceFallback}{' '}<a href={translationFallbackHref(absoluteArticleUrl(slug,'fr',origin),locale)} rel="external">{localeLabels[locale].translate}</a></p>}
            {locale !== 'fr' && language === locale && <p className="reader-translation-note"><a href={'/article/'+encodeURIComponent(slug)+'?lang=fr'} hrefLang="fr">{copy.frenchOriginal}</a></p>}
            {isFeature ? <p className="reader-category reader-feature-kicker">
              <a href={localizedHref(editionHref('presentations'),locale)}>{sectionLabel('presentations',locale)}</a>
              <Mark category={story.category} label={categoryLabel(story.category,locale)}/>
            </p> : <p className="reader-category"><CategoryLink href={localizedHref(categoryHref(story.category),locale)} category={story.category} label={categoryLabel(story.category,locale)}/>
              {region && region !== story.category && <> <CategoryLink href={localizedHref(categoryHref(region),locale)} category={region} label={categoryLabel(region,locale)}/></>}
            </p>}
            <h1 lang={language} dir="auto" id="article-heading" tabIndex={-1}>{story.title}</h1>
            <p lang={language} dir="auto" className="reader-deck">{story.summary}</p>
            <div className="reader-byline">
              <strong>{isWire ? copy.wire : copy.newsroom}</strong>
              {published && <span>{copy.published} <time dateTime={published}>{dateFormat.format(Date.parse(published))}</time></span>}
              {updated && published && updated > published && <span>{copy.updated} <time dateTime={updated}>{dateFormat.format(Date.parse(updated))}</time></span>}
              <span className="reader-duration"><Clock3 size={14} aria-hidden="true"/>{new Intl.NumberFormat(locale).format(minutes)} {copy.minutes}</span>
              <Awards slug={slug} lang={locale}/>
            </div>
          </div>
          {photo?.blueskyPost ? <ArticlePostCover key={photo.blueskyPost} postUrl={photo.blueskyPost} caption={photo.blueskyCaption?.[locale]} locale={locale}>{coverFigure}</ArticlePostCover> : coverFigure}
          {art && <figure className="reader-feature-art">
            <picture>
              <source media="(max-width: 720px)" srcSet={art.smallUrl}/>
              <img src={art.url} width={1536} height={1024} alt={art.alt} decoding="async" fetchPriority="high"/>
            </picture>
            <figcaption>{copy.illustration}</figcaption>
          </figure>}
          {(photo || art) && <AdSlot placement="article-photo" locale={locale}/>}
          <div className="reader-copy">
            {paragraphs.map((paragraph, index) => <Fragment key={index}>
              <p lang={language} dir="auto">{paragraph}</p>
              {index + 1 === midpoint && index + 1 < paragraphs.length && <AdSlot placement="article-mid" locale={locale}/>}
            </Fragment>)}
          </div>
          <Recommendations stories={cards} relatedCount={suggestions.relatedCount} locale={locale}/>
          {record.gallery.length>0 && <section className="reader-gallery" aria-labelledby="gallery-title">
            <h2 id="gallery-title">{copy.gallery}</h2>
            {record.gallery.map((item,index)=><div lang="fr" dir="auto" key={item.url+index}><CoverFigure photo={item}/></div>)}
          </section>}
          <AdSlot placement="article" locale={locale}/>
          {(!isFeature || sources.length>0) && <section aria-labelledby="sources" className="reader-sources">
            <h2 id="sources">{copy.sources}</h2>
            {sources.length ? <ul>{sources.map(source=><li key={source.url}><a href={source.url}>
              <span dir="auto"><strong>{source.name}</strong><small dir="ltr">{new URL(source.url).hostname}</small></span>
              <Link2 size={18} aria-hidden="true"/>
            </a></li>)}</ul> : <p>{copy.noSources}</p>}
          </section>}
        </article>
        <ArticleDiscussion key={slug} slug={slug} locale={locale}/>
        <a href={localizedHref('/',locale)} className="reader-back"><House size={16} aria-hidden="true"/> {copy.home}</a>
      </div>
    </main>
    </ArticleNavigation>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(linkedData).replace(/</g,'\\u003c')}}/>
  </PublicEditionProvider>;
}
