import { AuthShell } from '@features/auth/components/AuthShell';
import { BrokerLoginPanel } from '@features/auth/components/BrokerLoginPanel';
import { useLoginPage } from '@features/auth/hooks/useLoginPage';

function LoginPage() {
  const loginPage = useLoginPage();

  return (
    <AuthShell eyebrow="External identity" title="Login">
      <BrokerLoginPanel
        error={loginPage.error}
        isBusy={loginPage.isBusy}
        isReady={loginPage.isReady}
        onLogin={() => void loginPage.startLogin()}
      />
    </AuthShell>
  );
}

export const Component = LoginPage;
