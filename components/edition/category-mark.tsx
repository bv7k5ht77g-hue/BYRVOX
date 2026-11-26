import type { CSSProperties, ComponentPropsWithoutRef } from 'react';
import {
  ChartColumn, Cpu, FlaskConical, Globe, HeartPulse, Landmark, Leaf, MapPin, Megaphone,
  Newspaper, Orbit, Palette, PenLine, Plane, Trophy, Users, Zap,
} from 'lucide-react';

const desks = [
  { names: ['International', 'Monde'], icon: Globe, color: '#275aa2' },
  { names: ['Sports', 'Soccer', 'Basketball', 'LNH', 'Football américain', 'Tennis'], icon: Trophy, color: '#a24610' },
  { names: ['Culture'], icon: Palette, color: '#a32c63' },
  { names: ['Technologie', 'Technologies'], icon: Cpu, color: '#12657f' },
  { names: ['Espace'], icon: Orbit, color: '#67419c' },
  { names: ['Canada', 'Québec', 'Ontario'], icon: MapPin, color: '#aa303c' },
  { names: ['Économie'], icon: ChartColumn, color: '#805c04' },
  { names: ['Politique', 'Élections'], icon: Landmark, color: '#713e87' },
  { names: ['Sciences'], icon: FlaskConical, color: '#00675e' },
  { names: ['Environnement'], icon: Leaf, color: '#326832' },
  { names: ['Société'], icon: Users, color: '#79503c' },
  { names: ['Santé'], icon: HeartPulse, color: '#146751' },
  { names: ['Caraïbes', 'Haïti', 'États-Unis'], icon: MapPin, color: '#795036' },
  { names: ['Énergie'], icon: Zap, color: '#86520b' },
  { names: ['Transports'], icon: Plane, color: '#3f597d' },
  { names: ['Éditorial', 'LA RÉDACTION'], icon: PenLine, color: '#713751' },
  { names: ['Article sponsorisé'], icon: Megaphone, color: '#4e5860' },
];
const fallback = { icon: Newspaper, color: '#505e6e' };

type CategoryProps = { category: string; label: string };
function appearance({ category, label }: CategoryProps) {
  const { icon: Icon, color } = desks.find(desk => desk.names.includes(category)) || fallback;
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
