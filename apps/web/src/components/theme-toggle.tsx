'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';
import { Button } from './ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-muted/50"
        aria-label="Toggle theme"
        disabled
      >
        <span className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-muted/50 hover:bg-muted text-foreground/70 hover:text-foreground transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-3 w-3 sm:h-4 sm:w-4" />
      ) : (
        <Sun className="h-3 w-3 sm:h-4 sm:w-4" />
      )}
    </Button>
  );
}
