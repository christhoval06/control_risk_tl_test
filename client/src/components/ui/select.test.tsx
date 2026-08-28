import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';

describe('Select', () => {
  it('renders options and forwards changes', async () => {
    const onChange = vi.fn();

    render(
      <Select onValueChange={onChange} value="Pending">
        <SelectTrigger aria-label="Status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="Pending">Pending</SelectItem>
          <SelectItem value="Done">Done</SelectItem>
        </SelectContent>
      </Select>,
    );

    await userEvent.click(screen.getByRole('combobox', { name: 'Status' }));
    await userEvent.click(screen.getByRole('option', { name: 'Done' }));

    expect(onChange).toHaveBeenCalledWith('Done');
  });
});
