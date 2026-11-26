'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';
import { articleHref, type Summary } from '../../lib/edition';
import { groupDesks, categoryHref, type CategoryHeadlines, type RatedArticle } from '../../lib/editorial-sections';
import { discussionText } from '../../lib/discussion-copy';
import { categoryLabel, localizedHref, publicLocales, type PublicLocale } from '../../lib/i18n';
import { TopicRail } from './topic-rail';
import { StoryCard } from './story-card';
import { sectionText } from './section-copy';
import './desk-collections.css';

const ratedTitle = ['Les articles les plus évalués','Most rated stories','Artículos con más valoraciones','المقالات الأكثر تقييماً','评分人数最多的文章','Статьи с наибольшим числом оценок','평가가 가장 많은 기사'];
const viewAll = ['Tous les articles','All stories','Todos los artículos','جميع المقالات','全部文章','Все статьи','전체 기사'];

export function DeskDirectory({categories, current, lang}: {categories:string[]; current?:string; lang:PublicLocale}) {
  return <nav className="by-desk-directory" aria-label={sectionText(lang,'topics')}>
    {groupDesks(categories).map(desk => <div key={desk.name}>
      <a className="by-directory-parent" href={localizedHref(categoryHref(desk.name),lang)} aria-current={current === desk.name ? 'page' : undefined}>{categoryLabel(desk.name,lang)}</a>
      {desk.children.length > 0 && <ul>{desk.children.map(child => <li key={child}><a href={localizedHref(categoryHref(child),lang)} aria-current={current === child ? 'page' : undefined}>{categoryLabel(child,lang)}</a></li>)}</ul>}
    </div>)}
  </nav>;
}

function DeskLead({stories,lang}: {stories:Summary[];lang:PublicLocale}) {
  const [index,setIndex] = useState(0);
  const story = stories[index] || stories[0];
  return <div className="by-desk-lead">
    <div className="by-desk-lead-top"><strong>{sectionText(lang,'lead')}</strong>
      {stories.length > 1 && <span>{new Intl.NumberFormat(lang).format(index+1)} / {new Intl.NumberFormat(lang).format(stories.length)}</span>}
    </div>
    <StoryCard story={story} lang={lang}/>
    {stories.length > 1 && <div className="by-desk-dots">{stories.map((item,i) =>
      <button key={item.slug} type="button" aria-pressed={i === index} aria-label={item.title} title={item.title} onClick={()=>setIndex(i)} />)}</div>}
  </div>;
}

function DeskRail({name, stories, segments, lang, limit}: {name:string; stories:Summary[]; segments:CategoryHeadlines[];lang:PublicLocale;limit:number}) {
  const [choice,setChoice] = useState('');
  const active = segments.find(segment=>segment.category===choice);
  const visible = (active?.stories || stories).slice(0,limit);
  const leadSize = visible.length > 2 ? 2 : 1;
  const filters = segments.length > 0 && <div className="by-desk-filters" role="group" aria-label={sectionText(lang,'filter')+' · '+categoryLabel(name,lang)}>
    <button type="button" aria-pressed={!active} onClick={()=>setChoice('')}>{sectionText(lang,'all')}</button>
    {segments.map(segment=><button type="button" key={segment.category} aria-pressed={segment===active} onClick={()=>setChoice(segment.category)}>{categoryLabel(segment.category,lang)}</button>)}
  </div>;
  return <div className="by-desk-collection">
    <TopicRail category={name} lang={lang} controls={filters} selection={active?.category || ''}>
      <DeskLead key={active?.category || name} stories={visible.slice(0,leadSize)} lang={lang}/>
      {visible.slice(leadSize).map(story=><StoryCard key={story.slug} story={story} lang={lang}/>)}
    </TopicRail>
    <a className="by-desk-archive" href={localizedHref(categoryHref(active?.category || name),lang)}>
      {viewAll[publicLocales.indexOf(lang)]} · {categoryLabel(active?.category || name,lang)}
    </a>
  </div>;
}

export function DeskCollections({groups,lang,limit=8}: {groups:CategoryHeadlines[];lang:PublicLocale;limit?:number}) {
  const available = new Map(groups.filter(group=>group.stories.length).map(group=>[group.category,group]));
  return <div className="by-desk-collections">
    {groupDesks([...available.keys()]).map(desk=>{
      const segments = desk.children.map(child=>available.get(child)!);
      const merged = new Map<string,Summary>();
      for(const group of [available.get(desk.name), ...segments]){
        for(const story of group?.stories || []) merged.set(story.slug,story);
      }
      const stories = [...merged.values()].sort((a,b)=>(b.publishedAt || '').localeCompare(a.publishedAt || '') || a.slug.localeCompare(b.slug));
      return <DeskRail key={desk.name} name={desk.name} stories={stories} segments={segments} lang={lang} limit={limit}/>;
    })}
  </div>;
}

export function MostRated({rows,lang}: {rows:RatedArticle[];lang:PublicLocale}) {
  const countFormat = new Intl.NumberFormat(lang);
  const ratingFormat = new Intl.NumberFormat(lang,{minimumFractionDigits:1,maximumFractionDigits:1});
  return <section className="by-section by-most-rated" aria-labelledby="most-rated-heading">
    <div className="by-section-title"><h2 id="most-rated-heading">{ratedTitle[publicLocales.indexOf(lang)]}</h2></div>
    {rows.length ? <ol>{rows.map(({story,count,average})=><li key={story.slug}>
      <a href={localizedHref(articleHref(story),lang)}>
        <span className="by-rating-meta"><Star size={15} aria-hidden="true"/>
          <span aria-label={discussionText(lang,'outOfFive').replace('{value}', ratingFormat.format(average))}>{ratingFormat.format(average)} / 5</span>
          <span> · {discussionText(lang,'votes')} {countFormat.format(count)}</span></span>
        <strong lang={story.contentLocale} dir="auto">{story.title}</strong>
      </a>
    </li>)}</ol> : <p>{discussionText(lang,'noRatings')}</p>}
  </section>;
}
