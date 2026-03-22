import { createBrowserRouter, RouterProvider } from 'react-router';
import { HomePage } from '@/pages/HomePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { MoneyManagementPage } from '@/pages/MoneyManagementPage';
import { PreApprovalPage } from '@/pages/PreApproval/PreApprovalPage';
import { PlaceHolder1 } from '@/pages/PlaceHolder1';
import { PlaceHolder2 } from '@/pages/PlaceHolder2';
import { PlaceHolder3 } from '@/pages/PlaceHolder3';
import { PlaceHolder4 } from '@/pages/PlaceHolder4';

const router = createBrowserRouter([
  { path: '/',              Component: HomePage },
  { path: '/dashboard',     Component: DashboardPage },
  { path: '/login',         Component: LoginPage },
  { path: '/money-management', Component: MoneyManagementPage },
  { path: '/pre-approval',  Component: PreApprovalPage },
  { path: '/page1',         Component: PlaceHolder1 },
  { path: '/page2',         Component: PlaceHolder2 },
  { path: '/page3',         Component: PlaceHolder3 },
  { path: '/page4',         Component: PlaceHolder4 },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
