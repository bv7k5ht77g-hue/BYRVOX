import type { CSSProperties, ComponentPropsWithoutRef } from 'react';
import { canonicalCategory, parentDesk } from '../../lib/editorial-sections';
import { countryRegion } from '../../lib/regional-coverage';
import {
  BriefcaseBusiness, Building2, ChartColumn, Cpu, Earth, Flag, FlaskConical, Globe, GraduationCap,
  HeartPulse, Landmark, LayoutGrid, Leaf, Map as MapIcon, MapPin, Megaphone, Newspaper, Orbit, Palette,
  PenLine, Scale, TrainFront, TreePalm, Trophy, Users, Vote, Zap, createLucideIcon,
} from 'lucide-react';

const Hockey = createLucideIcon('Hockey', [
  ['path', { d: 'm19 3-5.5 13.5a3 3 0 0 1-2.8 1.9H4a1.8 1.8 0 0 1 0-3.6h6.8L16 3', key: 'stick' }],
  ['ellipse', { cx: '18.4', cy: '20', rx: '2.8', ry: '1.2', fill: 'currentColor', key: 'puck' }],
]);
const Basketball = createLucideIcon('Basketball', [
  ['circle', { cx: '12', cy: '12', r: '9', key: 'ball' }],
  ['path', { d: 'M3 12h18M12 3v18M6 5.3c4 3.5 4 10 0 13.4m12-13.4c-4 3.5-4 10 0 13.4', key: 'seams' }],
]);
const Soccer = createLucideIcon('Soccer', [
  ['circle', { cx: '12', cy: '12', r: '9', key: 'ball' }],
  ['path', { d: 'm12 8 4 3-1.5 5h-5L8 11Zm0 0V3m4 8 4.7-1.4m-6.2 6.4 2.8 3.3m-7.8-3.3-2.8 3.3M8 11 3.3 9.6', key: 'panels' }],
]);
const Football = createLucideIcon('AmericanFootball', [
  ['path', { d: 'M3 20C1.8 9 9.3 1.8 21 3c1.3 11.3-6 18.7-18 17Zm5-13 9 9M12 9l3 3m-1-5 3 3', key: 'ball' }],
]);
const Tennis = createLucideIcon('Tennis', [
  ['circle', { cx: '12', cy: '12', r: '9', key: 'ball' }],
  ['path', { d: 'M8 4a8 8 0 0 1-4 10m16-4a8 8 0 0 0-4 10', key: 'seams' }],
]);

const desks = [
  { names: ['International', 'Monde'], icon: Globe, color: '#275aa2' },
  { names: ['Sports'], icon: Trophy, color: '#a24610' },
  { names: ['Soccer', 'Football'], icon: Soccer, color: '#396820' },
  { names: ['Basketball', 'Basket-ball', 'NBA'], icon: Basketball, color: '#9b4618' },
  { names: ['Hockey', 'Hockey sur glace', 'LNH', 'NHL'], icon: Hockey, color: '#246184' },
  { names: ['Football américain', 'NFL'], icon: Football, color: '#84432b' },
  { names: ['Tennis'], icon: Tennis, color: '#5f6817' },
  { names: ['Culture'], icon: Palette, color: '#a32c63' },
  { names: ['Technologie', 'Technologies'], icon: Cpu, color: '#12657f' },
  { names: ['Espace'], icon: Orbit, color: '#67419c' },
  { names: ['Canada', 'Québec', 'Ontario'], icon: MapPin, color: '#aa303c' },
  { names: ['Économie'], icon: ChartColumn, color: '#805c04' },
  { names: ['Politique'], icon: Landmark, color: '#713e87' },
  { names: ['Élections'], icon: Vote, color: '#65497f' },
  { names: ['Logement', 'Immobilier'], icon: Building2, color: '#865132' },
  { names: ['Justice', 'Justice internationale'], icon: Scale, color: '#58468a' },
  { names: ['Entreprises', 'Entreprise'], icon: BriefcaseBusiness, color: '#315e78' },
  { names: ['Europe'], icon: Earth, color: '#26448c' },
  { names: ['Éducation'], icon: GraduationCap, color: '#675187' },
  { names: ['Sciences'], icon: FlaskConical, color: '#00675e' },
  { names: ['Environnement'], icon: Leaf, color: '#326832' },
  { names: ['Société'], icon: Users, color: '#79503c' },
  { names: ['Santé'], icon: HeartPulse, color: '#146751' },
  { names: ['Caraïbes', 'Antilles'], icon: TreePalm, color: '#00685e' },
  { names: ['Amérique latine'], icon: Earth, color: '#516c2c' },
  { names: ['Haïti'], icon: MapIcon, color: '#74512d' },
  { names: ['États-Unis'], icon: Flag, color: '#714657' },
  { names: [''], icon: LayoutGrid, color: '#465166' },
  { names: ['Énergie'], icon: Zap, color: '#86520b' },
  { names: ['Transports'], icon: TrainFront, color: '#3f597d' },
  { names: ['Éditorial', 'LA RÉDACTION'], icon: PenLine, color: '#713751' },
  { names: ['Article sponsorisé'], icon: Megaphone, color: '#4e5860' },
];
const fallback = { icon: Newspaper, color: '#505e6e' };

type CategoryProps = { category: string; label: string };
const categoryKey = (name: string) => name.trim().normalize('NFC').toLocaleLowerCase('fr');
const byName = new Map(desks.flatMap(desk => desk.names.map(name => [categoryKey(name), desk] as const)));

function categoryAppearance(category: string) {
  const name = canonicalCategory(category);
  const region = countryRegion(name);
  return byName.get(categoryKey(name)) || (region ? byName.get(categoryKey(region)) : undefined)
    || byName.get(categoryKey(parentDesk(name))) || fallback;
}

export function categoryColor(category: string) {
  return categoryAppearance(category).color;
}

function appearance({ category, label }: CategoryProps) {
  const { icon: Icon, color } = categoryAppearance(category);
  return {
    className: 'by-mark',
    style: { '--desk-color': color } as CSSProperties,
    children: <><Icon size={16} aria-hidden="true"/>{label}</>,
  };
}

export function Mark(props: CategoryProps) {
  return <span {...appearance(props)}/>;
}

export function CategoryLink({ category, label, ...props }: CategoryProps & ComponentPropsWithoutRef<'a'>) {
  return <a {...props} {...appearance({ category, label })}/>;
}

export function CategoryButton({ category, label, ...props }: CategoryProps & ComponentPropsWithoutRef<'button'>) {
  return <button type="button" {...props} {...appearance({ category, label })}/>;
}
