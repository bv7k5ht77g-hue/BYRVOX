'use client';
import { useEffect, useRef } from 'react';

export function ReadingProgress() {
  const fill = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    function measure() {
      frame = 0;
      const range = document.documentElement.scrollHeight - window.innerHeight;
      const position = range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0;
      if (fill.current) fill.current.style.transform = 'scaleX(' + position + ')';
    }
    function queue() { if (!frame) frame = requestAnimationFrame(measure); }
    const observer = new ResizeObserver(queue);
    observer.observe(document.body);
    window.addEventListener('scroll',queue,{passive:true});
    window.addEventListener('resize',queue);
    window.addEventListener('pageshow',queue);
    measure();
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener('scroll',queue);
      window.removeEventListener('resize',queue);
      window.removeEventListener('pageshow',queue);
    };
  }, []);
  return <div className="byrvox-progress" aria-hidden="true"><span ref={fill}/></div>;
}
