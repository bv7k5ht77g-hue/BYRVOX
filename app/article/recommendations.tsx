'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Newspaper } from 'lucide-react';
import Image from 'next/image';
import { articleHref, type Summary } from '../../lib/edition';
import { categoryLabel, localizedHref, type PublicLocale } from '../../lib/i18n';
import { readerLabels } from './reader-labels';

type Props = {stories: Summary[]; relatedCount: number; locale: PublicLocale};
export function Recommendations({stories, relatedCount, locale}: Props) {
  const track = useRef<HTMLOListElement>(null);
  const [edges, setEdges] = useState({start:true, end:true});
  const rtl = locale === 'ar';
  const copy = readerLabels(locale);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    function update() {
      if (!el) return;
      const distance = Math.abs(el.scrollLeft);
      const start = distance <= 2, end = distance >= el.scrollWidth - el.clientWidth - 2;
      setEdges(previous => previous.start === start && previous.end === end ? previous : {start,end});
    }
    const observer = new ResizeObserver(update);
    observer.observe(el);
    el.addEventListener('scroll',update,{passive:true});
    update();
    return () => {observer.disconnect(); el.removeEventListener('scroll', update);};
  }, [stories.length, rtl]);
  function step(direction: number) {
    const el = track.current;
    if (!el || el.children.length < 2) return;
    const stride = Math.abs(el.children[1].getBoundingClientRect().left - el.children[0].getBoundingClientRect().left);
    el.scrollBy({left: stride * direction * (rtl ? -1 : 1), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }
  if (!stories.length) return null;
  const Previous = rtl ? ChevronRight : ChevronLeft, Next = rtl ? ChevronLeft : ChevronRight;
  return <section className="reader-recommendations" aria-labelledby="recommended-title">
    <div className="recommendation-heading">
      <h2 id="recommended-title">{copy.more}</h2>
      {!(edges.start && edges.end) && <div className="recommendation-controls">
        <button type="button" aria-controls="recommended-list" aria-label={copy.previous} disabled={edges.start} onClick={()=>step(-1)}><Previous size={18}/></button>
        <button type="button" aria-controls="recommended-list" aria-label={copy.next} disabled={edges.end} onClick={()=>step(1)}><Next size={18}/></button>
      </div>}
    </div>
    <ol id="recommended-list" className="recommendation-track" ref={track} tabIndex={0} aria-labelledby="recommended-title"
      onKeyDown={event => {
        if (event.altKey || event.metaKey || event.ctrlKey || event.target !== event.currentTarget) return;
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
          step((event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1));
        }
      }}>
      {stories.map((item,index) => <li key={item.slug} className="recommendation-card">
        <a href={localizedHref(articleHref(item),locale)}>
          <div className="recommendation-image">{item.photo ?
            <Image unoptimized loading="lazy" decoding="async" width={400} height={225} alt="" src={item.photo.thumbnailUrl || item.photo.url} /> :
            <Newspaper size={30} strokeWidth={1.35} aria-hidden="true"/>}</div>
          <p className="recommendation-meta"><span>{index < relatedCount ? copy.related : copy.discover}</span><span>{categoryLabel(item.category,locale)}</span></p>
          <h3 lang={item.contentLocale || locale} dir="auto">{item.title}</h3>
        </a>
      </li>)}
    </ol>
  </section>;
}
