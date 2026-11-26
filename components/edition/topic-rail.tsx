'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { categoryHref } from '../../lib/editorial-sections';
import { categoryLabel, localizedHref, type PublicLocale } from '../../lib/i18n';
import { sectionText } from './section-copy';

export function TopicRail({ category, lang, children, controls, current = false }: {
  category: string; lang: PublicLocale; children: ReactNode; controls?: ReactNode; current?: boolean;
}) {
  const uid = useId(), viewport = useRef<HTMLDivElement>(null);
  const [movement,setMovement] = useState({ back:false, next:false });
  const rtl = lang === 'ar';
  useEffect(() => {
    const rail = viewport.current;
    if (!rail) return;
    function inspect() {
      if (!rail) return;
      const offset = Math.abs(rail.scrollLeft);
      setMovement({ back:offset>2, next:offset+rail.clientWidth < rail.scrollWidth-2 });
    }
    inspect();
    const observer = new ResizeObserver(inspect);
    observer.observe(rail);
    rail.addEventListener('scroll',inspect,{passive:true});
    return () => { observer.disconnect(); rail.removeEventListener('scroll',inspect); };
  },[children,rtl]);
  function scroll(direction: number) {
    const rail = viewport.current;
    if (!rail) return;
    const amount = rail.firstElementChild?.getBoundingClientRect().width || rail.clientWidth;
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
    rail.scrollBy({left:(rtl?-1:1)*direction*(amount+gap), behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  }
  const Back=rtl?ChevronRight:ChevronLeft, Forward=rtl?ChevronLeft:ChevronRight;
  return <section className="by-topic-rail" aria-labelledby={uid}>
    <div className="by-rail-title"><h2 id={uid}>{current ? sectionText(lang,'headlines') :
      <a href={localizedHref(categoryHref(category),lang)}>{categoryLabel(category,lang)}</a>}</h2>
      {controls}
      {(movement.back || movement.next) && <div className="by-rail-buttons">
        <button type="button" aria-label={sectionText(lang,'prev')} aria-controls={uid+'-items'} disabled={!movement.back} onClick={()=>scroll(-1)}><Back size={16}/></button>
        <button type="button" aria-label={sectionText(lang,'next')} aria-controls={uid+'-items'} disabled={!movement.next} onClick={()=>scroll(1)}><Forward size={16}/></button>
      </div>}</div>
    <div className="by-rail-items" ref={viewport} id={uid+'-items'} tabIndex={0} aria-labelledby={uid}>{children}</div>
  </section>;
}
