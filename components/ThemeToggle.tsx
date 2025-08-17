"use client";
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { IconButton } from './ui';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Only render after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <IconButton
        className="w-9 h-9 rounded-lg"
        aria-label="Toggle theme"
      >
        <span className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </IconButton>
    );
  }

  return (
    <IconButton
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <svg
          className="w-5 h-5 text-yellow-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 text-gray-700 dark:text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </IconButton>
  );
}