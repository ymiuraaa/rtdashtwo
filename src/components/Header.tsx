'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="w-full px-6 py-4 flex justify-between items-center border-b border-zinc-800 bg-background-light dark:bg-background-dark">
      <nav className="flex gap-6 items-center text-sm font-medium">
        <Link href="/calibration" className="hover:text-primary">Calibration</Link>
        <Link href="/" className="hover:text-primary">Telemetry</Link>
        <Link href="https://github.com/ymiuraaa/RT-DashTwo" className="hover:text-primary">Source Code</Link>
      </nav>
      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 hover:bg-zinc-700 rounded transition"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      )}
    </header>
  );
}
