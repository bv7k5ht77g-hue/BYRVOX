import { sql, type SQL } from 'drizzle-orm';
import { topicWords } from './story-topics';

// SQLite lower() folds ASCII only. Keep these literals in the statement so a
// multiword search stays below D1's bind-parameter limit.
const latinGroups: Record<string,string> = {
  a:'àáâäãåÀÁÂÄÃÅ', c:'çÇ', e:'èéêëÈÉÊË', i:'ìíîïÌÍÎÏ',
  n:'ñÑ', o:'òóôöõÒÓÔÖÕ', u:'ùúûüÙÚÛÜ', y:'ÿýŸÝ', oe:'œŒ', ae:'æÆ',
};
const quote = (value:string) => sql.raw("'" + value.replaceAll("'","''") + "'");

const substitutions = [
  ...Object.entries(latinGroups).flatMap(([plain,chars])=>Array.from(chars,ch=>[ch,plain])),
  ...Array.from(".,!?;:/()[]{}«»“”'’‐‑–—-_\n\r\t").map(ch=>[ch,' ']),
  ['  ',' '],['  ',' '],['  ',' '],
];

export function normalizedSearchSql(input: SQL): SQL {
  // D1 limits the expression tree to 100 levels, including the enclosing
  // search/filter query. Fold in short batches, with one pass per batch.
  const chunks = [];
  for (let i=0; i<substitutions.length; i+=18) {
    const replace = substitutions.slice(i,i+18).reduce((text,[from,to])=>
      sql`replace(${text},${quote(from)},${quote(to)})`,sql`folding.value`);
    chunks.push(sql`WHEN ${sql.raw(String(chunks.length))} THEN ${replace}`);
  }
  const count = sql.raw(String(chunks.length));
  return sql`(WITH RECURSIVE folding(step,value) AS (SELECT 0,lower(${input}) UNION ALL
    SELECT step+1,CASE step ${sql.join(chunks,sql` `)} END FROM folding WHERE step<${count})
    SELECT value FROM folding WHERE step=${count})`;
}

export function hasSearchPhrase(input:SQL,phrases:readonly string[]):SQL {
  const needles = JSON.stringify(phrases.map(phrase=>' '+topicWords(phrase)+' '));
  // Materialize one folded string per article; test as many literal needles as needed.
  return sql`(WITH folded(value) AS MATERIALIZED (SELECT ' ' || ${normalizedSearchSql(input)} || ' ')
    SELECT EXISTS(SELECT 1 FROM folded, json_each(${needles}) AS terms WHERE instr(folded.value,terms.value)>0))`;
}

export function containsSearchTerms(input:SQL,words:readonly string[]):SQL|undefined {
  if (!words.length) return undefined;
  const needles = JSON.stringify(words.map(word=>topicWords(word) || word.toLowerCase()));
  return sql`(WITH folded(value) AS MATERIALIZED (SELECT ${normalizedSearchSql(input)})
    SELECT NOT EXISTS(SELECT 1 FROM folded, json_each(${needles}) AS terms WHERE instr(folded.value,terms.value)=0))`;
}
