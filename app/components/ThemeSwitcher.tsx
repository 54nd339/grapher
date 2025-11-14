'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'indigo' | 'violet' | 'emerald' | 'rose' | 'amber' | 'cyan';

const colorSchemes: ColorScheme[] = ['indigo', 'violet', 'emerald', 'rose', 'amber', 'cyan'];

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (typeof window !== 'undefined' ? ((localStorage.getItem('ui-theme') as Theme) || 'system') : 'system'));
  const [scheme, setScheme] = useState<ColorScheme>(() => (typeof window !== 'undefined' ? ((localStorage.getItem('ui-color-scheme') as ColorScheme) || 'indigo') : 'indigo'));

  const applyTheme = (t: Theme, s: ColorScheme) => {
    const root = document.documentElement;
    // theme
    const effectiveDark = t === 'dark' || (t === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = effectiveDark ? 'dark' : 'light';
    // Ensure Tailwind dark: variants apply
    if (effectiveDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // color scheme
    root.dataset.colorScheme = s;
  };

  useEffect(() => {
    applyTheme(theme, scheme);
  }, [theme, scheme]);

  const updateTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('ui-theme', t);
    applyTheme(t, scheme);
  };

  const updateScheme = (s: ColorScheme) => {
    setScheme(s);
    localStorage.setItem('ui-color-scheme', s);
    applyTheme(theme, s);
  };

  // Close popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#theme-switcher')) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <div id="theme-switcher" className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Theme & colors"
        aria-label="Theme and color settings"
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        {/* palette icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-700 dark:text-gray-300">
          <path d="M12 2C6.477 2 2 6.03 2 10.75 2 13.65 3.77 16.2 6.5 17.8c.41.24.66.69.62 1.16-.06.73.2 1.49.82 2.11.92.92 2.41 1.07 3.5.36 1.02-.66 1.57-1.7 1.57-2.73 0-.88.72-1.6 1.6-1.6h.84C18.85 17.1 22 14.2 22 10.75 22 6.03 17.523 2 12 2Zm-4 7.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm4-1.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm4 1.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm-2 3.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-3 z-50">
          <div className="px-1 py-2">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Theme</div>
            <div className="flex gap-2">
              {(['light','dark','system'] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => updateTheme(t)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                    theme === t
                      ? 'border-gray-800 dark:border-gray-200 text-gray-900 dark:text-white'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="px-1 py-2">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Color scheme</div>
            <div className="grid grid-cols-6 gap-2">
              {colorSchemes.map((c) => (
                <button
                  key={c}
                  onClick={() => updateScheme(c)}
                  title={c}
                  aria-label={c}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-105 ${scheme === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600' : ''}`}
                  style={{
                    borderColor: 'transparent',
                    background: `linear-gradient(135deg, var(--${c}-1, var(--accent-1)), var(--${c}-2, var(--accent-2)))`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
