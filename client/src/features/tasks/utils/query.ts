import type { NormalizedTaskQuery, TaskQuery, TaskStatus } from '@features/tasks/types';

const allowedSortFields = ['dueDate', 'status', 'createdAt'] as const;
const allowedStatuses: TaskStatus[] = ['Pending', 'In Progress', 'Done'];

export function normalizeTaskQuery(query: TaskQuery): NormalizedTaskQuery {
  const sortBy = allowedSortFields.includes(query.sortBy as NormalizedTaskQuery['sortBy'])
    ? (query.sortBy as NormalizedTaskQuery['sortBy'])
    : 'dueDate';

  return stripUndefined({
    status: allowedStatuses.includes(query.status as TaskStatus) ? (query.status as TaskStatus) : undefined,
    assignedTo: cleanText(query.assignedTo),
    search: cleanText(query.search),
    sortBy,
    sortDirection: query.sortDirection === 'desc' ? 'desc' : 'asc',
    page: Math.max(1, query.page ?? 1),
    pageSize: Math.min(100, Math.max(1, query.pageSize ?? 20)),
  });
}

function cleanText(value?: string): string | undefined {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function stripUndefined(query: NormalizedTaskQuery): NormalizedTaskQuery {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined)) as NormalizedTaskQuery;
}
