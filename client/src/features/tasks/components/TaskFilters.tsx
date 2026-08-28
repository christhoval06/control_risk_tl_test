import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import type { TaskQuery, TaskStatus } from '@features/tasks/types';
import { memo, useCallback, type ChangeEvent } from 'react';

interface Props {
  query: TaskQuery;
  onChange: (query: TaskQuery) => void;
}

const statuses: TaskStatus[] = ['Pending', 'In Progress', 'Done'];

function TaskFiltersComponent({ query, onChange }: Props) {
  const changeSearch = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, search: event.target.value });
  }, [onChange, query]);
  const changeStatus = useCallback((status: string) => {
    onChange({ ...query, status: status === 'all' ? '' : status as TaskStatus });
  }, [onChange, query]);
  const changeSort = useCallback((sortBy: string) => {
    onChange({ ...query, sortBy });
  }, [onChange, query]);
  const toggleSortDirection = useCallback(() => {
    onChange({ ...query, sortDirection: query.sortDirection === 'desc' ? 'asc' : 'desc' });
  }, [onChange, query]);

  return (
    <div className="grid gap-3 border-y border-slate-200 bg-slate-50/70 py-3 md:grid-cols-[minmax(0,1fr)_170px_170px_96px] md:items-end">
      <div>
        <Label htmlFor="search">Search</Label>
        <Input id="search" placeholder="Search tasks, owners, or controls" value={query.search ?? ''}
          onChange={changeSearch} />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={query.status || 'all'}
          onValueChange={changeStatus}>
          <SelectTrigger id="status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="sort">Sort</Label>
        <Select value={query.sortBy ?? 'dueDate'}
          onValueChange={changeSort}>
          <SelectTrigger id="sort"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="dueDate">Due date</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="createdAt">Created</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" onClick={toggleSortDirection}>
        {query.sortDirection === 'desc' ? 'Desc' : 'Asc'}
      </Button>
    </div>
  );
}

export const TaskFilters = memo(TaskFiltersComponent);
