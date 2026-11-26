'use client';

import { type CSSProperties, useEffect, useRef, useState } from 'react';
import type { PublicLocale } from '../../lib/i18n';

export function ArticleHeaderTitle({ title, language }: { title: string; language: PublicLocale }) {
  const [passed, setPassed] = useState(false);
  const viewport = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);

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

  useEffect(() => {
    const frame = viewport.current;
    const label = text.current;
    if (!passed || !frame || !label) return;

    function measure() {
      if (!frame || !label) return;
      const extra = label.getBoundingClientRect().width - frame.getBoundingClientRect().width;
      setOverflow(extra > 1 ? Math.ceil(extra) : 0);
    }
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(label);
    return () => observer.disconnect();
  }, [passed, title, language]);

  const motion = overflow > 0 ? {
    '--title-overflow': `${overflow}px`,
    '--title-duration': `${Math.max(4, overflow / 38 + 2)}s`,
  } as CSSProperties : undefined;
  return <a href="#article-heading" className="article-header-title" hidden={!passed} lang={language} dir="auto"
    title={title}><span ref={viewport} className="article-title-viewport">
      <span ref={text} className="article-title-text" data-overflow={overflow > 0 || undefined}
        style={motion}>{title}</span>
    </span></a>;
}
