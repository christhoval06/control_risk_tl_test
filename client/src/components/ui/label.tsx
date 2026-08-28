import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@utils/cn';

export const labelVariants = cva('block text-sm font-semibold text-slate-700 dark:text-slate-300', {
  variants: {
    spacing: {
      default: 'mb-2',
      none: '',
    },
  },
  defaultVariants: {
    spacing: 'default',
  },
});

export interface LabelProps extends ComponentProps<'label'>, VariantProps<typeof labelVariants> {}

export function Label({ className, spacing, ...props }: LabelProps) {
  return <label className={cn(labelVariants({ spacing }), className)} {...props} />;
}
