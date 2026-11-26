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

const generalTerms = 'annee annees mois million millions milliard milliards annonce annoncee equipe equipes match jeu rapport hausse baisse debut fin prix plan projet projet public publique nouveau resultats retour donne donnees resultat bilan pays monde president gouvernement autorites ministre principal points campagne saison mercredi victoire ouvre lance travail accord droit devrait notamment cours premiere dernier derniere prochain prochaine groupe devenu devient';
const incidental = 'est sont ete etaient etait seront serait sera etre suis as ont avons etes fut etant dont cet ceux cela celle leurs des un les du dans devant arriere autour nord sud ouest dix vingt part point arrive premiere premieres premier premiers dernier derniers derniere dernieres fin suite meurt mort pris prise fait annonce reportee annoncee usage dit alerte situation nouveau marque resultat marque notamment plusieurs millions milliards dollars chiffre chiffre prix etude equipe defaite victoire rencontree dirigeant mesure';
for (const term of (generalTerms+' '+incidental).split(' ')) common.add(term);

// A shared event, team, subject, or place remains identifiable across different headline wording.
const places = [
  ['iowa','middletown'],
  ['haiti','haitien','haitienne','haitiens','port au prince'], ['ukraine','ukrainien','ukrainienne','kyiv','kiev'],
  ['chine','chinois','chinoise','pekin'], ['canada','canadien','canadienne'], ['quebec','quebecois','quebecoise'],
  ['france','francais','francaise'], ['royaume uni','grande bretagne','britannique'], ['etats unis','americain','americaine'],
  ['gaza','gazaoui'], ['iran','iranien','iranienne','teheran'], ['soudan','soudanais','soudanaise'],
  ['cuba','cubain','cubaine','la havane'], ['ethiopie','ethiopien','ethiopienne'],
].map(group=>group.map(topicWords));

const concepts = [
  ['election','elections','presidentielle','legislatives','electoral','electorale','scrutin','urnes'], ['douane','douanes','droits de douane','tarifs douaniers'],
  ['meteo hivernale','verglas','pluie verglacante','tempete hivernale'], ['asteroide','asteroides','dimorphos','didymos'],
  ['station spatiale','station spatiale internationale','iss','tiangong','station orbitale'],
  ['sonde interplanetaire','sonde europeenne','sonde dart','mission planetaire'],
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
  const acronymOrName = text.match(/(?<![\p{L}\p{N}])\p{Lu}[\p{L}\p{N}’-]*/gu) ?? [];
  return new Set(acronymOrName.flatMap(word=>[...keywords(word)]));
}
function shared(a:Set<string>, b:Set<string>) { return [...a].filter(word=>b.has(word)); }
function matched(groups:string[][],text:string) {
  return new Set(groups.filter(group=>group.some(alias=>text.includes(' '+alias+' '))).map(group=>group[0]));
}
const disciplines = new Set(['tennis','basketball','football americain','football canadien','formule 1','cyclisme','baseball','golf']);
const geographicWords = new Set(places.flat(2).flatMap(alias=>[...keywords(alias)]));
function profile(story:Topic) {
  const full = story.title+' '+story.summary;
  const words = ' '+topicWords(full)+' ';
  const category = topicWords(story.category);
  const title = keywords(story.title);
  const all = keywords(full);
  const names = namedTerms(full);
  // Geography corroborates a topic. A demonym, a place of birth, or a timezone is not a dossier.
  for (const word of geographicWords) { title.delete(word); all.delete(word); names.delete(word); }
  const sport = sportCategory(story) || (disciplines.has(category) ? category : null);
  return {title,all,names,titleNames:namedTerms(story.title),subjects:matched(concepts,words),places:matched(places,words),sport,
    sportsDesk:Boolean(sport) || category==='sports' || category==='sport'};
}

// Look beyond the latest news cycle for the names and subjects mentioned by the article.
export function archiveSearchTerms(story:Topic) {
  const {subjects,places} = profile(story);
  return [...new Set([...namedTerms(story.title), ...subjects, ...places, ...keywords(story.title)])].slice(0,7);
}

export function recommend<T extends Topic>(story:Topic, candidates:T[], random=Math.random) {
  const base = profile(story);
  const others = new Map(candidates.filter(item=>item.slug!==story.slug).map(item=>[item.slug,item]));
  const ranked = [...others.values()].map(item=>{
    const compare = profile(item);
    if (base.sportsDesk!==compare.sportsDesk || (base.sport && compare.sport && base.sport!==compare.sport)) return {item,score:0};
    const names = shared(base.names,compare.names).filter(term=>base.title.has(term) || compare.title.has(term));
    const topics = shared(base.subjects,compare.subjects);
    const locations = shared(base.places,compare.places);
    const headlines = shared(base.title,compare.title);
    const significant = shared(base.all,compare.all);
    const sameSport = Boolean(base.sport && base.sport===compare.sport);
    // A specific subject (including a competition) or discipline is sufficient.
    // Otherwise require multiple independent words to identify the same event or named entity.
    const corroborated = headlines.length>=2 || (headlines.length>=1 && significant.length>=3 && (names.length>0 || locations.length>0)) ||
      (names.length>=2 && significant.length>=3);
    const sharedPlaceInBothTitles = locations.length>0 && shared(base.titleNames,compare.titleNames).some(word=>geographicWords.has(word));
    const localDossier = sharedPlaceInBothTitles && significant.length>=2 && significant.some(word=>!base.names.has(word) || !compare.names.has(word));
    const credible = topics.length>0 || sameSport || corroborated || localDossier;
    const score = credible ? 10*names.length + 9*topics.length + 4*headlines.length + 3*locations.length +
      Math.min(significant.length,6) + (sameSport ? 3 : 0) : 0;
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
