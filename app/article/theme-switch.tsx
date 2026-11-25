"use client";

import { Moon, Sun } from "lucide-react";

export default function ReaderThemeSwitch() {
  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("byrvox-theme", next); } catch { /* Keep the theme for this page. */ }
  }

  return (
    <button type="button" className="reader-theme" onClick={toggle}>
      <span className="reader-sun"><Sun size={20} aria-hidden="true" /><span className="reader-visually-hidden">Activer le thème clair</span></span>
      <span className="reader-moon"><Moon size={20} aria-hidden="true" /><span className="reader-visually-hidden">Activer le thème sombre</span></span>
    </button>
  );
}
