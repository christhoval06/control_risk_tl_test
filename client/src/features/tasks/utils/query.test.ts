import { describe, expect, it } from 'vitest';
import { normalizeTaskQuery } from './query';

describe('normalizeTaskQuery', () => {
  it('removes empty filters and clamps paging before the API call', () => {
    const query = normalizeTaskQuery({
      status: '',
      assignedTo: '  ',
      search: ' invoice ',
      sortBy: 'unknown',
      sortDirection: 'sideways',
      page: 0,
      pageSize: 500
    });

    expect(query).toEqual({
      search: 'invoice',
      sortBy: 'dueDate',
      sortDirection: 'asc',
      page: 1,
      pageSize: 100
    });
  });
});
