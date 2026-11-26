type ArticleTopic = {category:string;title:string;summary:string};
type Sport = 'Soccer'|'LNH';

export const sportKeywords: Record<Sport,readonly string[]> = {
  Soccer: ['soccer','football','uefa','fifa','ligue des champions','ligue 1','premier league','liga','serie a','coupe du monde de football','mls','cf montréal','psg','paris saint-germain','villarreal','fc barcelone','bayern','losc','as roma','real madrid','liverpool','manchester united','slavia prague','borussia','champions league','buchanan','dembele','mbappe','messi'],
  LNH: ['lnh','nhl','ligue nationale de hockey','coupe stanley','canadien de montréal','canadiens de montréal','avalanche du colorado','oilers','maple leafs','sénateurs d’ottawa','golden knights','canucks','flames de calgary','bruins','red wings','penguins','capitals de washington','sabres de buffalo','blackhawks','devils du new jersey','hurricanes de la caroline','mcdavid','makar','eichel','caufield','suzuki','crosby'],
};

export function topicWords(value:string) {
  return value.toLocaleLowerCase('fr').normalize('NFD').replace(/\p{M}/gu,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
const sportPhrases = Object.fromEntries(Object.entries(sportKeywords).map(([sport,words])=>[sport,words.map(topicWords)])) as Record<Sport,string[]>;
export function sportCategory(story:ArticleTopic):Sport|null {
  const category = topicWords(story.category);
  if (category==='soccer' || category==='football') return 'Soccer';
  if (category==='lnh' || category==='nhl') return 'LNH';
  if (!['sports','sport','hockey','hockey sur glace'].includes(category)) return null;
  const text=' '+topicWords(story.title+' '+story.summary)+' ';
  if (/\b(football americain|football canadien|nfl|super bowl|lcf|grey cup|coupe grey)\b/.test(text)) return null;
  for (const sport of ['LNH','Soccer'] as const) {
    if (sportPhrases[sport].some(marker=>text.includes(' '+marker+' '))) return sport;
  }
  return null;
}
