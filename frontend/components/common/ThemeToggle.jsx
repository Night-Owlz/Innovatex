'use client';

import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-xl hover:bg-gray-800/50 dark:hover:bg-gray-800/50 light:hover:bg-gray-200 transition-colors group"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        {/* Sun - Visible in light mode */}
        <Sun 
          className={`absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-700 ease-in-out ${
            isDark 
              ? 'rotate-90 scale-0 opacity-0' 
              : 'rotate-0 scale-100 opacity-100'
          } group-hover:rotate-45`}
        />
        
        {/* Moon - Visible in dark mode */}
        <Moon 
          className={`absolute inset-0 w-5 h-5 text-teal-400 transition-all duration-700 ease-in-out ${
            isDark 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          } group-hover:-rotate-45`}
        />
      </div>
    </Button>
  );
}
