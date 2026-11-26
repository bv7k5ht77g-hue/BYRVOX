import './cover.css';
import Image from 'next/image';
import type { ReactNode } from 'react';
import type { CoverPhoto } from '../../lib/cover-photo';

type Props = { photo: CoverPhoto; href?: string; badge?: ReactNode; priority?: boolean };

export function CoverFigure({ photo, href, badge, priority = false }: Props) {
  const image = <Image src={photo.url} width={1200} height={675} alt={photo.alt}
    unoptimized loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" />;
  return <figure className="cover-figure">
    {href ? <a href={href} className="cover-link">{badge}{image}</a> : image}
    <figcaption>
      {photo.caption && <span>{photo.caption}</span>}
      <span className="cover-credit">
        {photo.sourceUrl ? <a href={photo.sourceUrl}>{photo.credit || 'Source de l’image'}</a> : photo.credit}
        {photo.license && <> · {photo.licenseUrl ? <a href={photo.licenseUrl}>{photo.license}</a> : photo.license}</>}
      </span>
    </figcaption>
  </figure>;
}
