import type { Metadata } from 'next';
import { features } from '../lib/content';
import { headers } from 'next/headers';
import { publicSiteOrigin } from '../lib/site-url';
import { editionHref, sections, type Section, type Summary } from '../lib/edition';
import { listHomepageStories, listCategoryHeadlines, readEditionArticles } from '../lib/public-articles';
import { PublicEditionProvider } from '../components/edition/public-edition-provider';
import { categoryLabel, localizedHref, publicLocales, sectionLabel } from '../lib/i18n';
import { resolvePublicLocale } from '../lib/public-locale';
import { translateSummaries } from '../lib/public-translations';
import { canonicalCategory, type CategoryHeadlines } from '../lib/editorial-sections';
import { Edition } from '../components/edition/edition';

export const dynamic = 'force-dynamic';

type Params = Record<string, string | string[] | undefined>;
type Props = { searchParams: Promise<Params> };

function routeFrom(params: Params) {
  const first = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) || '';
  };
  const key = first('rubrique');
  const section: Section = Object.hasOwn(sections, key) ? key as Section : 'accueil';
  const page = section === 'recherche' || section === 'actualites' ? Number(first('page')) : 1;
  return { section, query: first('q').trim().slice(0, 160), category: canonicalCategory(first('categorie').trim().slice(0, 120)),
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 1_000_000) : 1 };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const locale = await resolvePublicLocale(params);
  const { section, query, category, page } = routeFrom(params);
  const href = editionHref(section, '', category, page);
  const origin = publicSiteOrigin((await headers()).get('host'));
  const languages = Object.fromEntries(publicLocales.map(language => [language,
    new URL(localizedHref(href,language), origin).href]));
  return {
    ...(section !== 'accueil' ? { title: category && section === 'actualites' ? categoryLabel(category,locale) : sectionLabel(section, locale) } : {}),
    alternates: { canonical: languages[locale], languages,
      types: { 'application/rss+xml': '/rss.xml' } },
    ...(section === 'favoris' || section === 'recherche' || query ? { robots: { index: false } } : {})
  };
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const locale = await resolvePublicLocale(params);
  const route = routeFrom(params);
  let stories: Summary[] = [];
  let unavailable = false;
  let hasNext = false;
  let categories: string[] = [];
  let headlines: CategoryHeadlines[] = [];
  try {
    if (route.section === 'accueil') [stories,headlines] = await Promise.all([listHomepageStories(),listCategoryHeadlines()]);
    if (route.section === 'recherche' || route.section === 'actualites') {
      const showTopics = route.section === 'actualites' && !route.query && route.page === 1 && !route.category;
      const [page,groups] = await Promise.all([readEditionArticles({...route,locale}), showTopics ? listCategoryHeadlines() : Promise.resolve([])]);
      ({stories,hasNext,categories} = page);
      headlines = groups;
    }
  } catch {
    unavailable = true;
  }
  const presentations = (route.section === 'presentations' || route.section === 'accueil' ? features : []).map(({ slug, title, category, summary, image }) => ({
    slug, title, category, summary, image, presentation: true
  }));
  const unique = new Map([...stories,...presentations,...headlines.flatMap(group=>group.stories)].map(story=>[story.slug,story]));
  const local = new Map((await translateSummaries([...unique.values()],locale)).map(story=>[story.slug,story]));
  const localize = (items: Summary[]) => items.map(story=>local.get(story.slug) || story);
  const localStories = localize(stories), localPresentations = localize(presentations);
  const localHeadlines = headlines.map(group=>({...group,stories:localize(group.stories)}));
  return <PublicEditionProvider locale={locale} allowThirdParty={route.section !== 'favoris'}><Edition route={route} stories={localStories} headlines={localHeadlines} presentations={localPresentations} unavailable={unavailable} hasNext={hasNext} categories={categories} /></PublicEditionProvider>;
}
