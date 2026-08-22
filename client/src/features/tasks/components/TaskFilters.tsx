import type { TaskQuery, TaskStatus } from '@features/tasks/types';

interface Props {
  query: TaskQuery;
  onChange: (query: TaskQuery) => void;
}

const statuses: Array<TaskStatus | ''> = ['', 'Pending', 'In Progress', 'Done'];

export function TaskFilters({ query, onChange }: Props) {
  return (
    <div className="task-panel">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_170px_170px_96px] md:items-end">
        <div>
          <label className="form-label" htmlFor="search">Search</label>
          <input id="search" className="form-field" value={query.search ?? ''}
            onChange={(event) => onChange({ ...query, search: event.target.value })} />
        </div>
        <div>
          <label className="form-label" htmlFor="status">Status</label>
          <select id="status" className="form-field" value={query.status ?? ''}
            onChange={(event) => onChange({ ...query, status: event.target.value as TaskStatus | '' })}>
            {statuses.map((status) => <option key={status || 'all'} value={status}>{status || 'All'}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="sort">Sort</label>
          <select id="sort" className="form-field" value={query.sortBy ?? 'dueDate'}
            onChange={(event) => onChange({ ...query, sortBy: event.target.value })}>
            <option value="dueDate">Due date</option>
            <option value="status">Status</option>
            <option value="createdAt">Created</option>
          </select>
        </div>
        <button className="rounded-md border border-slate-950 px-3 py-2 text-sm font-semibold"
          onClick={() => onChange({ ...query, sortDirection: query.sortDirection === 'desc' ? 'asc' : 'desc' })}>
          {query.sortDirection === 'desc' ? 'Desc' : 'Asc'}
        </button>
      </div>
    </div>
  );
}
