import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins conditional class names and resolves Tailwind conflicts', () => {
    const hiddenClass = undefined;

    expect(cn('px-2 text-sm', hiddenClass, ['px-4', 'font-semibold'])).toBe('text-sm px-4 font-semibold');
  });
});
