import { describe, expect, it } from 'vitest';
import { normalizeClientError } from './errorHandler';

describe('normalizeClientError', () => {
  it('uses the API error envelope message and marks auth failures', () => {
    const result = normalizeClientError({
      status: 401,
      data: {
        code: 'AUTH_REQUIRED',
        status: 'error',
        message: 'Authentication is required.',
        data: null,
      },
    });

    expect(result).toEqual({
      code: 'AUTH_REQUIRED',
      isAuthError: true,
      message: 'Authentication is required.',
      statusCode: 401,
    });
  });

  it('uses Axios response data before falling back to a generic error message', () => {
    expect(
      normalizeClientError({
        response: {
          status: 404,
          data: { message: 'Task was not found.', code: 'TASK_NOT_FOUND' },
        },
      }),
    ).toMatchObject({
      code: 'TASK_NOT_FOUND',
      message: 'Task was not found.',
      statusCode: 404,
    });

    expect(normalizeClientError(new Error('Network Error')).message).toBe('Network Error');
    expect(normalizeClientError(null, 'Unable to complete request.').message).toBe('Unable to complete request.');
  });
});
