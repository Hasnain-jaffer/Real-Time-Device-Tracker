// client/src/App.jsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './app/AuthContext';
import { SocketProvider } from './app/SocketProvider';
import { ThemeProvider } from './app/ThemeContext';
import { ToastProvider } from './app/ToastContext';
import { useTheme } from './app/ThemeContext';
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

/* ─── SVG Icon ─── */
const IconLoader = ({ size = 24, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M4.93 4.93l2.83 2.83" />
    <path d="M16.24 16.24l2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="M4.93 19.07l2.83-2.83" />
    <path d="M16.24 7.76l2.83-2.83" />
  </svg>
);

/* ─── Tokens ─── */
const lightTokens = {
  '--bg-page': '#F4EFE6',
  '--accent-primary': '#5E8C61',
};

const darkTokens = {
  '--bg-page': '#12181A',
  '--accent-primary': '#79B37C',
};

function PageLoader() {
  const { theme } = useTheme();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ ...tokens, backgroundColor: 'var(--bg-page)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px] pointer-events-none"
        style={{ backgroundColor: 'var(--accent-primary)' }}
      />

      <div className="relative">
        <div
          className="w-10 h-10 flex items-center justify-center"
          style={{ color: 'var(--accent-primary)' }}
        >
          <IconLoader size={32} className="animate-spin" />
        </div>
      </div>
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
                />
                <Route path="/notifications" element={<Protected><NotificationsPage /></Protected>} />
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