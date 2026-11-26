'use client';
import {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {Cloud, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, CloudHail, Moon, Sun, Thermometer, Wind} from 'lucide-react';
import {isWeatherCity, parseWeather, weatherCities, weatherDataUrl, weatherMaxAge, weatherRefresh, type Sky, type WeatherCity, type WeatherReading} from '../lib/weather';
import './weather-nav.css';

const icons = {sun:Sun,moon:Moon,partSun:CloudSun,partMoon:CloudMoon,cloud:Cloud,rain:CloudRain,snow:CloudSnow,sleet:CloudHail,fog:CloudFog,storm:CloudLightning,wind:Wind,unknown:Thermometer};
const languageCodes = ['fr','en','es','ar','zh','ru','ko'];
const copy = {
  weather:['Météo','Weather','Tiempo','الطقس','天气','Погода','날씨'],
  city:['Ville','City','Ciudad','المدينة','城市','Город','도시'],
  observed:['Relevé','Observed','Observación','وقت الرصد','观测时间','Наблюдение','관측 시각'],
  pending:['Chargement…','Loading…','Cargando…','جارٍ التحميل…','加载中…','Загрузка…','불러오는 중…'],
  unavailable:['Relevé indisponible','Observation unavailable','Observación no disponible','الرصد غير متاح','暂无观测数据','Нет данных наблюдений','관측 정보 없음'],
  late:['Mise à jour en attente','Awaiting an update','Actualización pendiente','بانتظار التحديث','等待更新','Ожидается обновление','업데이트 대기 중'],
  source:['Données','Data','Datos','البيانات','数据','Данные','자료'],
  licence:['Licence','Licence','Licencia','الترخيص','许可','Лицензия','이용 조건'],
};
const skyLabels: Record<Sky,string[]> = {
  sun:['Ensoleillé','Sunny','Soleado','مشمس','晴','Солнечно','맑음'],
  moon:['Dégagé','Clear','Despejado','صافٍ','晴','Ясно','맑음'],
  partSun:['Partiellement ensoleillé','Partly sunny','Parcialmente soleado','مشمس جزئياً','晴间多云','Переменная облачность','구름 조금'],
  partMoon:['Partiellement dégagé','Partly clear','Parcialmente despejado','صافٍ جزئياً','少云','Переменная облачность','구름 조금'],
  cloud:['Nuageux','Cloudy','Nublado','غائم','多云','Облачно','흐림'],
  rain:['Pluie','Rain','Lluvia','مطر','雨','Дождь','비'],
  snow:['Neige','Snow','Nieve','ثلوج','雪','Снег','눈'],
  sleet:['Précipitations glacées ou mixtes','Icy or mixed precipitation','Precipitación helada o mixta','هطول متجمد أو مختلط','冰冻或混合降水','Смешанные или ледяные осадки','어는 비·혼합 강수'],
  fog:['Visibilité réduite','Reduced visibility','Visibilidad reducida','رؤية منخفضة','能见度低','Пониженная видимость','시정 나쁨'],
  storm:['Orage','Thunderstorm','Tormenta','عاصفة رعدية','雷暴','Гроза','뇌우'],
  wind:['Vent','Windy','Ventoso','رياح','有风','Ветрено','바람'],
  unknown:['Relevé météo','Weather observation','Observación meteorológica','رصد جوي','天气观测','Метеонаблюдение','기상 관측'],
};

const preferenceKey = 'byrvox-weather-city';
let sessionCity:WeatherCity = 'ottawa';
function currentCity():WeatherCity {
  try {
    const saved = localStorage.getItem(preferenceKey);
    if (saved && isWeatherCity(saved)) return saved;
  } catch {}
  return sessionCity;
}
function subscribeCity(refresh:()=>void) {
  window.addEventListener('storage',refresh); window.addEventListener(preferenceKey,refresh);
  return ()=>{window.removeEventListener('storage',refresh);window.removeEventListener(preferenceKey,refresh);};
}
function chooseCity(city: string) {
  if (!isWeatherCity(city)) return;
  sessionCity=city;
  try {localStorage.setItem(preferenceKey,city);} catch {}
  window.dispatchEvent(new Event(preferenceKey));
}

export function WeatherNav({locale='fr'}:{locale?:string}) {
  const language = Math.max(0,languageCodes.indexOf(locale.split('-')[0]));
  const city = useSyncExternalStore(subscribeCity,currentCity,()=>'ottawa' as const);
  const [result,setResult] = useState<{city:WeatherCity;reading:WeatherReading|null;checked:number} | null>(null);
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(()=>{
    const controller = new AbortController();
    async function refresh() {
      if (document.hidden) return;
      try {
        const reading = await fetch('/api/weather?city='+city, {signal:controller.signal});
        let value:WeatherReading|null;
        if (reading.ok) {
          value = await reading.json();
        } else {
          const direct = await fetch(weatherDataUrl(city), {
            signal:AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]),
            credentials:'omit', referrerPolicy:'no-referrer'
          });
          value = direct.ok ? parseWeather(city,await direct.json()) : null;
        }
        if (!value) throw Error('Observation unavailable');
        const checked=Date.now();
        if (!controller.signal.aborted) setResult({city,checked,reading:value.city===city && checked-Date.parse(value.observed)<weatherMaxAge ? value : null});
      } catch {
        const checked=Date.now();
        if (!controller.signal.aborted) setResult(old=>({city,checked,reading:old?.city===city && old.reading && checked-Date.parse(old.reading.observed)<weatherMaxAge ? old.reading : null}));
      }
    }
    void refresh();
    const timer = window.setInterval(refresh,weatherRefresh);
    document.addEventListener('visibilitychange',refresh);
    return ()=>{controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};
  },[city]);
  useEffect(()=>{
    const close = (e:PointerEvent)=>{if (details.current?.open && !details.current.contains(e.target as Node)) details.current.open=false;};
    document.addEventListener('pointerdown',close);
    return ()=>document.removeEventListener('pointerdown',close);
  },[]);
  const loading = result?.city!==city;
  const active = !loading ? result.reading : null;
  const Icon = active ? icons[active.sky] : Thermometer;
  const name = weatherCities[city].name;
  const degrees = active ? new Intl.NumberFormat(locale,{style:'unit',unit:'celsius',maximumFractionDigits:0}).format(active.celsius) : '—';
  const condition = active && ((language===0 ? active.fr : language===1 ? active.en : '') || skyLabels[active.sky][language]);
  const page = weatherDataUrl(city);
  return <details className="weather-nav" ref={details} onKeyDown={e=>{
    if(e.key==='Escape' && details.current?.open){details.current.open=false;details.current.querySelector('summary')?.focus();}
  }}>
    <summary aria-label={[copy.weather[language],name, degrees,condition].filter(Boolean).join(' · ')} title={[name,degrees,condition].filter(Boolean).join(' · ')}>
      <Icon size={20} aria-hidden="true"/><span>{degrees}</span><span className="weather-nav-place">{name}</span>
    </summary>
    <div className="weather-nav-panel">
      <label><span>{copy.city[language]}</span>
        <select value={city} onChange={e=>chooseCity(e.target.value)}>
          {Object.entries(weatherCities).map(([key,c])=><option key={key} value={key}>{c.name}</option>)}
        </select>
      </label>
      <div aria-live="polite">{active ? <>
        <strong><Icon size={21} aria-hidden="true"/>{degrees} · {condition}</strong>
        <p>{copy.observed[language]} · <time dateTime={active.observed}>{new Intl.DateTimeFormat(locale,{timeZone:weatherCities[city].tz,dateStyle:'short',timeStyle:'short'}).format(new Date(active.observed))}</time></p>
        {result && result.checked-Date.parse(active.observed)>90*60_000 && <p>{copy.late[language]}</p>}
      </>: <p>{loading ? copy.pending[language] : copy.unavailable[language]}</p>}</div>
      <small>{copy.source[language]} · <a href={page}>{language===0?'Environnement et Changement climatique Canada':'Environment and Climate Change Canada'}</a> · <a href={'https://eccc-msc.github.io/open-data/licence/readme_'+(language===0?'fr':'en')+'/'}>{copy.licence[language]}</a></small>
    </div>
  </details>;
}
