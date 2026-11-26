'use client';

import { Moon, Sun } from 'lucide-react';
import type { PublicLocale } from '../../lib/i18n';
import { navText } from './navigation-copy';

export function ThemeToggle({locale}: {locale: PublicLocale}) {
  function toggleTheme() {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('byrvox-theme', next); } catch { /* Applies for this page. */ }
  }

  return <button type="button" className="tool-icon" onClick={toggleTheme}>
    <span className="theme-sun"><Sun size={19} aria-hidden="true" /><span className="edition-sr-only">{navText(locale,'light')}</span></span>
    <span className="theme-moon"><Moon size={19} aria-hidden="true" /><span className="edition-sr-only">{navText(locale,'dark')}</span></span>
  </button>;
}
