import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import NotificationProvider from '@/shared/providers/NotificationProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
import Home from './pages/Home';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminServices from './pages/admin/AdminServices';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminTreatments from './pages/admin/AdminTreatments';
import AdminSettings from './pages/admin/AdminSettings';
import AdminMessages from './pages/admin/AdminMessages';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminLeave from './pages/admin/AdminLeave';
import ManagerLeave from './pages/manager/ManagerLeave';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerAttendance from './pages/manager/ManagerAttendance';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import Account from './pages/Account';
import ServiceDetail from './pages/ServiceDetail';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';

const BLOG_URL = import.meta.env.VITE_BLOG_URL || 'http://blog.localhost:5174';

function BlogRedirect() {
  window.location.href = BLOG_URL;
  return null;
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClientInstance}>
          <NotificationProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/service" element={<ServiceDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/blog" element={<BlogRedirect />} />
                <Route path="/blog/*" element={<BlogRedirect />} />

                <Route element={<ProtectedRoute roles={['customer', 'admin', 'staff']} />}>
                  <Route path="/account" element={<Navigate to="/customer" replace />} />
                  <Route path="/customer" element={<CustomerDashboard />} />
                </Route>

                <Route element={<ProtectedRoute roles={['staff', 'admin']} />}>
                  <Route path="/staff" element={<ManagerDashboard />} />
                  <Route path="/staff/appointments" element={<AdminAppointments role="staff" />} />
                  <Route path="/staff/services" element={<AdminServices role="staff" />} />
                  <Route path="/staff/treatments" element={<AdminTreatments role="staff" />} />
                  <Route path="/staff/attendance" element={<ManagerAttendance />} />
                  <Route path="/staff/leave" element={<ManagerLeave />} />
                  <Route path="/manager" element={<Navigate to="/staff" replace />} />
                  <Route path="/manager/*" element={<Navigate to="/staff" replace />} />
                </Route>

                <Route element={<ProtectedRoute roles={['admin']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/services" element={<AdminServices role="admin" />} />
                  <Route path="/admin/appointments" element={<AdminAppointments role="admin" />} />
                  <Route path="/admin/treatments" element={<AdminTreatments role="admin" />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/messages" element={<AdminMessages />} />
                  <Route path="/admin/attendance" element={<AdminAttendance />} />
                  <Route path="/admin/leave" element={<AdminLeave />} />
                </Route>

                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </Router>
            <Toaster />
          </NotificationProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
