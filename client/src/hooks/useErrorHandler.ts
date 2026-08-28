import { useCallback } from 'react';
import { useToast } from '@hooks/useToast';
import { normalizeClientError } from '@utils/errorHandler';

interface ErrorHandlerOptions {
  fallbackMessage?: string;
  setError?: (message: string) => void;
  title?: string;
}

export function useErrorHandler() {
  const { toast } = useToast();

  return useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      const clientError = normalizeClientError(error, options.fallbackMessage);

      options.setError?.(clientError.message);
      toast({
        title: options.title ?? (clientError.isAuthError ? 'Session required' : 'Request failed'),
        description: clientError.message,
        variant: clientError.isAuthError ? 'warning' : 'error',
      });

      return clientError;
    },
    [toast],
  );
}
