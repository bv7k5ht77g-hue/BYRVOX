'use client';

import { Bookmark, Plus, Search } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { canonicalCategory } from '../../lib/editorial-sections';
import { editionHref, fold, type Summary } from '../../lib/edition';
import { categoryLabel, localizedHref, sectionLabel, type PublicLocale } from '../../lib/i18n';
import { usePublicLocale } from '../language-select';
import { sectionText } from './section-copy';
import { StoryCard } from './story-card';
import './featured-contents.css';

const labels: Record<PublicLocale, {title: string; more: string}> = {
  fr: {title: 'Nos contenus à la une', more: 'Afficher plus de contenus'},
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

export function FeaturedContents({ stories, presentations, savedCount, saveButton }: FeaturedContentsProps) {
  const lang = usePublicLocale();
  const [activeCategory, setActiveCategory] = useState('');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const pool = Array.from(new Map([...presentations, ...stories].map(story => [story.slug, story])).values());
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
  return <section className="by-section by-spotlight" aria-labelledby="featured-contents-title">
    <div className="by-section-title">
      <h2 id="featured-contents-title">{copy.title}</h2>
      <a className="by-spotlight-saved" href={localizedHref(editionHref('favoris'),lang)}>
        <Bookmark size={16} aria-hidden="true"/>{sectionLabel('favoris',lang)} <span>{new Intl.NumberFormat(lang).format(savedCount)}</span>
      </a>
    </div>
    <div className="by-spotlight-toolbar">
      <div className="by-spotlight-categories" role="group" aria-label={sectionText(lang,'filter')}>
        {['', ...categories].map(category =>
          <button key={category} type="button" aria-pressed={activeCategory === category}
            onClick={() => { setActiveCategory(category); setVisibleCount(pageSize); }}>
            {category === presentationsFilter ? sectionText(lang,'presentations') : category ? categoryLabel(category,lang) : sectionText(lang,'all')}
          </button>)}
      </div>
      <label className="by-spotlight-search"><Search size={16} aria-hidden="true" />
        <input type="search" value={query} maxLength={160} aria-label={sectionText(lang,'searchField')}
          placeholder={sectionText(lang,'placeholder')} onChange={event => { setQuery(event.target.value); setVisibleCount(pageSize); }}/>
      </label>
    </div>
    {filtered.length ? <>
      <div className="by-story-grid by-spotlight-grid">
        {filtered.slice(0, visibleCount).map(story =>
          <StoryCard key={story.slug} story={story} lang={lang} showSummary save={saveButton(story)} />)}
      </div>
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
