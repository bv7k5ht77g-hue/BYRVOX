import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, mkdtemp, rm, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const brands = {
  byrvox: { name: 'BYRVOX', origin: 'https://byrvox.today', color: '0x172533', feed: '/api/articles' },
  buzzeur: { name: 'BUZZEUR', origin: 'https://buzzeur.byrvox.today', color: '0x31233C', feed: null },
};
export const version = '1.0.0-alpha.1';
const clean = (value) => typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '';
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function makePlan(brand, article) {
  const config = brands[brand];
  if (!config || !article || (article.status && article.status !== 'published')) throw new Error('Article non publié ou marque inconnue');
  const slug = clean(article.slug), title = clean(article.title), summary = clean(article.summary);
  const publishedAt = Date.parse(article.publishedAt);
  if (!/^[\p{L}\p{N}-]{1,240}$/u.test(slug) || !title || !summary || !Number.isFinite(publishedAt)) throw new Error('Article incomplet');
  const url = new URL('/article/' + encodeURIComponent(slug), config.origin).href;
  const photo = article.photo && !article.photoHidden ? {
    url: clean(article.photo.url), credit: clean(article.photo.credit),
    caption: clean(article.photo.caption), license: clean(article.photo.license),
    licenseUrl: clean(article.photo.licenseUrl), sourceUrl: clean(article.photo.sourceUrl),
  } : null;
  const revision = hash([brand, slug, title, summary, photo, article.updatedAt || '']);
  // No invented claims, extrapolation or generated event imagery. This is a draft, not a fact check.
  return { version, id: revision, brand, slug, url, title, summary, publishedAt: new Date(publishedAt).toISOString(),
    status: 'review_required', locale: 'fr', format: { width:1080, height:1920, fps:30 },
    photo, visualPolicy: 'text_only_until_audiovisual_rights_confirmed',
    scenes: [
      { text: title, kind:'headline' },
      ...summary.match(/[^.!?]+[.!?]*|[.!?]+/gu).map(clean).filter(Boolean).map(text=>({text,kind:'context'})),
      { text: 'Lire l’article complet sur ' + new URL(config.origin).hostname + '.', kind:'outro' },
    ],
    distribution: ['instagram','tiktok','youtube','facebook','x'].map(platform=>({platform,status:'not_connected'})),
  };
}
export function selectPlans(brand, articles, { limit = 4, now = Date.now(), maxAgeHours = 24 } = {}) {
  if (!Array.isArray(articles)) throw new Error('Le flux doit renvoyer un tableau');
  if (!Number.isInteger(limit) || limit < 1 || limit > 24) throw new Error('Limite invalide');
  const seen = new Set(), plans = [];
  for (const article of [...articles].sort((a,b)=>Date.parse(b?.publishedAt)-Date.parse(a?.publishedAt))) {
    try {
      const plan = makePlan(brand,article), age = now - Date.parse(plan.publishedAt);
      if (age < 0 || age > maxAgeHours*3600000 || seen.has(plan.slug)) continue;
      seen.add(plan.slug); plans.push(plan);
      if (plans.length >= limit) break;
    } catch { /* Invalid entries are not eligible. */ }
  }
  return plans;
}
export async function scan(brand, directory, { limit=4, feedPath, fetcher=fetch }={}) {
  const config = brands[brand];
  if (!config) throw new Error('Marque inconnue');
  const endpoint = feedPath || config.feed;
  if (!endpoint || !/^\/[a-zA-Z0-9/_-]+$/.test(endpoint)) throw new Error('Flux JSON de la marque à confirmer');
  const res = await fetcher(new URL(endpoint,config.origin),{redirect:'error',signal:AbortSignal.timeout(20000)});
  if (!res.ok) throw new Error('Flux HTTP ' + res.status);
  const plans = selectPlans(brand,await res.json(),{limit});
  await mkdir(directory,{recursive:true});
  let created = 0;
  for (const plan of plans) {
    try { await writeFile(join(directory,plan.id+'.json'),JSON.stringify(plan,null,2)+'\n',{flag:'wx'}); created++; }
    catch(e) { if (e.code!=='EEXIST') throw e; }
  }
  return {brand,eligible:plans.length,created};
}
function command(bin,args,cwd) {
  const r=spawnSync(bin,args,{cwd,encoding:'utf8',maxBuffer:4*1024*1024,timeout:300000});
  if(r.error || r.status!==0) throw new Error(bin+' : '+(r.error?.message || r.stderr?.slice(-1600) || r.status));
  return r.stdout;
}
function wrap(text,max=24) {
  const lines=[]; let line='';
  for(const word of text.split(/\s+/u)) {
    for(const chunk of word.match(new RegExp('.{1,'+max+'}','gu')) || []) {
      if(line && (line+' '+chunk).length>max){lines.push(line);line='';}
      line += (line?' ':'')+chunk;
    }
  }
  if(line)lines.push(line);
  return lines;
}
export async function render(plan, output, { approved=false, font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf' }={}) {
  if(!approved) throw new Error('Validation éditoriale explicite requise');
  const config=brands[plan.brand];
  if(!config || plan.version!==version || plan.locale!=='fr' || !Array.isArray(plan.scenes) || plan.scenes.length<2 || plan.scenes.length>40) throw new Error('Plan invalide');
  // Alpha intentionally uses only branded typography. No downloaded images, music, or third-party voices.
  const dir=await mkdtemp(join(tmpdir(),'byrvox-media-'));
  try {
    await writeFile(join(dir,'brand.txt'),config.name);
    await writeFile(join(dir,'footer.txt'),new URL(config.origin).hostname+' | Voix de synthèse');
    await stat(font);
    const safeFont=resolve(font);
    if(!/^\/[a-zA-Z0-9_./-]+$/.test(safeFont)) throw new Error('Chemin police invalide');
    let index=0;
    for(const scene of plan.scenes) {
      const lines=wrap(clean(scene.text));
      while(lines.length) {
        const page=lines.splice(0,5).join('\n');
        await writeFile(join(dir,'caption.txt'),page);
        command('espeak-ng',['-v','fr','-s','155','-f','caption.txt','-w','voice.wav'],dir);
        const duration=Number(command('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1','voice.wav'],dir).trim());
        if(!Number.isFinite(duration)||duration<=0) throw new Error('Durée audio invalide');
        const filter=[
          'drawtext=fontfile='+safeFont+':textfile=brand.txt:expansion=none:fontsize=64:fontcolor=white:x=(w-tw)/2:y=150',
          'drawtext=fontfile='+safeFont+':textfile=caption.txt:expansion=none:fontsize=60:line_spacing=24:fontcolor=white:x=(w-tw)/2:y=(h-th)/2',
          'drawtext=fontfile='+safeFont+':textfile=footer.txt:expansion=none:fontsize=32:fontcolor=white:x=(w-tw)/2:y=h-240',
        ].join(',');
        command('ffmpeg',['-nostdin','-hide_banner','-loglevel','error','-y','-f','lavfi','-i','color=c='+config.color+':s=1080x1920:r=30','-i','voice.wav','-vf',filter,'-af','apad','-t',String(duration+0.4),'-c:v','libx264','-preset','fast','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-ac','2','-movflags','+faststart','part'+index+'.mp4'],dir);
        index++;
      }
    }
    if(!index) throw new Error('Aucune scène');
    await writeFile(join(dir,'parts.txt'),Array.from({length:index},(_,i)=>"file 'part"+i+".mp4'").join('\n'));
    await mkdir(resolve(output,'..'),{recursive:true});
    command('ffmpeg',['-nostdin','-hide_banner','-loglevel','error','-n','-f','concat','-safe','1','-i','parts.txt','-c','copy','-movflags','+faststart',resolve(output)],dir);
    return {output:resolve(output),scenes:index,status:'rendered_local'};
  } finally { await rm(dir,{recursive:true,force:true}); }
}
async function main() {
  const [action,first,second,...flags]=process.argv.slice(2);
  if(action==='scan' && first && second) console.log(await scan(first,second,{feedPath:flags.find(x=>x.startsWith('--feed='))?.slice(7)}));
  else if(action==='render' && first && second) console.log(await render(JSON.parse(await readFile(first,'utf8')),second,{approved:flags.includes('--approved')}));
  else throw new Error('Usage: scan <byrvox|buzzeur> <queue> [--feed=/api/articles] ou render <plan.json> <video.mp4> --approved');
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) main().catch(e=>{console.error(e.message);process.exitCode=1;});
