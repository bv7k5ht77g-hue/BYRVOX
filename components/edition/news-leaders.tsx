'use client';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { articleHref } from '../../lib/edition';
import { categoryLabel, localizedHref, publicLocales, sectionLabel, type PublicLocale } from '../../lib/i18n';
import type { NewsSlide } from '../../lib/news-leaders';
import { CoverFigure } from './cover-figure';
import { leaderLabel } from './rankings';
import { sectionText } from './section-copy';
import './news-leaders.css';

const rotationLabels = {
  pause: ['Mettre le carrousel en pause', 'Pause slideshow', 'Pausar el carrusel', 'إيقاف العرض مؤقتاً', '暂停轮播', 'Приостановить показ', '자동 재생 일시 정지'],
  play: ['Démarrer le carrousel', 'Start slideshow', 'Iniciar el carrusel', 'بدء العرض', '开始轮播', 'Начать показ', '자동 재생 시작']
};

export function NewsLeaders({ slides, lang }: { slides: NewsSlide[]; lang: PublicLocale }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);
  const rotationControl = useRef<HTMLButtonElement>(null);
  const count = slides.length;
  const current = index % (count || 1);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyPreference = () => setPlaying(!motion.matches);
    applyPreference();
    motion.addEventListener('change', applyPreference);
    return () => motion.removeEventListener('change', applyPreference);
  }, []);
  useEffect(() => {
    if (count < 2 || !playing || hovered) return;
    const interval = window.setInterval(() => {
      if (!document.hidden) setIndex(value => (value + 1) % count);
    }, 8500);
    return () => window.clearInterval(interval);
  }, [count, playing, hovered]);
  const slide = slides[current];
  if (!slide?.story.photo) return null;
  const {story, labels} = slide;
  const href = localizedHref(articleHref(story), lang);
  function move(delta: number) {
    setPlaying(false);
    setIndex(value => (value + delta + count) % count);
  }
  const number = new Intl.NumberFormat(lang);
  const rotation = rotationLabels[playing ? 'pause' : 'play'][publicLocales.indexOf(lang)];
  return <section className="by-news-leaders" aria-labelledby="hub-title"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={event => { if (event.target !== rotationControl.current) setPlaying(false); }}>
    <div className="by-leaders-top">
      <h1 id="hub-title">{sectionLabel('actualites',lang)}</h1>
      {count > 1 && <div className="by-leaders-controls">
        <button type="button" ref={rotationControl} aria-label={rotation} title={rotation} onClick={() => setPlaying(!playing)}>
          {playing ? <Pause aria-hidden="true" size={18}/> : <Play aria-hidden="true" size={18}/>}
        </button>
        <button type="button" aria-label={sectionText(lang,'prev')} title={sectionText(lang,'prev')} onClick={() => move(-1)}>
          <ArrowLeft aria-hidden="true" size={19}/>
        </button>
        <span className="by-leaders-count">{number.format(current + 1)} / {number.format(count)}</span>
        <button type="button" aria-label={sectionText(lang,'next')} title={sectionText(lang,'next')} onClick={() => move(1)}>
          <ArrowRight aria-hidden="true" size={19}/>
        </button>
      </div>}
    </div>
    <div className="by-leaders-slide" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
      <div className="by-leaders-copy">
        <div className="by-leaders-labels">{labels.map(label => <span key={label}>{leaderLabel(label, lang)}</span>)}</div>
        <p className="by-leaders-category">{categoryLabel(story.category, lang)}</p>
        <h2><a href={href}>{story.title}</a></h2>
        <p className="by-leaders-summary">{story.summary}</p>
        <a href={href} className="by-leaders-read">{sectionText(lang,'read')} <ArrowRight size={17} aria-hidden="true"/></a>
      </div>
      <CoverFigure photo={slide.story.photo} href={href} priority/>
    </div>
  </section>;
}
