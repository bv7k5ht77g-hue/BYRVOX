'use client';
import {useAudience} from './audience';
import { articleAwards, rankedArticles } from '../../lib/audience-rankings';
import {localizedHref,publicLocales,type PublicLocale} from '../../lib/i18n';
const labels=[
 ['Les plus vus','Most viewed','Más vistos','الأكثر مشاهدة','浏览最多','Больше всего просмотров','최다 조회'],
 ['Les plus lus','Most read','Más leídos','الأكثر قراءة','阅读最多','Самые читаемые','최다 열독'],
 ['Les plus engageants','Most interacted with','Más interacciones','الأكثر تفاعلاً','互动最多','Больше всего взаимодействий','최다 참여'],
 ['Champion de la semaine','Weekly leader','Líder semanal','متصدر الأسبوع','本周榜首','Лидер недели','주간 1위'],
 ['Champion du mois','Monthly leader','Líder mensual','متصدر الشهر','本月榜首','Лидер месяца','월간 1위'],
 ['Champion de l’année','Yearly leader','Líder anual','متصدر السنة','年度榜首','Лидер года','연간 1위']
];
const awardLabels = {read:labels[1], view:labels[0], engage:labels[2], week:labels[3], month:labels[4], year:labels[5]};
export function leaderLabel(label: keyof typeof awardLabels, lang: PublicLocale) {
  return awardLabels[label][publicLocales.indexOf(lang)];
}
export function Rankings({lang}:{lang:PublicLocale}){
 const rows=useAudience();const i=publicLocales.indexOf(lang);
 return <div className="by-ranking-grid">{['view','read','engage'].map((kind,k)=>{
 const list=rankedArticles(rows,kind,'week').slice(0,5);return list.length>0&&<section key={kind}><h2>{labels[k][i]}</h2><ol>{list.map(r=><li key={r.slug}><a href={localizedHref('/article/'+r.slug,lang)}>{r.titles?.[lang]||r.title}</a></li>)}</ol></section>})}</div>
}
export function Awards({slug,lang}:{slug:string;lang:PublicLocale}){
 const rows=useAudience();const i=publicLocales.indexOf(lang);
 const badges=articleAwards(rows,slug);
 return badges.length?<div className="by-awards">{badges.map(b=><small key={b}>{awardLabels[b][i]}</small>)}</div>:null
}
