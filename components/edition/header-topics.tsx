'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { categoryHref, featuredCategories } from '../../lib/editorial-sections';
import { categoryLabel, localizedHref } from '../../lib/i18n';
import { usePublicLocale } from '../language-select';
import { sectionText } from './section-copy';

export function HeaderTopics({ category }: { category?: string }) {
  const lang = usePublicLocale();
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
        {featuredCategories.map(topic => <a key={topic} href={localizedHref(categoryHref(topic), lang)}
          aria-current={category === topic ? 'page' : undefined}>{categoryLabel(topic, lang)}</a>)}
      </div>
    </div>
  </details>;
}
