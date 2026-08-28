import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@utils/cn';

export const inputVariants = cva(
  'flex w-full rounded-md border bg-white px-3 text-sm text-slate-950 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/20 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-slate-300 focus-visible:border-mint',
        invalid: 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20'
      },
      controlSize: {
        default: 'h-10 py-2',
        sm: 'h-8 py-1 text-xs',
        lg: 'h-11 py-2'
      }
    },
    defaultVariants: {
      variant: 'default',
      controlSize: 'default'
    }
  }
);

export interface InputProps extends ComponentProps<'input'>, VariantProps<typeof inputVariants> {}

export function Input({ className, controlSize, variant, ...props }: InputProps) {
  return <input className={cn(inputVariants({ controlSize, variant }), className)} {...props} />;
}
