'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

/**
 * Three-state theme toggle: light / system / dark.
 * Renders nothing on first server render to avoid hydration mismatch.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="h-9 w-[110px] rounded-full bg-muted/50" aria-hidden />
    );
  }

  const opts = [
    { v: 'light', icon: Sun, label: 'สว่าง' },
    { v: 'system', icon: Monitor, label: 'อัตโนมัติ' },
    { v: 'dark', icon: Moon, label: 'มืด' },
  ] as const;

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-0.5 shadow-sm"
      role="radiogroup"
      aria-label="เปลี่ยนโหมดสี"
    >
      {opts.map((o) => {
        const Icon = o.icon;
        const active = theme === o.v;
        return (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            onClick={() => setTheme(o.v)}
            className={`flex h-7 w-8 items-center justify-center rounded-full transition-colors ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compact two-state version (icon only) — for mobile bottom nav,
 * customer portal, anywhere space is tight.
 */
export function ThemeToggleCompact() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-9 rounded-full bg-muted/50" aria-hidden />;
  }

  const isDark = resolvedTheme === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
