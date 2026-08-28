import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useRegister } from '@api/hooks/default/useRegister';
import type { RegisterUserRequest } from '@api/types';
import { apiBaseUrl } from '@configs/api';
import { useAuth } from '@features/auth/providers/AuthProvider';

export function useRegisterPage() {
  const navigate = useNavigate();
  const { token, account } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const registerMutation = useRegister({ client: { baseURL: apiBaseUrl, auth: token } });
  const defaultValues = useMemo<RegisterUserRequest>(
    () => ({
      displayName: account?.username ?? '',
      email: account?.username ?? '',
    }),
    [account?.username],
  );

  const submit = async (values: RegisterUserRequest) => {
    setError(null);
    try {
      await registerMutation.mutateAsync({
        body: {
          displayName: values.displayName.trim(),
          email: values.email?.trim() || undefined,
        },
      });
      navigate('/tasks');
    } catch {
      setError('Unable to register the local profile.');
    }
  };

  return {
    token,
    defaultValues,
    error,
    isSaving: registerMutation.isPending,
    submit,
  };
}
