// client/src/app/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { isLoading } = useAuth();
  const token = localStorage.getItem('accessToken');

  if (isLoading) return null; // could render a spinner here later

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}