'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { categoryHref, featuredCategories } from '../../lib/editorial-sections';
import { categoryLabel, localizedHref } from '../../lib/i18n';
import { usePublicLocale } from '../language-select';
import { sectionText } from './section-copy';

import {useAudience} from './audience';
import {CategoryLink} from './category-mark';
export function HeaderTopics({ category }: { category?: string }) {
  const lang = usePublicLocale();
  const data=useAudience();
  const scores=new Map<string,number>();
  for(const row of data) if(row.week && row.category!=='Haïti')scores.set(row.category,(scores.get(row.category)||0)+row.week);
  const topics=[...new Set([...scores.keys(),...featuredCategories])].sort((a,b)=>(scores.get(b)||0)-(scores.get(a)||0));
  const [rotation,setRotation]=useState(0);
  useEffect(()=>setRotation(Math.floor(Math.random()*1000)),[]);
  const tail=topics.slice(4);const cut=rotation%Math.max(1,tail.length);
  const visible=[...topics.slice(0,4),...tail.slice(cut),...tail.slice(0,cut)].slice(0,8);
  const disclosure = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);

  useEffect(() => {
    const panel = disclosure.current;
    if (!panel) return;
    const closeOutside = (event: PointerEvent) => {
      if (!panel.contains(event.target as Node)) panel.open = false;
    };
    const closeOnScroll = () => {
      if (!panel.open) return;
      if (panel.contains(document.activeElement)) trigger.current?.focus({ preventScroll: true });
      panel.open = false;
    };
    document.addEventListener('pointerdown', closeOutside);
    window.addEventListener('scroll', closeOnScroll, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      window.removeEventListener('scroll', closeOnScroll);
    };
  }, []);

  return <details ref={disclosure} className="header-topics" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
  }} onKeyDown={event => {
    if (event.key === 'Escape' && event.currentTarget.open) {
      event.stopPropagation();
      event.currentTarget.open = false;
      trigger.current?.focus({ preventScroll: true });
    }
  }}>
    <summary ref={trigger} aria-label={sectionText(lang, 'coverage')} title={sectionText(lang, 'coverage')}>
      <ChevronDown size={15} aria-hidden="true" />
    </summary>
    <div className="header-topics-panel">
      <div className="header-topics-list">
        {visible.map(topic => <CategoryLink key={topic} category={topic} label={categoryLabel(topic, lang)} href={localizedHref(categoryHref(topic), lang)}
          aria-current={category === topic ? 'page' : undefined}/>)}
      </div>
    </div>
  </details>;
}
