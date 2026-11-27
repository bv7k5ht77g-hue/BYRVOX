'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LogIn, Star } from 'lucide-react';
import { discussionText } from '../../lib/discussion-copy';
import { ratingChangedKey } from '../../lib/editorial-sections';
import { localizedHref, type PublicLocale } from '../../lib/i18n';
import { readerAccountUrl } from '../../lib/reader-links';
import './discussion.css';

type Comment = {id:string; body:string; createdAt:string; authorName:string};
type Ratings = {average:number|null; count:number; mine:number|null};
type Discussion = {comments:Comment[]; ratings:Ratings; canRate:boolean; canParticipate:boolean; hasMore:boolean};
type Words = Parameters<typeof discussionText>[1];

function Rating({ratings, active, locale, saving, notice, onRate}:{
  ratings:Ratings; active:boolean; locale:PublicLocale; saving:boolean; notice:Words|null; onRate:(score:number)=>void;
}) {
  const t = (key: Words) => discussionText(locale,key);
  const numbers = new Intl.NumberFormat(locale,{maximumFractionDigits:1});
  const outOfFive = (score:number) => t('outOfFive').replace('{value}',numbers.format(score));
  return <section className="discussion-rating" aria-labelledby="article-rating-title">
    <h3 id="article-rating-title">{t('rate')}</h3>
    {ratings.count && ratings.average !== null ? <div className="discussion-score">
      <span>{t('average')} · <b>{outOfFive(ratings.average)}</b></span>
      <span>{t('votes')} · {numbers.format(ratings.count)}</span>
    </div> : <p className="discussion-empty">{t('noRatings')}</p>}
    {!active && <div className="discussion-readonly-stars" aria-hidden="true">
      {[1,2,3,4,5].map(score => <Star key={score} size={21}
        fill={score <= Math.round(ratings.average ?? 0) ? 'currentColor' : 'none'}/>)}
    </div>}
    {active && <fieldset className="discussion-stars" disabled={saving}>
      <legend>{t('yourRating')}{ratings.mine ? ' · '+outOfFive(ratings.mine) : ''}</legend>
      {[1,2,3,4,5].map(score => <button key={score} type="button" aria-label={outOfFive(score)}
        aria-pressed={score === ratings.mine} data-on={score <= (ratings.mine ?? 0)}
        onClick={() => onRate(score)}><Star aria-hidden="true" size={24}/></button>)}
    </fieldset>}
    {notice && <p className="discussion-notice" role="status">{t(notice)}</p>}
  </section>;
}

