import { Modal } from '@components/ui';
import type { CreateTaskInput } from '@features/tasks/types';
import { TaskForm } from './TaskForm';

interface TaskCreateModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
}

export function TaskCreateModal({ isOpen, isSaving, onClose, onSubmit }: TaskCreateModalProps) {
  async function submit(input: CreateTaskInput) {
    await onSubmit(input);
    onClose();
  }

  return (
    <Modal
      description="Create a task with owner, due date, and risk-control context."
      isOpen={isOpen}
      onClose={onClose}
      title="New task"
    >
      <TaskForm isSaving={isSaving} onCancel={onClose} onSubmit={submit} />
    </Modal>
  );
}
