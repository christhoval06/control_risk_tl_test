import { Moon, Sun } from 'lucide-react';
import { Button } from '@components/ui';
import { useTheme } from '@hooks/useTheme';

export function ThemeSwitcher() {
  const { isDark, toggleTheme } = useTheme();
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <div className="fixed right-4 top-4 z-50">
      <Button
        aria-label={label}
        className="h-11 w-11 rounded-full border-slate-200/80 bg-white/90 text-slate-700 shadow-lg backdrop-blur hover:bg-white dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-800"
        onClick={toggleTheme}
        size="icon"
        title={label}
        variant="outline"
      >
        <Icon aria-hidden="true" className="h-5 w-5" />
      </Button>
    </div>
  );
}
