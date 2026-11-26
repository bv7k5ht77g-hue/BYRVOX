'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { blueskyPostParts } from '../../lib/editorial.mjs';
import type { PublicLocale } from '../../lib/i18n';

const embedOrigin = 'https://embed.bsky.app';
const originalPost: Record<PublicLocale, string> = {
  fr: 'Voir la publication originale sur Bluesky', en: 'View the original post on Bluesky',
  es: 'Ver la publicación original en Bluesky', ar: 'عرض المنشور الأصلي على بلوسكاي',
  'zh-CN': '在 Bluesky 查看原帖', ru: 'Посмотреть оригинальную публикацию в Bluesky', ko: 'Bluesky에서 원문 보기',
};

const archiveLabel: Record<PublicLocale, string> = {
  fr: 'Voir la photo d’archives', en: 'View the archive photo', es: 'Ver la foto de archivo',
  ar: 'عرض صورة الأرشيف', 'zh-CN': '查看资料照片', ru: 'Посмотреть архивное фото', ko: '자료 사진 보기',
};

export function ArticlePostCover({ postUrl, caption, locale, children }: {
  postUrl: string;
  caption?: string;
  locale: PublicLocale;
  children: ReactNode;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [theme, setTheme] = useState<string>();
  const [height, setHeight] = useState(0);
  const parts = blueskyPostParts(postUrl);
  const linkLabel = originalPost[locale];

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
    const observer = new MutationObserver(applyTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    applyTheme();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function resize(event: MessageEvent) {
      const iframe = frame.current;
      if (!iframe || event.origin !== embedOrigin || event.source !== iframe.contentWindow ||
          event.data?.id !== 'article-cover' || !Number.isFinite(event.data.height)) return;
      const received = Math.ceil(event.data.height);
      setHeight(received > 0 && received <= 6000 ? received : 0);
    }
    window.addEventListener('message', resize);
    return () => window.removeEventListener('message', resize);
  }, []);

  if (!parts) return children;
  const src = embedOrigin + '/embed/' + parts.did + '/app.bsky.feed.post/' + parts.rkey + '?id=article-cover&colorMode=' + theme;
  return <div className="reader-post-cover">
    {!height && children}
    <figure className="reader-embedded-post" lang={locale}>
      {theme && <iframe ref={frame} src={src} title={caption ?? linkLabel} height={height || 150}
        aria-hidden={height ? undefined : true} tabIndex={height ? undefined : -1}
        className={height ? undefined : 'reader-embed-pending'} referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" />}
      <figcaption>
        {height > 0 && caption && <span>{caption} </span>}
        <a href={postUrl}>{linkLabel}</a>
      </figcaption>
    </figure>
    {height > 0 && children && <details className="reader-archive-photo">
      <summary>{archiveLabel[locale]}</summary>
      {children}
    </details>}
  </div>;
}
