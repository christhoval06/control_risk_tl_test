import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins conditional class names and resolves Tailwind conflicts', () => {
    expect(cn('px-2 text-sm', false && 'hidden', ['px-4', 'font-semibold'])).toBe('text-sm px-4 font-semibold');
  });
});
