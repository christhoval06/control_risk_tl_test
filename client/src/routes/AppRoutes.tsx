import { createBrowserRouter, redirect, RouterProvider } from 'react-router';

const router = createBrowserRouter([
  {
    path: '/',
    loader: () => redirect('/tasks')
  },
  {
    path: '/tasks',
    lazy: () => import('@features/tasks/pages/TaskManagementPage')
  },
  {
    path: '*',
    loader: () => redirect('/tasks')
  }
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
