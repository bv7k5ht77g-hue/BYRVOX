'use client';

import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { articleHref, type Summary } from '../../lib/edition';
import { groupDesks, categoryHref, ratingChangedKey, type CategoryHeadlines, type RatedArticle } from '../../lib/editorial-sections';
import { discussionText } from '../../lib/discussion-copy';
import { categoryLabel, localizedHref, publicLocales, type PublicLocale } from '../../lib/i18n';
import { categoryColor } from './category-mark';
import { TopicRail } from './topic-rail';
import { StoryCard } from './story-card';
import { sectionText } from './section-copy';
import './desk-collections.css';

const ratedTitle = ['Les articles les plus évalués','Most rated stories','Artículos con más valoraciones','المقالات الأكثر تقييماً','评分人数最多的文章','Статьи с наибольшим числом оценок','평가가 가장 많은 기사'];
const viewAll = ['Tous les articles','All stories','Todos los artículos','جميع المقالات','全部文章','Все статьи','전체 기사'];

export const sectionStoryLimit = 5;

export function DeskDirectory({categories, current, lang}: {categories:string[]; current?:string; lang:PublicLocale}) {
  return <nav className="by-desk-directory" aria-label={sectionText(lang,'topics')}>
    {groupDesks(categories).map(desk => <div key={desk.name}>
      <a className="by-directory-parent" href={localizedHref(categoryHref(desk.name),lang)} aria-current={current === desk.name ? 'page' : undefined}>{categoryLabel(desk.name,lang)}</a>
      {desk.children.length > 0 && <ul>{desk.children.map(child => <li key={child}><a href={localizedHref(categoryHref(child),lang)} aria-current={current === child ? 'page' : undefined}>{categoryLabel(child,lang)}</a></li>)}</ul>}
    </div>)}
  </nav>;
}

function DeskLead({stories, lang, renderStory}: {stories:Summary[]; lang:PublicLocale; renderStory:(story:Summary)=>ReactNode}) {
  const [index,setIndex] = useState(0);
  const current = index < stories.length ? index : 0;
  const color = categoryColor(stories[current].category);
  return <div className="by-desk-lead" style={{'--desk-color':color} as CSSProperties}>
    <div className="by-desk-lead-top"><strong>{sectionText(lang,'lead')}</strong>
      {stories.length > 1 && <span>{new Intl.NumberFormat(lang).format(current+1)} / {new Intl.NumberFormat(lang).format(stories.length)}</span>}
    </div>
    {stories.map((story, i) => <div key={story.slug} className="by-desk-slide" hidden={i !== current}>{renderStory(story)}</div>)}
    {stories.length > 1 && <div className="by-desk-dots">{stories.map((item,i) =>
      <button key={item.slug} type="button" aria-pressed={i === current} aria-label={item.title} title={item.title} onClick={()=>setIndex(i)} />)}</div>}
  </div>;
}

export function DeskRail({name, stories, segments = [], lang, current = false, renderStory}: {
  name:string; stories:Summary[]; segments?:CategoryHeadlines[]; lang:PublicLocale; current?:boolean; renderStory?:(story:Summary)=>ReactNode;
}) {
  const [choice,setChoice] = useState('');
  const active = segments.find(segment=>segment.category===choice);
  const visible = (active?.stories || stories).slice(0,sectionStoryLimit);
  const card = renderStory || ((story:Summary) => <StoryCard key={story.slug} story={story} lang={lang}/>);
  const leadSize = visible.length > 2 ? 2 : 1;
  const filters = segments.length > 0 && <div className="by-desk-filters" role="group" aria-label={sectionText(lang,'filter')+' · '+categoryLabel(name,lang)}>
    <button type="button" aria-pressed={!active} onClick={()=>setChoice('')}>{sectionText(lang,'all')}</button>
    {segments.map(segment=><button type="button" key={segment.category} aria-pressed={segment===active} onClick={()=>setChoice(segment.category)}>{categoryLabel(segment.category,lang)}</button>)}
  </div>;
  return <div className="by-desk-collection">
    <TopicRail category={name} lang={lang} current={current} controls={filters} selection={active?.category || ''}>
      <DeskLead key={active?.category || name} stories={visible.slice(0,leadSize)} lang={lang} renderStory={card}/>
      {visible.slice(leadSize).map(card)}
    </TopicRail>
    {!current && <a className="by-desk-archive" href={localizedHref(categoryHref(active?.category || name),lang)}>
      {viewAll[publicLocales.indexOf(lang)]} · {categoryLabel(active?.category || name,lang)}
    </a>}
  </div>;
}

export function DeskCollections({groups,lang}: {groups:CategoryHeadlines[];lang:PublicLocale}) {
  const available = new Map(groups.filter(group=>group.stories.length).map(group=>[group.category,group]));
  return <div className="by-desk-collections">
    {groupDesks([...available.keys()]).map(desk=>{
      const segments = desk.children.map(child=>available.get(child)!);
      const merged = new Map<string,Summary>();
      for(const group of [available.get(desk.name), ...segments]){
        for(const story of group?.stories || []) merged.set(story.slug,story);
      }
      const stories = [...merged.values()].sort((a,b)=>(b.publishedAt || '').localeCompare(a.publishedAt || '') || a.slug.localeCompare(b.slug));
      return <DeskRail key={desk.name} name={desk.name} stories={stories} segments={segments} lang={lang}/>;
    })}
  </div>;
}

export function MostRated({rows,lang}: {rows:RatedArticle[];lang:PublicLocale}) {
  const router = useRouter();
  useEffect(() => {
    const restored = (event:PageTransitionEvent) => { if (event.persisted) router.refresh(); };
    const votedInAnotherTab = (event:StorageEvent) => { if (event.key === ratingChangedKey) router.refresh(); };
    window.addEventListener('pageshow',restored);
    window.addEventListener('storage',votedInAnotherTab);
    return () => {
      window.removeEventListener('pageshow',restored);
      window.removeEventListener('storage',votedInAnotherTab);
    };
  },[router]);
  const countFormat = new Intl.NumberFormat(lang);
  const ratingFormat = new Intl.NumberFormat(lang,{minimumFractionDigits:1,maximumFractionDigits:1});
  return <section className="by-section by-most-rated" aria-labelledby="most-rated-heading">
    <div className="by-section-title"><h2 id="most-rated-heading">{ratedTitle[publicLocales.indexOf(lang)]}</h2></div>
    {rows.length ? <ol>{rows.map(({story,count,average},rank)=><li key={story.slug}>
      <a href={localizedHref(articleHref(story),lang)}>
        <span className="by-rating-meta"><b className="by-rating-rank" aria-hidden="true">{countFormat.format(rank + 1)}</b><Star size={15} aria-hidden="true"/>
          <span aria-label={discussionText(lang,'outOfFive').replace('{value}', ratingFormat.format(average))}>{ratingFormat.format(average)} / 5</span>
          <span> · {discussionText(lang,'votes')} {countFormat.format(count)}</span></span>
        <strong lang={story.contentLocale} dir="auto">{story.title}</strong>
      </a>
    </li>)}</ol> : <p>{discussionText(lang,'noRatings')}</p>}
  </section>;
}
