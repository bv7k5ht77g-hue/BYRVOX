import type { Metadata } from "next";
import Image from "next/image";
import { articleUrl } from "../../../lib/site-url";
import { notFound } from "next/navigation";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { Clock3, House, Link2 } from "lucide-react";
import { features, type Story } from "../../../lib/content";
import { getDb } from "../../../db";
import { articles } from "../../../db/schema";
import { formatDate, isoDate } from "../../../lib/publication-date";
import { sourcesForReader } from "../presentation";
import ReaderThemeSwitch from "../theme-switch";
import "../reader.css";

export const dynamic = "force-dynamic";
type ArticleProps = { params: Promise<{ slug: string }> };

type ReaderArticle = { story: Story; isFeature: boolean };

const getArticle = cache(async (slug: string): Promise<ReaderArticle | null> => {
  const feature = features.find((article) => article.slug === slug);
  if (feature) return { story: feature, isFeature: true };

  const [story] = await getDb().select({
    slug: articles.slug, title: articles.title, category: articles.category, summary: articles.summary,
    body: articles.body, sources: articles.sources, publishedAt: articles.publishedAt, updatedAt: articles.updatedAt,
  }).from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
    .limit(1);
  return story ? { story, isFeature: false } : null;
});

export async function generateMetadata({ params }: ArticleProps): Promise<Metadata> {
  const { slug } = await params;
  const record = await getArticle(slug);
  if (!record) return { title: "Article introuvable", robots: { index: false, follow: false } };
  const { story, isFeature } = record;
  const path = articleUrl(slug);
  return {
    title: story.title,
    description: story.summary,
    alternates: { canonical: path, types: { "application/rss+xml": "/rss.xml" } },
    openGraph: {
      title: story.title, description: story.summary, type: "article",
      url: path, locale: "fr_CA", siteName: "BYRVOX", section: story.category,
      publishedTime: isoDate(story.publishedAt) ?? undefined,
      modifiedTime: isoDate(story.updatedAt) ?? undefined,
      ...(isFeature && story.image ? { images: [{ url: "/media/" + story.image + ".webp" }] } : {}),
    },
    twitter: { card: "summary", title: story.title, description: story.summary },
  };
}

export default async function Article({ params }: ArticleProps) {
  const { slug } = await params;
  const record = await getArticle(slug);
  if (!record) notFound();
  const { story, isFeature } = record;
  const sources = sourcesForReader(story.sources);
  const published = isoDate(story.publishedAt);
  const updated = isoDate(story.updatedAt);
  const readingMinutes = Math.max(1, Math.ceil(story.body.trim().split(/\s+/u).length / 220));
  const linkedData = {
    "@context": "https://schema.org",
    "@type": isFeature ? "Article" : "NewsArticle",
    mainEntityOfPage: articleUrl(slug),
    headline: story.title, description: story.summary, articleSection: story.category,
    inLanguage: "fr", author: { "@type": "Organization", name: "BYRVOX" },
    publisher: { "@type": "Organization", name: "BYRVOX" },
    datePublished: published || undefined, dateModified: updated || undefined,
    citation: sources.length ? sources.map((s) => s.url) : undefined,
  };

  return (
    <>
      <a className="skip" href="#lecture">Aller à l’article</a>
      <header className="reader-header">
        <div className="reader-header-inner">
          <a href="/" className="reader-logo" aria-label="Accueil BYRVOX">
            <span aria-hidden="true">BYRVOX</span>
          </a>
          <div className="reader-tools">
            <a href="/"><House size={17} aria-hidden="true" /> Accueil</a>
            <ReaderThemeSwitch />
          </div>
        </div>
      </header>
      <main id="lecture" className="reader-main">
        <article>
          <div className="reader-heading">
            <p className="reader-category">{story.category}</p>
            <h1>{story.title}</h1>
            <p className="reader-deck">{story.summary}</p>
            <div className="reader-byline">
              <strong>La rédaction BYRVOX</strong>
              {isFeature && <span>Présentation du média</span>}
              {published && <span>Publié le <time dateTime={published}>{formatDate(published)}</time></span>}
              {updated && published && updated > published && (
                <span>Mis à jour le <time dateTime={updated}>{formatDate(updated)}</time></span>
              )}
              <span className="reader-duration"><Clock3 size={14} aria-hidden="true" />{readingMinutes} min de lecture</span>
            </div>
          </div>
          {isFeature && story.image && story.image !== "city" && (
            <figure className="reader-photo">
              <Image src={"/media/" + story.image + ".webp"} width={900} height={400} alt="" loading="eager" unoptimized />
              <figcaption>Illustration de présentation BYRVOX</figcaption>
            </figure>
          )}
          <div className="reader-copy">
            {story.body.split(/\r?\n/).filter((p) => p.trim()).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {(!isFeature || sources.length > 0) && (
            <section aria-labelledby="sources" className="reader-sources">
              <h2 id="sources">Sources de l’article</h2>
              {sources.length ? (
                <ul>{sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url}>
                      <span><strong>{s.name}</strong><small>{new URL(s.url).hostname}</small></span>
                      <Link2 size={18} aria-hidden="true" />
                    </a>
                  </li>
                ))}</ul>
              ) : <p>Aucun lien de source disponible pour cet article.</p>}
            </section>
          )}
        </article>
        <a href="/" className="reader-back"><House size={16} aria-hidden="true" /> Retour à l’accueil</a>
      </main>
      <script type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(linkedData).replace(/</g, "\\u003c") }} />
    </>
  );
}