export function ArticleDiscussion({slug,locale}: {slug:string;locale:PublicLocale}) {
  const t = (key:Words) => discussionText(locale,key);
  const endpoint = '/api/article-feedback/' + encodeURIComponent(slug);
  const returnTo = localizedHref('/article/' + encodeURIComponent(slug) + '#discussion', locale);
  const [data,setData] = useState<Discussion|null>(null);
  const [revision,reload] = useState(0);
  const [loadError,setLoadError] = useState(false);
  const [busy,setBusy] = useState<'rating'|'comment'|'more'|null>(null);
  const [draft,setDraft] = useState('');
  const attempt = useRef<{digest:string; requestId:string} | null>(null);
  const attemptKey = 'byrvox-comment-attempt:' + slug;
  const [ratingNotice,setRatingNotice] = useState<Words|null>(null);
  const [commentNotice,setCommentNotice] = useState<Words|null>(null);
  const [page,setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    setLoadError(false);
    async function read() {
      const response = await fetch(endpoint,{cache:'no-store',signal:controller.signal});
      if (!response.ok) throw new Error();
      const next:Discussion = await response.json();
      if (!controller.signal.aborted) setData(next);
    }
    read().catch(() => {if (!controller.signal.aborted) setLoadError(true);});
    return () => controller.abort();
  },[endpoint,revision]);

  async function commentRequestId(body:string) {
    const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body));
    const digest = Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
    if (attempt.current?.digest === digest) return attempt.current.requestId;
    try {
      const previous = JSON.parse(sessionStorage.getItem(attemptKey) || 'null');
      if (previous?.digest === digest && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(previous.requestId)) {
        attempt.current = {digest,requestId:previous.requestId};
        return previous.requestId as string;
      }
    } catch { /* The in-memory attempt remains available for retries. */ }
    const requestId = crypto.randomUUID();
    attempt.current = {digest,requestId};
    try {sessionStorage.setItem(attemptKey,JSON.stringify(attempt.current));} catch {}
    return requestId;
  }

  async function more() {
    if (busy || !data?.hasMore) return;
    setBusy('more');
    setCommentNotice(null);
    try {
      const response = await fetch(endpoint+'?page='+(page+1),{cache:'no-store'});
      if (!response.ok) throw new Error();
      const next:Discussion = await response.json();
      setData(previous => {
        if (!previous) return next;
        const known = new Set(previous.comments.map(comment=>comment.id));
        return {...previous,comments:[...previous.comments,...next.comments.filter(comment=>!known.has(comment.id))],hasMore:next.hasMore};
      });
      setPage(page+1);
    } catch { setCommentNotice('loadError'); }
    finally { setBusy(null); }
  }

  async function write(kind:'comment'|'rating', score?:number) {
    if (busy || !data || (kind === 'rating' && !data.canRate) || (kind === 'comment' && (!data.canParticipate || !draft.trim()))) return;
    setBusy(kind);
    const notify = kind === 'comment' ? setCommentNotice : setRatingNotice;
    notify(null);
    try {
      const comment = draft.trim();
      const body = kind === 'rating' ? {kind,score} : {kind,body:comment,requestId:await commentRequestId(comment)};
      const response = await fetch(endpoint,{method:'POST',cache:'no-store',
        headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      if (response.status === 401 && kind === 'comment') {setData({...data,canParticipate:false}); return;}
      if (response.status === 428 && kind === 'rating') {notify('ratingCookieRequired'); reload(value=>value+1); return;}
      if (response.status === 403) {notify('restricted'); return;}
      if (response.status === 429) {notify('rateLimit'); return;}
      if (!response.ok) throw new Error();
      if (kind === 'rating') {
        const {ratings} = await response.json() as {ratings:Ratings};
        setData(previous => previous && {...previous,ratings});
        try {localStorage.setItem(ratingChangedKey,String(Date.now()));} catch { /* Storage can be unavailable in private browsing. */ }
        notify('rated');
      } else {
        attempt.current = null;
        try {sessionStorage.removeItem(attemptKey);} catch {}
        setDraft('');
        notify('pending');
      }
      window.dispatchEvent(new CustomEvent('byrvox:article-engagement',{detail:slug}));
    } catch { notify('saveError'); }
    finally { setBusy(null); }
  }

  function sendComment(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void write('comment');
  }
  const date = new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short',timeZone:'America/Toronto'});

  return <section id="discussion" className="article-discussion" aria-labelledby="reader-feedback-title">
    <h2 id="reader-feedback-title">{t('heading')}</h2>
    {loadError && <><p className="discussion-notice" role="status">{t('loadError')}</p>
      <button type="button" className="discussion-more" onClick={()=>reload(value=>value+1)}>{t('retry')}</button></>}
    {!data && !loadError && <p className="discussion-notice" role="status">{t('loading')}</p>}
    {data && <>
      {!data.canParticipate && <p className="discussion-help">{t('guestRating')}</p>}
      <Rating ratings={data.ratings} active={data.canRate} locale={locale} saving={busy !== null}
        notice={ratingNotice} onRate={score=>void write('rating',score)}/>
      <section className="discussion-comments" aria-labelledby="article-comments-title">
        <h3 id="article-comments-title">{t('comments')}</h3>
        <p className="discussion-help" id="discussion-policy">{t('moderation')}</p>
        {data.canParticipate ? <form className="discussion-form" onSubmit={sendComment}>
          <label htmlFor="discussion-comment">{t('write')}</label>
          <textarea id="discussion-comment" aria-describedby="discussion-policy" value={draft} dir="auto" required
            maxLength={1500} disabled={busy==='comment'} onChange={event=>setDraft(event.target.value)}/>
          <button type="submit" disabled={busy!==null || !draft.trim()}>{t('submit')}</button>
        </form> : <a className="discussion-login" href={readerAccountUrl('connexion',returnTo,locale)}>
          <LogIn size={16} aria-hidden="true"/>{t('signIn')}</a>}
        {commentNotice && <p className="discussion-notice" role="status">{t(commentNotice)}</p>}
        {data.comments.length ? <ol className="discussion-list">{data.comments.map(comment=><li key={comment.id}>
          <div className="discussion-author"><strong dir="auto">{comment.authorName || t('reader')}</strong>
            <time dateTime={comment.createdAt}>{date.format(new Date(comment.createdAt))}</time></div>
          <p dir="auto">{comment.body}</p>
        </li>)}</ol> : <p className="discussion-empty">{t('noComments')}</p>}
        {data.hasMore && <button type="button" className="discussion-more" disabled={busy!==null} onClick={more}>{t('more')}</button>}
      </section>
    </>}
  </section>;
}
