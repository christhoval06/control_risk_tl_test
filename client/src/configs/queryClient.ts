import { QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from '@hooks/useToast';
import { normalizeClientError } from '@utils/errorHandler';

export function handleQueryError(error: unknown) {
  const clientError = normalizeClientError(error);

  toast({
    title: clientError.isAuthError ? 'Session required' : 'Request failed',
    description: clientError.message,
    variant: clientError.isAuthError ? 'warning' : 'error',
  });
}

export function createAppQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: handleQueryError,
    }),
  });
}
