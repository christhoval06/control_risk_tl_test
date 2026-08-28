import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@utils/cn';

export const textareaVariants = cva(
  'flex min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/20 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-slate-300 focus-visible:border-mint',
        invalid: 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface TextareaProps extends ComponentProps<'textarea'>, VariantProps<typeof textareaVariants> {}

export function Textarea({ className, variant, ...props }: TextareaProps) {
  return <textarea className={cn(textareaVariants({ variant }), className)} {...props} />;
}
