'use client';

import { useEffect, useState } from 'react';
import type { PublicLocale } from '../../lib/i18n';

export function ArticleHeaderTitle({ title, language }: { title: string; language: PublicLocale }) {
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const heading = document.getElementById('article-heading');
    const header = document.querySelector<HTMLElement>('header.edition-header');
    if (!heading || !header) return;

    const canObserve = typeof IntersectionObserver !== 'undefined';
    let observer: IntersectionObserver | undefined;
    function measure() {
      if (!heading || !header) return;
      const height = Math.round(header.getBoundingClientRect().height);
      const update = () => setPassed(heading.getBoundingClientRect().bottom <= header.getBoundingClientRect().bottom);
      observer?.disconnect();
      update();
      if (canObserve) {
        observer = new IntersectionObserver(update, { rootMargin: `-${height}px 0px 0px 0px` });
        observer.observe(heading);
      }
    }
    const updateOnScroll = () => setPassed(heading.getBoundingClientRect().bottom <= header.getBoundingClientRect().bottom);
    measure();
    const size = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    size?.observe(header);
    if (!canObserve) window.addEventListener('scroll', updateOnScroll, { passive:true });
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect(); size?.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', updateOnScroll);
    };
  }, [title]);

  return <a href="#article-heading" className="article-header-title" hidden={!passed} lang={language} dir="auto"
    title={title}>{title}</a>;
}
