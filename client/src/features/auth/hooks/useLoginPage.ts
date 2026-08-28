import { useState } from 'react';
import { useNavigate } from 'react-router';
import { login as completeApiLogin } from '@api/client/default/login';
import { apiBaseUrl } from '@configs/api';
import { useAuth } from '@features/auth/providers/AuthProvider';
import { getAuthErrorMessage } from '@features/auth/utils/authError';

export function useLoginPage() {
  const navigate = useNavigate();
  const { isMsalReady, login } = useAuth();
  const [startedBrokerLogin, setStartedBrokerLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startLogin = async () => {
    setError(null);
    setStartedBrokerLogin(true);
    try {
      const accessToken = await login();
      await completeApiLogin({
        baseURL: apiBaseUrl,
        auth: accessToken,
        throwOnError: true,
      });
      navigate('/tasks');
    } catch (err) {
      console.error(err);
      setStartedBrokerLogin(false);
      setError(getAuthErrorMessage(err));
    }
  };

  return {
    error,
    isReady: isMsalReady,
    isBusy: startedBrokerLogin,
    startLogin,
  };
}
