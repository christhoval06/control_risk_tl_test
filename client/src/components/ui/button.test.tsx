import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders a default button with merged variant classes', () => {
    render(<Button className="px-8">Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('bg-slate-950');
    expect(button).toHaveClass('px-8');
    expect(button).not.toHaveClass('px-4');
  });

  it('supports semantic variants and sizes', () => {
    render(
      <Button size="sm" variant="destructive">
        Delete
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveClass('bg-red-600');
    expect(button).toHaveClass('h-8');
  });
});
