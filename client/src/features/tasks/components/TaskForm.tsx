import { useForm } from 'react-hook-form';
import { Button, Input, Label, Textarea } from '@components/ui';
import type { CreateTaskInput } from '@features/tasks/types';

interface Props {
  isSaving: boolean;
  onCancel?: () => void;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
}

export function TaskForm({ isSaving, onCancel, onSubmit }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateTaskInput>({
    defaultValues: { title: '', description: '', dueDate: '', assignedTo: '' }
  });

  async function submit(input: CreateTaskInput) {
    await onSubmit(input);
    reset();
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(submit)}>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" variant={errors.title ? 'invalid' : 'default'}
          {...register('title', { required: 'Title is required.' })} />
      </div>
      {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" type="datetime-local" {...register('dueDate')} />
        </div>
        <div>
          <Label htmlFor="assignedTo">Assigned to</Label>
          <Input id="assignedTo" {...register('assignedTo')} />
        </div>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        {onCancel && <Button onClick={onCancel} variant="outline">Cancel</Button>}
        <Button disabled={isSaving} type="submit">{isSaving ? 'Saving' : 'Create'}</Button>
      </div>
    </form>
  );
}
