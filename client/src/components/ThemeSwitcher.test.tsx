import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeSwitcher } from './ThemeSwitcher';

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    const storage = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        clear: () => storage.clear(),
        getItem: (key: string) => storage.get(key) ?? null,
        removeItem: (key: string) => storage.delete(key),
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
  });

  it('toggles dark mode on the document and persists the preference', async () => {
    render(<ThemeSwitcher />);

    const toggle = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(document.documentElement).not.toHaveClass('dark');

    await userEvent.click(toggle);

    expect(document.documentElement).toHaveClass('dark');
    expect(window.localStorage.getItem('task-management-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /switch to light mode/i }));

    expect(document.documentElement).not.toHaveClass('dark');
    expect(window.localStorage.getItem('task-management-theme')).toBe('light');
  });
});
