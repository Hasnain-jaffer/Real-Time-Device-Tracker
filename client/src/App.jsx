// client/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './app/AuthContext';
import { SocketProvider } from './app/SocketProvider';
import { ThemeProvider } from './app/ThemeContext';
import ProtectedRoute from './app/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LiveTrackingPage from './pages/LiveTrackingPage';
import DeviceHistoryPage from './pages/DeviceHistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import HelpCenterPage from './pages/static/HelpCenterPage';
import ContactUsPage from './pages/static/ContactUsPage';
import AboutPage from './pages/static/AboutPage';
import PrivacyPolicyPage from './pages/static/PrivacyPolicyPage';
import TermsPage from './pages/static/TermsPage';
import NotFoundPage from './pages/static/NotFoundPage';

function Protected({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
              <Route path="/tracking" element={<Protected><LiveTrackingPage /></Protected>} />
              <Route path="/history" element={<Protected><DeviceHistoryPage /></Protected>} />
              <Route path="/notifications" element={<Protected><NotificationsPage /></Protected>} />
              <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
              <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />

              <Route path="/help" element={<HelpCenterPage />} />
              <Route path="/contact" element={<ContactUsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}