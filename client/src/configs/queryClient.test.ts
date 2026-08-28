import { describe, expect, it, vi } from 'vitest';
import { handleQueryError } from './queryClient';

const toast = vi.hoisted(() => vi.fn());

vi.mock('@hooks/useToast', () => ({
  toast,
}));

describe('handleQueryError', () => {
  it('notifies with the normalized API error message', () => {
    handleQueryError({
      status: 401,
      data: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication is required.',
      },
    });

    expect(toast).toHaveBeenCalledWith({
      title: 'Session required',
      description: 'Authentication is required.',
      variant: 'warning',
    });
  });
});
