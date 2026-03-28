import { createBrowserRouter, RouterProvider } from 'react-router';
import { HomePage } from '@/pages/HomePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { MoneyManagementPage } from '@/pages/MoneyManagementPage';
import { PreApprovalPage } from '@/pages/PreApproval/PreApprovalPage';
import { LearningPage } from '@/pages/LearningPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { HomesPage } from '@/pages/HomesPage';

const router = createBrowserRouter([
  { path: '/',              Component: HomePage },
  { path: '/dashboard',     Component: DashboardPage },
  { path: '/login',         Component: LoginPage },
  { path: '/money-management', Component: MoneyManagementPage },
  { path: '/pre-approval',  Component: PreApprovalPage },
  { path: '/learning',      Component: LearningPage },
  { path: '/profile',       Component: ProfilePage },
  { path: '/homes',         Component: HomesPage },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
