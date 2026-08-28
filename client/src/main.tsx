import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import '@styles/styles.css';
import { AppRoutes } from '@routes/AppRoutes';
import { ThemeSwitcher } from '@components/ThemeSwitcher';
import { Toaster } from '@components/ui/Toaster';
import { createAppQueryClient } from '@configs/queryClient';
import { AuthProvider } from '@features/auth/providers/AuthProvider';

const queryClient = createAppQueryClient();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <ThemeSwitcher />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
