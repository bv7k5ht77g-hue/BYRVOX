'use client';
import { Moon, Sun } from 'lucide-react';

export function PortalThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('byrvox-theme', next); } catch { /* The theme still applies to this page. */ }
  }
  return <button type="button" className="portal-theme-toggle" onClick={toggle}>
    <span className="portal-theme-light"><Sun size={19} aria-hidden="true"/><span className="edition-sr-only">Activer le thème clair</span></span>
    <span className="portal-theme-dark"><Moon size={19} aria-hidden="true"/><span className="edition-sr-only">Activer le thème sombre</span></span>
  </button>;
}
