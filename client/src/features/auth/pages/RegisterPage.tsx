import { Navigate } from 'react-router';
import { AuthShell } from '@features/auth/components/AuthShell';
import { RegisterProfileForm } from '@features/auth/components/RegisterProfileForm';
import { useRegisterPage } from '@features/auth/hooks/useRegisterPage';

function RegisterPage() {
  const registerPage = useRegisterPage();

  if (!registerPage.token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AuthShell eyebrow="Application profile" title="Register">
      <RegisterProfileForm
        defaultValues={registerPage.defaultValues}
        error={registerPage.error}
        isSaving={registerPage.isSaving}
        onSubmit={registerPage.submit}
      />
    </AuthShell>
  );
}

export const Component = RegisterPage;
