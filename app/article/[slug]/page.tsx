import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { and, eq } from 'drizzle-orm';
import { Clock3, House, Link2 } from 'lucide-react';
import { ArticleNavigation } from '../../../components/edition/edition';
import { CoverFigure } from '../../../components/edition/cover-figure';
import { AdSlot } from '../../../components/edition/ad-slot';
import { PublicLocaleProvider } from '../../../components/language-select';
import type { ArticlePhoto } from '../../../lib/article-photo';
import { resolveCover, type CoverPhoto } from '../../../lib/cover-photo';
import { SITE_ORIGIN } from '../../../lib/site-url';
import { features, type Story } from '../../../lib/content';
import { getDb } from '../../../db';
import { articles } from '../../../db/schema';
import { isoDate } from '../../../lib/publication-date';
import { categoryLabel, localeLabels, localizedHref, translationFallbackHref, type PublicLocale } from '../../../lib/i18n';
import { resolvePublicLocale } from '../../../lib/public-locale';
import { localizeCover, translateStory, translateSummaries } from '../../../lib/public-translations';
import { readerCandidates } from '../../../lib/public-articles';
import { recommend } from '../../../lib/reader-recommendations';
import { sourcesForReader } from '../presentation';
import { readerLabels } from '../reader-labels';
import { Recommendations } from '../recommendations';
import '../reader.css';

export const dynamic = 'force-dynamic';
type ArticleProps = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string,string | string[] | undefined>> };
type ReaderArticle = { story: Story; isFeature: boolean; isWire: boolean; photo: CoverPhoto | null; gallery: ArticlePhoto[] };

