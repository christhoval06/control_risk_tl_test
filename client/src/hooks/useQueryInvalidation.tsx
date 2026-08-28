import { useQueryClient, type QueryKey } from '@tanstack/react-query';

export function useQueryInvalidation<T extends QueryKey = QueryKey>() {
  const queryClient = useQueryClient();

  return async (queryKeys: Array<T>, refetchQueries: boolean = true) => {
    await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    if (refetchQueries) {
      await Promise.all(queryKeys.map((queryKey) => queryClient.refetchQueries({ queryKey, type: 'all' })));
    }
  };
}
