// client/src/App.jsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './app/AuthContext';
import { SocketProvider } from './app/SocketProvider';
import { ThemeProvider } from './app/ThemeContext';
import { ToastProvider } from './app/ToastContext';
import ProtectedRoute from './app/ProtectedRoute';
import AdminRoute from './app/AdminRoute';
import AppLayout from './components/layout/AppLayout';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DeviceCenterPage = lazy(() => import('./pages/DeviceCenterPage'));
const DeviceDetailsPage = lazy(() => import('./pages/DeviceDetailsPage'));
const LiveTrackingPage = lazy(() => import('./pages/LiveTrackingPage'));
const DeviceHistoryPage = lazy(() => import('./pages/DeviceHistoryPage'));
const DeviceStopsPage = lazy(() => import('./pages/DeviceStopsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const HelpCenterPage = lazy(() => import('./pages/static/HelpCenterPage'));
const ContactUsPage = lazy(() => import('./pages/static/ContactUsPage'));
const AboutPage = lazy(() => import('./pages/static/AboutPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/static/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/static/TermsPage'));
const NotFoundPage = lazy(() => import('./pages/static/NotFoundPage'));

function Protected({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/login" element={<LoginPage />} />

                <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
                <Route path="/devices" element={<Protected><DeviceCenterPage /></Protected>} />
                <Route path="/devices/:id" element={<Protected><DeviceDetailsPage /></Protected>} />
                <Route path="/tracking" element={<Protected><LiveTrackingPage /></Protected>} />
                <Route path="/history" element={<Protected><DeviceHistoryPage /></Protected>} />
                <Route path="/devices/:id/stops" element={<Protected><DeviceStopsPage /></Protected>} />
                <Route
                  path="/analytics"
                  element={
                    <AdminRoute>
                      <AppLayout>
                        <AnalyticsPage />
                      </AppLayout>
                    </AdminRoute>
                  }
                />                <Route path="/notifications" element={<Protected><NotificationsPage /></Protected>} />
                <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
                <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />

                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AppLayout>
                        <AdminPage />
                      </AppLayout>
                    </AdminRoute>
                  }
                />

                <Route path="/help" element={<HelpCenterPage />} />
                <Route path="/contact" element={<ContactUsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsPage />} />

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}