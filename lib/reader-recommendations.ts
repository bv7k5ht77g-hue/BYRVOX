import type { Summary } from './edition';

type Topic = Pick<Summary, 'slug' | 'title' | 'summary' | 'category'>;
// Ignore French grammatical words, calendar names, and routine headline phrasing.
const common = new Set((
  'afin ainsi alors après aucun aucune aujourd hui auprès aussi aussitôt autant autour autre autres aux avait avaient avec avoir ' +
  'bien car cela celle celles celui ces cet cette ceux chaque chez cinq comme comment contre dans davantage déjà depuis des deux devant ' +
  'devra doit dont durant elle elles encore entre étaient était être eux face fait faits faire fois grand grande grands grandes hors ' +
  'ils janvier février mars avril mai juin juillet août septembre octobre novembre décembre lundi mardi mercredi jeudi vendredi samedi dimanche ' +
  'jour jours laquelle lequel lesquelles lesquels les leur leurs lorsque lui mais même mêmes moins notre nous nouvelles nouveau nouveaux nouvelle ' +
  'ont où par parce parmi partir pas pendant peut peut-être plus plusieurs pour près première premières premier premiers propose prévoit ' +
  'puis publié quand quatre que quel quelle quelles quels question qui sans ses sept sera seront seul seule si six son sont sous suite ' +
  'sur tant toute toutes tous tout très trois une unes vers via vos votre vous'
).normalize('NFD').replace(/\p{M}/gu, '').split(/\s+/));

function terms(text: string) {
  const words = text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').match(/[\p{L}\d]+/gu) ?? [];
  return new Set(words.filter(word => !common.has(word) && !/^\d+$/.test(word) &&
    (word.length >= 3 || /^\p{L}\d$/u.test(word))).map(word => word.length > 5 ? word.replace(/s$/, '') : word));
}

function shared(a: Set<string>, b: Set<string>) {
  let count = 0;
  for (const word of a) if (b.has(word)) count++;
  return count;
}

export function recommend<T extends Topic>(story: Topic, candidates: T[], random = Math.random) {
  const title = terms(story.title);
  const details = terms(story.summary);
  const others = new Map(candidates.filter(item => item.slug !== story.slug).map(item => [item.slug, item]));
  const ranked = Array.from(others.values(), item => {
    const headline = terms(item.title);
    const repeatedTitle = shared(title, headline);
    const matchedDetails = shared(details, headline) + shared(title, terms(item.summary));
    const sameSection = item.category === story.category;
    const score = 5 * repeatedTitle + matchedDetails + (sameSection ? 2 : 0);
    return { item, score };
  }).filter(({score}) => score >= 2).sort((a, b) => b.score - a.score);
  const related = ranked.slice(0, 4).map(({item}) => item);
  for (const item of related) others.delete(item.slug);
  const rest = [...others.values()];
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return { stories: [...related, ...rest.slice(0, 8 - related.length)], relatedCount: related.length };
}
