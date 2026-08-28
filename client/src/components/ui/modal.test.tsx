import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './modal';

describe('Modal', () => {
  it('renders open modal content through a portal', () => {
    render(
      <Modal isOpen title="Create task" onClose={vi.fn()}>
        <p>Task form</p>
      </Modal>,
    );

    expect(screen.getByRole('dialog', { name: 'Create task' })).toBeInTheDocument();
    expect(screen.getByText('Task form')).toBeInTheDocument();
  });

  it('closes from escape and backdrop interactions', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen title="Create task" onClose={onClose}>
        <p>Task form</p>
      </Modal>,
    );

    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByTestId('modal-backdrop'));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
