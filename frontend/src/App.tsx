import { createBrowserRouter, RouterProvider } from 'react-router';
import { HomePage } from '@/pages/HomePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { MoneyManagementPage } from '@/pages/MoneyManagementPage';
import { PreApprovalPage } from '@/pages/PreApproval/PreApprovalPage';
import { LearningPage } from '@/pages/LearningPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { HomesPage } from '@/pages/HomesPage';
import { OkrPage } from '@/pages/OkrPage';
import { OnboardingGate } from '@/components/OnboardingGate';

const router = createBrowserRouter([
  { path: '/',    Component: HomePage },
  { path: '/login', Component: LoginPage },
  { path: '/learning', Component: LearningPage },
  {
    Component: OnboardingGate,
    children: [
      { path: '/dashboard',        Component: DashboardPage },
      { path: '/money-management', Component: MoneyManagementPage },
      { path: '/pre-approval',     Component: PreApprovalPage },
      { path: '/profile',          Component: ProfilePage },
      { path: '/homes',            Component: HomesPage },
      { path: '/okrs',             Component: OkrPage },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