const getArticle = cache(async (slug: string): Promise<ReaderArticle | null> => {
  const feature = features.find(article => article.slug === slug);
  if (feature) return { story: feature, isFeature: true, isWire:false, photo:null, gallery:[] };
  const [row] = await getDb().select({
    slug:articles.slug, title:articles.title, category:articles.category, summary:articles.summary, authorId:articles.authorId,
    photo:articles.photo, photoHidden:articles.photoHidden, gallery:articles.gallery,
    body:articles.body, sources:articles.sources, publishedAt:articles.publishedAt, updatedAt:articles.updatedAt,
  }).from(articles).where(and(eq(articles.slug,slug),eq(articles.status,'published'))).limit(1);
  if (!row) return null;
  const {photo, photoHidden, gallery, authorId, ...story} = row;
  return {story, isFeature:false, isWire:authorId === 'byrvox-agent-horaire', photo:resolveCover(slug,photo,photoHidden), gallery:gallery || []};
});
const localizedArticle = cache(async (slug:string, locale:PublicLocale) => {
  const article = await getArticle(slug);
  if (!article) return null;
  const [{story,translated}, cover] = await Promise.all([
    translateStory(article.story,locale), localizeCover(slug,article.photo,locale),
  ]);
  return { ...article, original:article.story, story, photo:cover.photo, photoLanguage:cover.translated ? locale : 'fr', language:translated ? locale : 'fr' as const };
});
const openGraphLocales = {fr:'fr_CA', en:'en_CA', es:'es_ES', ar:'ar_SA', 'zh-CN':'zh_CN', ru:'ru_RU', ko:'ko_KR'} as const;
function absoluteArticleUrl(slug:string, locale:PublicLocale) {
  return new URL(localizedHref('/article/' + encodeURIComponent(slug),locale),SITE_ORIGIN).href;
}
export async function generateMetadata({params,searchParams}:ArticleProps):Promise<Metadata> {
  const {slug} = await params;
  const locale = await resolvePublicLocale(await searchParams);
  const record = await localizedArticle(slug,locale);
  if (!record) return {title:readerLabels(locale).missing, robots:{index:false,follow:false}};
  const {story, photo, isFeature, language} = record;
  const path = absoluteArticleUrl(slug,language);
  const image = photo ? {url:photo.url, alt:photo.alt} : isFeature && story.image ? {url:'/media/' + story.image + '.webp'} : null;
  return {
    title:story.title, description:story.summary, alternates:{canonical:path, types:{'application/rss+xml':'/rss.xml'}},
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
  const {story, original, isFeature, isWire, photo, language} = record;
  const copy = readerLabels(locale);
  const sources = sourcesForReader(story.sources);
  const published = isoDate(story.publishedAt), updated = isoDate(story.updatedAt);
  const dateFormat = new Intl.DateTimeFormat(locale, {day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'America/Toronto', timeZoneName:'short'});
  // The French word count gives a consistent estimate even for languages without spaces.
  const minutes = Math.max(1,Math.ceil(original.body.trim().split(/\s+/u).length/220));
  const candidates = await readerCandidates(original.publishedAt).catch(() => []);
  const suggestions = recommend(original,candidates);
  const cards = await translateSummaries(suggestions.stories,locale);
  const linkedData = {
    '@context':'https://schema.org', '@type':isFeature?'Article':'NewsArticle', mainEntityOfPage:absoluteArticleUrl(slug,language),
    image:photo ? new URL(photo.url,SITE_ORIGIN).href : undefined, headline:story.title, description:story.summary,
    articleSection:categoryLabel(story.category,locale), inLanguage:language, author:{'@type':'Organization',name:'BYRVOX'},
    publisher:{'@type':'Organization',name:'BYRVOX'}, datePublished:published || undefined, dateModified:updated || undefined,
    citation:sources.length ? sources.map(s=>s.url) : undefined,
  };
  return <PublicLocaleProvider locale={locale}>
    <a className="skip" href="#lecture">{copy.skip}</a>
    <ArticleNavigation />
    <main id="lecture" tabIndex={-1}>
      <div className="reader-main">
        <article>
          <div className="reader-heading">
            {locale !== language && <p className="reader-translation-note">{localeLabels[locale].sourceFallback}{' '}<a href={translationFallbackHref(absoluteArticleUrl(slug,'fr'),locale)} rel="external">{localeLabels[locale].translate}</a></p>}
            {locale !== 'fr' && language === locale && <p className="reader-translation-note"><a href={'/article/'+encodeURIComponent(slug)+'?lang=fr'} hrefLang="fr">{copy.frenchOriginal}</a></p>}
            <p className="reader-category">{categoryLabel(story.category,locale)}</p>
            <h1 lang={language} dir="auto">{story.title}</h1>
            <p lang={language} dir="auto" className="reader-deck">{story.summary}</p>
            <div className="reader-byline">
              <strong>{isWire ? copy.wire : copy.newsroom}</strong>
              {isFeature && <span>{copy.presentation}</span>}
              {published && <span>{copy.published} <time dateTime={published}>{dateFormat.format(Date.parse(published))}</time></span>}
              {updated && published && updated > published && <span>{copy.updated} <time dateTime={updated}>{dateFormat.format(Date.parse(updated))}</time></span>}
              <span className="reader-duration"><Clock3 size={14} aria-hidden="true"/>{new Intl.NumberFormat(locale).format(minutes)} {copy.minutes}</span>
            </div>
          </div>
          {photo && <div lang={record.photoLanguage} dir="auto"><CoverFigure photo={photo} priority /></div>}
          {isFeature && story.image && story.image !== 'city' && <figure className="reader-photo">
            <Image src={'/media/'+story.image+'.webp'} width={900} height={400} alt="" loading="eager" unoptimized/>
            <figcaption>{copy.illustration}</figcaption>
          </figure>}
          <div lang={language} dir="auto" className="reader-copy">
            {story.body.split(/\r?\n/).filter(p=>p.trim()).map((p,i)=><p key={i}>{p}</p>)}
          </div>
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
        <a href={localizedHref('/',locale)} className="reader-back"><House size={16} aria-hidden="true"/> {copy.home}</a>
      </div>
      <Recommendations stories={cards} relatedCount={suggestions.relatedCount} locale={locale}/>
    </main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(linkedData).replace(/</g,'\\u003c')}}/>
  </PublicLocaleProvider>;
}
