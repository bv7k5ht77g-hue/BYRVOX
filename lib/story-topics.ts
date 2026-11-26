type ArticleTopic = {category:string;title:string;summary:string};
type Sport = 'Soccer'|'LNH';

export const sportKeywords: Record<Sport,readonly string[]> = {
  Soccer: ['soccer','football','uefa','fifa','ligue des champions','ligue 1','premier league','liga','serie a','coupe du monde de football','mls','cf montréal','psg','paris saint-germain','villarreal','fc barcelone','bayern','losc','as roma','real madrid','liverpool','manchester united','slavia prague','borussia','champions league','buchanan','dembele','mbappe','messi'],
  LNH: ['lnh','nhl','ligue nationale de hockey','coupe stanley','canadien de montréal','canadiens de montréal','avalanche du colorado','oilers','maple leafs','sénateurs d’ottawa','golden knights','canucks','flames de calgary','bruins','red wings','penguins','capitals de washington','sabres de buffalo','blackhawks','devils du new jersey','hurricanes de la caroline','mcdavid','makar','eichel','caufield','suzuki','crosby'],
};

export function topicWords(value:string) {
  return value.toLocaleLowerCase('fr').normalize('NFD').replace(/\p{M}/gu,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
// The source copy is French. Place names alone identify a province on the national desk.
// On another beat, require an explicitly geographic reference to avoid tagging namesakes.
export const albertaNationalTerms = ['Alberta', 'Edmonton', 'Calgary', 'Fort McMurray', 'Wainwright'];
export const albertaRegionalTerms = ['en Alberta', 'l’Alberta',
  'albertain', 'albertaine', 'albertains', 'albertaines'];

export function articleRegion(story:ArticleTopic):'Alberta' | null {
  const desk = topicWords(story.category);
  if (desk === 'alberta' || /^alberta[ \u00a0\u202f]*:/iu.test(story.title.trim())) return 'Alberta';
  const text = ' ' + topicWords(story.title + ' ' + story.summary) + ' ';
  const hasPhrase = (term:string) => text.includes(' ' + topicWords(term) + ' ');
  return albertaRegionalTerms.some(hasPhrase) || (desk === 'canada' && albertaNationalTerms.some(hasPhrase))
    ? 'Alberta' : null;
}

export function publicStoryCategory(story:ArticleTopic) {
  return topicWords(story.category) === 'canada' ? articleRegion(story) ?? story.category : story.category;
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
