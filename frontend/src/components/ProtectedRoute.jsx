import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from './ui';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen"><Loader label="Loading your account…" /></div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
