import type { Summary } from './edition';
import { sportCategory, topicWords } from './story-topics';

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

const broad = new Set(['sports','sport','international','monde','canada','etats unis','societe','actualites','economie','transports','culture','sciences','technologies','politique','environnement','sante','ontario','quebec']);
const generalTerms = 'annee annees mois million millions milliard milliards annonce annoncee equipe equipes match jeu rapport hausse baisse debut fin prix plan projet projet public publique nouveau resultats retour donne donnees resultat bilan pays monde president gouvernement autorites ministre principal points campagne saison mercredi victoire ouvre lance travail accord droit devrait notamment cours premiere dernier derniere prochain prochaine groupe devenu devient';
for (const term of generalTerms.split(' ')) common.add(term);

// A shared event, team, subject, or place remains identifiable across different headline wording.
const concepts = [
  ['iowa','middletown','usine de munitions de l iowa','iowa army ammunition plant'],
  ['haiti','haitien','haitienne','haitiens','port au prince'], ['ukraine','ukrainien','ukrainienne','kyiv','kiev'],
  ['chine','chinois','chinoise','pekin'], ['canada','canadien','canadienne'], ['quebec','quebecois','quebecoise'],
  ['france','francais','francaise'], ['royaume uni','grande bretagne','britannique'], ['etats unis','americain','americaine'],
  ['gaza','gazaoui'], ['iran','iranien','iranienne','teheran'], ['soudan','soudanais','soudanaise'],
  ['election','elections','electoral','electorale','scrutin','urnes'], ['douane','douanes','droits de douane','tarifs douaniers'],
  ['meteo hivernale','verglas','pluie verglacante','tempete hivernale'], ['asteroide','asteroides','dimorphos','didymos'],
  ['astronomie','quasar','astrophysique','telescope spatial'], ['intelligence artificielle','ia','serveur d ia'],
  ['champions league','ligue des champions','ligue des championnes'],
  ['coupe stanley','stanley cup'], ['jeux olympiques','olympique','olympiques'],
  ['paris saint germain','psg','parisiens'], ['as roma','as rome','giallorossi'], ['lille osc','losc','lillois'],
  ['bayern munich','bayern','munichois'], ['villarreal','sous marin jaune'], ['slavia prague','slavia praha'],
  ['canadien de montreal','canadiens de montreal','tricolore'], ['golden knights','knights de vegas'],
  ['oilers d edmonton','oilers'], ['avalanche du colorado','avalanche de colorado'], ['maple leafs','leafs de toronto'],
].map(group=>group.map(topicWords));

function keywords(text:string) {
  return new Set(topicWords(text).split(' ').filter(word=>!common.has(word) && !/^\d+$/.test(word) &&
    (word.length>=3 || /^\p{L}\d$/u.test(word))).map(word=>word.length>5 ? word.replace(/s$/,'') : word));
}
function namedTerms(text:string) {
  const acronymOrName = text.match(/\b[A-ZÀÂÇÉÈÊËÎÏÔÛÙÜŸ][\p{L}\d’-]*/gu) ?? [];
  return new Set(acronymOrName.flatMap(word=>[...keywords(word)]));
}
function shared(a:Set<string>, b:Set<string>) { return [...a].filter(word=>b.has(word)); }
function profile(story:Topic) {
  const words = ' '+topicWords(story.title+' '+story.summary)+' ';
  const titleText = ' '+topicWords(story.title)+' ';
  const subjects = new Set(concepts.filter(group=>group.some(alias=>words.includes(' '+alias+' '))).map(group=>group[0]));
  const headlineSubjects = new Set(concepts.filter(group=>group.some(alias=>titleText.includes(' '+alias+' '))).map(group=>group[0]));
  return {title:keywords(story.title), all:keywords(story.title+' '+story.summary), names:namedTerms(story.title+' '+story.summary),
    subjects, headlineSubjects, category:topicWords(story.category),sport:sportCategory(story)};
}

// Look beyond the latest news cycle for the names and subjects mentioned by the article.
export function archiveSearchTerms(story:Topic) {
  return [...new Set([...namedTerms(story.title), ...profile(story).subjects, ...keywords(story.title)])].slice(0,7);
}

export function recommend<T extends Topic>(story:Topic, candidates:T[], random=Math.random) {
  const base = profile(story);
  const others = new Map(candidates.filter(item=>item.slug!==story.slug).map(item=>[item.slug,item]));
  const ranked = [...others.values()].map(item=>{
    const compare = profile(item);
    // A player's nationality alone should never connect reports about two different sports.
    if (base.sport && compare.sport && base.sport!==compare.sport) return {item,score:0};
    const names = shared(base.names,compare.names).filter(term=>base.title.has(term) || compare.title.has(term));
    const commonSubjects = shared(base.subjects,compare.subjects).filter(subject=>base.headlineSubjects.has(subject) || compare.headlineSubjects.has(subject));
    const headlines = shared(base.title,compare.title);
    const significant = shared(base.all,compare.all);
    const precise = base.category===compare.category && !broad.has(base.category);
    const sameSport = Boolean(base.sport && base.sport===compare.sport);
    // A generic section or one incidental word alone provides no evidence of a shared subject.
    const credible = names.length>0 || commonSubjects.length>0 || (headlines.length>0 && significant.length>=2) || precise || sameSport;
    const score = credible ? 11*names.length + 9*commonSubjects.length + 4*headlines.length +
      Math.min(significant.length,6) + (precise ? 2 : 0) + (sameSport ? 3 : 0) : 0;
    return {item,score};
  }).filter(row=>row.score>0).sort((a,b)=>b.score-a.score);
  const relatedLimit = ranked.length===others.size ? 8 : 6;
  const related = ranked.slice(0,relatedLimit).map(row=>row.item);
  // Keep related candidates beyond the six-card cap out of the discovery selection.
  for (const {item} of ranked) others.delete(item.slug);
  const rest = [...others.values()];
  for(let i=rest.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [rest[i],rest[j]]=[rest[j],rest[i]];
  }
  return { stories:[...related,...rest.slice(0,8-related.length)],relatedCount:related.length };
}
