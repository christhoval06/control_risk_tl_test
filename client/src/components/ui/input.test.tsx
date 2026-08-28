import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';

describe('form controls', () => {
  it('renders an accessible input with merged state classes', () => {
    render(<Input aria-label="Title" className="border-red-500" />);

    const input = screen.getByRole('textbox', { name: 'Title' });
    expect(input).toHaveClass('border-red-500');
    expect(input).not.toHaveClass('border-slate-300');
  });

  it('renders label and textarea primitives', () => {
    render(
      <>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" />
      </>
    );

    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });
});
