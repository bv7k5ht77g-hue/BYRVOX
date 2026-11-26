import {Globe,Landmark,Trophy,FlaskConical,Orbit,Leaf,ChartColumn,Users,Palette,Cpu,MapPin,HeartPulse,Newspaper} from 'lucide-react';
import type {CSSProperties} from 'react';
const groups=[
 {names:['Sports','Soccer','Basketball','LNH','Football américain','Tennis'],icon:Trophy,color:'#df9358'},
 {names:['Politique','Élections'],icon:Landmark,color:'#bd86dd'},
 {names:['International','Monde'],icon:Globe,color:'#639de2'},
 {names:['Canada','Québec','Caraïbes','Haïti'],icon:MapPin,color:'#db777a'},
 {names:['Sciences'],icon:FlaskConical,color:'#59b7ba'},{names:['Espace'],icon:Orbit,color:'#a591dc'},
 {names:['Environnement'],icon:Leaf,color:'#75ab77'},{names:['Économie'],icon:ChartColumn,color:'#c0a051'},
 {names:['Société'],icon:Users,color:'#b38d74'},{names:['Culture'],icon:Palette,color:'#d97da6'},
 {names:['Technologie'],icon:Cpu,color:'#76a7bf'},{names:['Santé'],icon:HeartPulse,color:'#76b09d'}];
export function Mark({category,label}:{category:string;label:string}){
 const {icon:Icon,color}=groups.find(g=>g.names.includes(category))||{icon:Newspaper,color:'#91959f'};
 return <span className="by-mark" style={{'--desk-color':color} as CSSProperties}><Icon size={16} aria-hidden="true"/>{label}</span>
}
