import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TaskFilters } from './TaskFilters';

describe('TaskFilters', () => {
  it('updates status and sort through ui select controls', async () => {
    const onChange = vi.fn();

    render(<TaskFilters query={{ sortBy: 'dueDate', sortDirection: 'asc' }} onChange={onChange} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Status' }));
    await userEvent.click(screen.getByRole('option', { name: 'Done' }));
    await userEvent.click(screen.getByRole('combobox', { name: 'Sort' }));
    await userEvent.click(screen.getByRole('option', { name: 'Created' }));

    expect(onChange).toHaveBeenCalledWith({ sortBy: 'dueDate', sortDirection: 'asc', status: 'Done' });
    expect(onChange).toHaveBeenCalledWith({ sortBy: 'createdAt', sortDirection: 'asc' });
  });
});
