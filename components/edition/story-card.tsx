import Image from 'next/image';
import type { ReactNode } from 'react';
import { articleHref, type Summary } from '../../lib/edition';
import { categoryLabel, localizedHref, type PublicLocale } from '../../lib/i18n';
import { sectionText } from './section-copy';

const dateFormat = (lang: PublicLocale, time: boolean): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', ...(time ? { hour: '2-digit', minute: '2-digit' } : {year:'numeric'}), timeZone: 'America/Toronto' });

export function StoryDate({ story, lang, withTime = false }: { story: Summary; lang: PublicLocale; withTime?: boolean }) {
  if (!story.publishedAt || !Number.isFinite(Date.parse(story.publishedAt))) return <>{sectionText(lang, story.presentation ? 'feature' : 'reporting')}</>;
  return <time dateTime={story.publishedAt}>{dateFormat(lang, withTime).format(new Date(story.publishedAt))}</time>;
}

export function StoryCard({ story, save, lang, showSummary = false }: { story: Summary; save?: ReactNode; lang: PublicLocale; showSummary?: boolean }) {
  const src = story.photo?.thumbnailUrl || story.photo?.url || (story.image ? '/media/' + story.image + '.webp' : undefined);
  return <article className="by-card"><a href={localizedHref(articleHref(story),lang)}>
    {src && <div className="by-card-photo"><Image unoptimized src={src} width={450} height={250} loading="lazy" decoding="async" alt="" /></div>}
    <p className="by-category">{categoryLabel(story.category,lang)}</p><h3 lang={story.contentLocale} dir="auto">{story.title}</h3>
    {showSummary && <p className="by-card-summary" lang={story.contentLocale} dir="auto">{story.summary}</p>}
    <small><StoryDate story={story} lang={lang} /></small>
  </a>{save}</article>;
}
