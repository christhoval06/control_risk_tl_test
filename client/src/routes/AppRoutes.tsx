import { createBrowserRouter, redirect, RouterProvider } from 'react-router';
import { AuthGate } from '@routes/AuthGate';

export const appRoutes = [
  {
    path: '/',
    loader: () => redirect('/login')
  },
  {
    path: '/login',
    lazy: () => import('@features/auth/pages/LoginPage')
  },
  {
    path: '/auth/callback',
    lazy: () => import('@features/auth/pages/AuthCallbackPage')
  },
  {
    path: '/register',
    lazy: () => import('@features/auth/pages/RegisterPage')
  },
  {
    element: <AuthGate />,
    children: [
      {
        path: '/tasks',
        lazy: () => import('@features/tasks/pages/TaskManagementPage')
      }
    ]
  },
  {
    path: '*',
    loader: () => redirect('/login')
  }
];

const router = createBrowserRouter(appRoutes);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
