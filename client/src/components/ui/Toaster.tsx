import { cva } from 'class-variance-authority';
import { CheckCircle, Info, TriangleAlert, OctagonAlert, type LucideProps } from 'lucide-react';

import { useToast } from '@/hooks/useToast';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/Toast';

type TVariant = 'default' | 'success' | 'warning' | 'info' | 'error' | 'destructive' | null | undefined;

const getIcon = (variant: TVariant): React.ComponentType<LucideProps> => {
  switch (variant) {
    case 'success':
      return CheckCircle;
    case 'warning':
      return TriangleAlert;
    case 'error':
    case 'destructive':
      return OctagonAlert;
    case 'info':
    case 'default':
    default:
      return Info;
  }
};

const iconVariants = cva('size-6', {
  variants: {
    variant: {
      default: 'text-slate-500 ',
      success: 'success text-green-500',
      warning: 'warning text-amber-500',
      info: 'info text-blue-500',
      error: 'error text-red-500',
      destructive: 'destructive  text-red-500',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon = getIcon(variant);
        return (
          <Toast key={id} variant={variant} {...props}>
            <Icon className={iconVariants({ variant })} />
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
