'use client';

import * as React from 'react';
import { Moon, Sun, Laptop } from '@/lib/lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder or nothing to avoid hydration mismatch
    return <div className="w-8 h-8" />;
  }

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const currentThemeLabel =
    theme === 'system' ? 'Sistema' : theme === 'light' ? 'Chiaro' : 'Scuro';
  const nextThemeLabel =
    theme === 'system' ? 'Chiaro' : theme === 'light' ? 'Scuro' : 'Sistema';

  const getIcon = () => {
    if (theme === 'light') return <Sun className="w-4 h-4" />;
    if (theme === 'dark') return <Moon className="w-4 h-4" />;
    return <Laptop className="w-4 h-4" />; // System
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="p-2 rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-all motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      aria-label={`Tema attuale: ${currentThemeLabel}. Passa a ${nextThemeLabel}.`}
      title={`Tema attuale: ${currentThemeLabel}. Passa a ${nextThemeLabel}.`}
    >
      {getIcon()}
    </button>
  );
}
