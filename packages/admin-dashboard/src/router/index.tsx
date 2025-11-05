import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { PublicRoute } from '../components/PublicRoute';
import { AdminLayout } from '../layouts/AdminLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ReleasesPage } from '../pages/ReleasesPage';
import { ModulesPage } from '../pages/ModulesPage';
import { AnnouncementsPage } from '../pages/AnnouncementsPage';
import { LogsPage } from '../pages/LogsPage';
import { SettingsPage } from '../pages/SettingsPage';

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'releases', element: <ReleasesPage /> },
          { path: 'modules', element: <ModulesPage /> },
          { path: 'announcements', element: <AnnouncementsPage /> },
          { path: 'logs', element: <LogsPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
