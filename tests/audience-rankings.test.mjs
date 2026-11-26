import assert from 'node:assert/strict';
import test from 'node:test';
import { articleAwards, rankedArticles } from '../lib/audience-rankings.ts';

const score = (slug, kind, week, month = week, year = month) => ({slug, kind, week, month, year});

test('an alphabetical tie orders the list without awarding either article the lead', () => {
  const rows = [score('kyoto', 'read', 1), score('ottawa', 'read', 1)];
  assert.deepEqual(rankedArticles(rows, 'read', 'week').map(row => row.slug), ['kyoto', 'ottawa']);
  for (const {slug} of rows) assert.deepEqual(articleAwards(rows, slug), []);
});

test('one reading award per story, with independent view and engagement leaders', () => {
  const rows = [score('kyoto', 'read', 2), score('ottawa', 'read', 1),
    score('kyoto', 'view', 4), score('ottawa', 'engage', 1)];
  assert.deepEqual(articleAwards(rows, 'kyoto'), ['view', 'week']);
  assert.deepEqual(articleAwards(rows, 'ottawa'), ['engage']);
});

test('month and year leaders remain eligible independently of the weekly award', () => {
  const rows = [score('a', 'read', 0, 3, 3), score('b', 'read', 0, 1, 5)];
  assert.deepEqual(articleAwards(rows, 'a'), ['month']);
  assert.deepEqual(articleAwards(rows, 'b'), ['year']);
  assert.deepEqual(articleAwards([], 'a'), []);
});
