import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TaskForm } from './TaskForm';

describe('TaskForm', () => {
  it('shows a validation error when title is missing', async () => {
    const onSubmit = vi.fn();
    render(<TaskForm isSaving={false} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /create/i }));

    expect(await screen.findByText('Title is required.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
