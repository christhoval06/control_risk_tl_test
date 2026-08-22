import { createBrowserRouter, redirect, RouterProvider } from 'react-router';
import { AuthGate } from '@routes/AuthGate';

const router = createBrowserRouter([
  {
    path: '/',
    loader: () => redirect('/login')
  },
  {
    path: '/login',
    lazy: () => import('@features/auth/pages/LoginPage')
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
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
