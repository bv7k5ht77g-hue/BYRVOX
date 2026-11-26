'use client';

import { Bookmark, ChevronDown, Plus, Search } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { canonicalCategory } from '../../lib/editorial-sections';
import { articleHref, editionHref, fold, type Summary } from '../../lib/edition';
import {CategoryButton, Mark} from './category-mark';
import { categoryLabel, localizedHref, sectionLabel, type PublicLocale } from '../../lib/i18n';
import { usePublicLocale } from '../language-select';
import { sectionText } from './section-copy';
import { StoryCardImage, StoryDate } from './story-card';
import './featured-contents.css';

const labels: Record<PublicLocale, {title: string; more: string}> = {
  fr: {title: 'À découvrir dans nos rubriques', more: 'Afficher plus de contenus'},
  en: {title: 'Featured stories', more: 'Show more stories'},
  es: {title: 'Contenidos destacados', more: 'Mostrar más contenidos'},
  ar: {title: 'مختارات التحرير', more: 'عرض المزيد'},
  'zh-CN': {title: '编辑精选', more: '显示更多内容'},
  ru: {title: 'Избранные материалы', more: 'Показать больше материалов'},
  ko: {title: '편집부 추천', more: '콘텐츠 더 보기'},
};

const pageSize = 4;
const presentationsFilter = 'byrvox-presentations';

type FeaturedContentsProps = {
  stories: Summary[];
  presentations: Summary[];
  savedCount: number;
  saveButton: (story: Summary) => ReactNode;
};

function SpotlightCard({ story, lang, save }: { story: Summary; lang: PublicLocale; save: ReactNode }) {
  return <article className="by-spotlight-card">
    <StoryCardImage story={story} />
    <div className="by-spotlight-copy">
      <p className="by-category"><Mark category={story.category} label={categoryLabel(story.category, lang)}/></p>
      <h3 lang={story.contentLocale} dir="auto"><a href={localizedHref(articleHref(story), lang)}>{story.title}</a></h3>
      <p className="by-spotlight-deck" lang={story.contentLocale} dir="auto">{story.summary}</p>
      <div className="by-spotlight-meta">
        <small><StoryDate story={story} lang={lang} /></small>
        {save}
      </div>
    </div>
  </article>;
}

export function FeaturedContents({ stories, presentations, savedCount, saveButton }: FeaturedContentsProps) {
  const lang = usePublicLocale();
  const [activeCategory, setActiveCategory] = useState('');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const unique = Array.from(new Map([...presentations, ...stories].map(story => [story.slug, story])).values());
  const desks=new Map<string,Summary[]>();
  for(const item of unique){const group=desks.get(item.category)||[];group.push(item);desks.set(item.category,group)}
  const pool=Array.from({length:Math.max(0,...Array.from(desks.values(),g=>g.length))},(_,i)=>Array.from(desks.values()).flatMap(g=>g[i]?[g[i]]:[])).flat();
  const categories = [...new Set(stories.filter(story => !story.presentation).map(story => canonicalCategory(story.category)).filter(Boolean))];
  if (presentations.length) categories.push(presentationsFilter);
  const terms = fold(query).split(/\s+/u).filter(Boolean);
  const filtered = pool.filter(story => {
    const category = canonicalCategory(story.category);
    if (activeCategory && activeCategory !== (story.presentation ? presentationsFilter : category)) return false;
    const text = fold([story.title, story.summary, categoryLabel(category,lang), category].join(' '));
    return terms.every(term => text.includes(term));
  });
  if (!pool.length) return null;
  const copy = labels[lang];
  function categoryName(category: string) {
    if (category === presentationsFilter) return sectionText(lang,'presentations');
    return category ? categoryLabel(category,lang) : sectionText(lang,'all');
  }
  function selectCategory(category: string) {
    setActiveCategory(category);
    setVisibleCount(pageSize);
  }
  const visibleStories = filtered.slice(0, visibleCount);
  const firstSpread = visibleStories.slice(0, pageSize);
  const moreStories = visibleStories.slice(pageSize);
  function card(story: Summary) {
    return <SpotlightCard key={story.slug} story={story} lang={lang} save={saveButton(story)} />;
  }
  return <section className="by-section by-spotlight" aria-labelledby="featured-contents-title">
    <div className="by-spotlight-heading">
      <h2 id="featured-contents-title">{copy.title}</h2>
      <a className="by-spotlight-saved" href={localizedHref(editionHref('favoris'),lang)}>
        <Bookmark size={16} aria-hidden="true"/>{sectionLabel('favoris',lang)} <span>{new Intl.NumberFormat(lang).format(savedCount)}</span>
      </a>
    </div>
    <div className="by-spotlight-toolbar">
      <div className="by-spotlight-topics" role="group" aria-label={sectionText(lang,'filter')}>
        <div className="by-spotlight-categories">
          {['', ...categories.slice(0, 3)].map(category =>
            <CategoryButton key={category} category={category} label={categoryName(category)} aria-pressed={activeCategory === category}
              onClick={() => selectCategory(category)}/>)}
        </div>
        {categories.length > 0 && <label className="by-spotlight-picker">
          <select aria-label={sectionText(lang,'filter')} value={activeCategory}
            onChange={event => selectCategory(event.target.value)}>
            <option value="">{sectionText(lang,'topics')} · {sectionText(lang,'all')}</option>
            {categories.map(category => <option key={category} value={category}>{categoryName(category)}</option>)}
          </select>
          <ChevronDown size={14} aria-hidden="true"/>
        </label>}
      </div>
      <label className="by-spotlight-search"><Search size={16} aria-hidden="true" />
        <input type="search" value={query} maxLength={160} aria-label={sectionText(lang,'searchField')}
          placeholder={sectionText(lang,'placeholder')} onChange={event => { setQuery(event.target.value); setVisibleCount(pageSize); }}/>
      </label>
    </div>
    {filtered.length ? <>
      <div className={'by-spotlight-grid' + (firstSpread.length === pageSize ? ' by-spotlight-spread' : '')}>
        {firstSpread.map(card)}
      </div>
      {moreStories.length > 0 && <div className="by-spotlight-grid by-spotlight-continuation">{moreStories.map(card)}</div>}
      {filtered.length > visibleCount &&
        <button className="by-spotlight-more" type="button" onClick={() => setVisibleCount(count => count + pageSize)}>
          <Plus size={16} aria-hidden="true"/>{copy.more}
        </button>}
    </> : <div className="by-spotlight-empty">
      <p role="status">{sectionText(lang,'noMatch')}</p>
      <button type="button" onClick={() => { setActiveCategory(''); setQuery(''); setVisibleCount(pageSize); }}>
        {sectionText(lang,'reset')}
      </button>
    </div>}
  </section>;
}
