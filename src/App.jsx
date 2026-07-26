import { lazy, Suspense } from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import NotificationProvider from '@/shared/providers/NotificationProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
import Home from './pages/Home';
import { getBlogUrl } from '@/lib/blogUrl';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const GoogleAuthCallback = lazy(() => import('./pages/GoogleAuthCallback'));
const AuthSSO = lazy(() => import('./pages/AuthSSO'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'));
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard'));
const ManagerAttendance = lazy(() => import('./pages/manager/ManagerAttendance'));
const ManagerLeave = lazy(() => import('./pages/manager/ManagerLeave'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminServices = lazy(() => import('./pages/admin/AdminServices'));
const AdminAppointments = lazy(() => import('./pages/admin/AdminAppointments'));
const AdminTreatments = lazy(() => import('./pages/admin/AdminTreatments'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));
const AdminEmailNotifications = lazy(() => import('./pages/admin/AdminEmailNotifications'));
const AdminAttendance = lazy(() => import('./pages/admin/AdminAttendance'));
const AdminLeave = lazy(() => import('./pages/admin/AdminLeave'));

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClientInstance}>
          <NotificationProvider>
            <Router>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/service" element={<ServiceDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
                  <Route path="/auth/sso" element={<AuthSSO />} />
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
                    <Route path="/admin/email" element={<AdminEmailNotifications />} />
                    <Route path="/admin/attendance" element={<AdminAttendance />} />
                    <Route path="/admin/leave" element={<AdminLeave />} />
                  </Route>

                  <Route path="*" element={<PageNotFound />} />
                </Routes>
              </Suspense>
            </Router>
            <SonnerToaster position="top-right" richColors closeButton />
          </NotificationProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

function BlogRedirect() {
  window.location.href = getBlogUrl();
  return null;
}

export default App;
