import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const AdminProtectedRoute = ({ children }: Props) => {
  const djData = localStorage.getItem('dj_user');
  if (!djData) return <Navigate to="/dj/login" replace />;

  try {
    const parsed = JSON.parse(djData);
    const masterEmail = 'ecmusic@eventos.com';
    const userEmail = parsed?.user?.email || '';
    const userRole = parsed?.user?.role || '';
    
    // Si es el email maestro, permitimos el paso por seguridad, ignorando mayúsculas
    const isMaster = userEmail.toLowerCase() === masterEmail.toLowerCase();
    
    if (!parsed?.access_token || (!isMaster && userRole !== 'ADMIN')) {
      return <Navigate to="/dj/home" replace />;
    }
  } catch {
    localStorage.removeItem('dj_user');
    return <Navigate to="/dj/login" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
