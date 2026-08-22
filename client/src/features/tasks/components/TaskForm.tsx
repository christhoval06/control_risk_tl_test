import { useForm } from 'react-hook-form';
import type { CreateTaskInput } from '@features/tasks/types';

interface Props {
  isSaving: boolean;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
}

export function TaskForm({ isSaving, onSubmit }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateTaskInput>({
    defaultValues: { title: '', description: '', dueDate: '', assignedTo: '' }
  });

  async function submit(input: CreateTaskInput) {
    await onSubmit(input);
    reset();
  }

  return (
    <form className="task-panel" onSubmit={handleSubmit(submit)}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-950">New task</h2>
        <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isSaving} type="submit">
          {isSaving ? 'Saving' : 'Create'}
        </button>
      </div>
      <label className="form-label" htmlFor="title">Title</label>
      <input id="title" className={`form-field ${errors.title ? 'border-red-500' : ''}`}
        {...register('title', { required: 'Title is required.' })} />
      {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
      <label className="form-label mt-4" htmlFor="description">Description</label>
      <textarea id="description" className="form-field min-h-24" {...register('description')} />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="form-label" htmlFor="dueDate">Due date</label>
          <input id="dueDate" type="datetime-local" className="form-field" {...register('dueDate')} />
        </div>
        <div>
          <label className="form-label" htmlFor="assignedTo">Assigned to</label>
          <input id="assignedTo" className="form-field" {...register('assignedTo')} />
        </div>
      </div>
    </form>
  );
}
